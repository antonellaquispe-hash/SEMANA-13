from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.models import Category, Product


class CatalogApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.tech = Category.objects.create(
            name="Tecnología", description="Dispositivos electrónicos."
        )
        cls.home = Category.objects.create(
            name="Hogar", description="Artículos para el hogar."
        )
        cls.laptop = Product.objects.create(
            category=cls.tech,
            name="Portátil",
            description="Portátil ligero de 14 pulgadas.",
            price=Decimal("1299.00"),
            stock=4,
        )
        cls.lamp = Product.objects.create(
            category=cls.home,
            name="Lámpara",
            description="Lámpara de escritorio.",
            price=Decimal("59.90"),
            stock=12,
        )

    def test_product_list_returns_nested_category_with_description(self):
        response = self.client.get(reverse("product-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = next(row for row in response.data["results"] if row["id"] == self.laptop.id)
        self.assertEqual(item["category"]["id"], self.tech.id)
        self.assertEqual(item["category"]["name"], "Tecnología")
        self.assertEqual(item["category"]["description"], "Dispositivos electrónicos.")
        self.assertNotIn("category_id", item)  # campo de escritura

    def test_products_can_be_filtered_by_category(self):
        response = self.client.get(reverse("product-list"), {"category": self.home.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["results"])
        self.assertTrue(all(row["category"]["id"] == self.home.id for row in response.data["results"]))

    def test_create_product_with_category_id(self):
        payload = {
            "name": "Ratón",
            "description": "Ratón inalámbrico.",
            "price": "29.90",
            "stock": 20,
            "category_id": self.tech.id,
        }
        response = self.client.post(reverse("product-list"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["category"]["description"], "Dispositivos electrónicos.")
        self.assertTrue(Product.objects.filter(name="Ratón").exists())

    def test_update_and_delete_product(self):
        detail = reverse("product-detail", args=[self.laptop.id])
        response = self.client.patch(detail, {"stock": 9}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.laptop.refresh_from_db()
        self.assertEqual(self.laptop.stock, 9)

        response = self.client.delete(detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(pk=self.laptop.id).exists())

    def test_category_list(self):
        response = self.client.get(reverse("category-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)
