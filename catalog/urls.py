from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import CategoryViewSet, LoginView, OrderViewSet, ProductViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [path("auth/login/", LoginView.as_view(), name="login")] + router.urls
