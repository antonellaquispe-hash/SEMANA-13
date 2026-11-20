from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import filters, viewsets
from rest_framework.permissions import AllowAny

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD de categorías. El catálogo es público: no pide token de acceso."""

    serializer_class = CategorySerializer
    queryset = Category.objects.all()
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter(
                "category",
                int,
                description="Solo los productos de esta categoría (id).",
            ),
        ]
    )
)
class ProductViewSet(viewsets.ModelViewSet):
    """CRUD de productos con la categoría anidada en la respuesta."""

    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]

    def get_queryset(self):
        queryset = Product.objects.select_related("category").all()
        category = self.request.query_params.get("category")
        if category and category.isdigit():
            queryset = queryset.filter(category_id=int(category))
        return queryset
