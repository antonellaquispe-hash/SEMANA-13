from django.db import models


class Category(models.Model):
    """Una familia de productos del catálogo."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "categoría"
        verbose_name_plural = "categorías"

    def __str__(self):
        return self.name


class Product(models.Model):
    """Un artículo a la venta. La categoría se anida en el serializador."""

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="products",
        verbose_name="categoría",
    )
    name = models.CharField(max_length=150)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0, verbose_name="existencias")
    image = models.ImageField(
        upload_to="products/",
        blank=True,
        null=True,
        verbose_name="imagen",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "producto"
        verbose_name_plural = "productos"

    def __str__(self):
        return self.name
