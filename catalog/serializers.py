from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Category, Order, OrderItem, Product

User = get_user_model()


class CredentialSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "unit_price"]
        read_only_fields = ["unit_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    total = serializers.SerializerMethodField()
    class Meta:
        model = Order
        fields = ["id", "created_at", "status", "items", "total"]
        read_only_fields = ["created_at", "status", "total"]

    def get_total(self, order):
        return sum((item.unit_price * item.quantity for item in order.items.all()), start=0)

    def create(self, validated_data):
        from django.db import transaction
        from rest_framework import serializers as drf_serializers
        lines = validated_data.pop("items")
        if not lines:
            raise drf_serializers.ValidationError({"items": "El pedido debe incluir al menos un producto."})
        with transaction.atomic():
            order = Order.objects.create(user=self.context["request"].user)
            for line in lines:
                product = Product.objects.select_for_update().get(pk=line["product"].pk)
                quantity = line["quantity"]
                if quantity < 1:
                    raise drf_serializers.ValidationError({"items": "La cantidad debe ser al menos uno."})
                if product.stock < quantity:
                    raise drf_serializers.ValidationError({"stock": f"Existencias insuficientes para {product.name}; disponibles: {product.stock}."})
                OrderItem.objects.create(order=order, product=product, quantity=quantity, unit_price=product.price)
                product.stock -= quantity
                product.save(update_fields=["stock"])
        return order


class CategorySerializer(serializers.ModelSerializer):
    """Recurso de categoría: se usa por separado y dentro de cada producto."""

    class Meta:
        model = Category
        fields = ["id", "name", "description", "created_at"]
        read_only_fields = ["created_at"]


class ProductSerializer(serializers.ModelSerializer):
    """El producto devuelve la categoría completa (con su descripción).

    Para escribir se usa ``category_id``: el JSON de entrada envía el id y el
    JSON de salida devuelve el objeto anidado ``category``.
    """

    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
        write_only=True,
        label="id de categoría",
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "stock",
            "image",
            "category",
            "category_id",
            "created_at",
        ]
        read_only_fields = ["created_at"]
