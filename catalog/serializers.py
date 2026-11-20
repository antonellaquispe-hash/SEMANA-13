from rest_framework import serializers

from .models import Category, Product


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
