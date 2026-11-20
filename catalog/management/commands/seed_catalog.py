"""Carga de demostración: 3 categorías y 10 productos con imagen propia.

Las imágenes se generan con Pillow al ejecutar el comando, de modo que no hay
que versionar binarios: basta con ``python manage.py seed_catalog``.
"""

import io
import os
import re
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from PIL import Image, ImageDraw, ImageFont

from catalog.models import Category, Product

CATEGORIES = [
    ("Electrónica", "Dispositivos y accesorios tecnológicos para el día a día.", "#146c63"),
    ("Hogar", "Artículos para hacer más cómodo y funcional tu espacio.", "#9a5b32"),
    ("Deporte", "Equipamiento y accesorios para mantenerte activo.", "#355c9e"),
]

PRODUCTS = [
    ("Electrónica", "Auriculares Bluetooth", "Sonido inalámbrico con cancelación de ruido y 30 h de batería.", "189.90", 24),
    ("Electrónica", "Cargador rápido 65 W", "Cargador de pared GaN con dos puertos USB-C.", "89.00", 40),
    ("Electrónica", "Altavoz portátil", "Altavoz resistente al agua con 12 h de reproducción.", "249.00", 9),
    ("Electrónica", "Smartwatch fitness", "Reloj inteligente con monitor cardíaco y GPS integrado.", "399.00", 5),
    ("Hogar", "Lámpara de escritorio LED", "Luz regulable con tres temperaturas de color y brazo articulado.", "129.50", 15),
    ("Hogar", "Organizador de escritorio", "Set de 6 compartimentos de madera para mantener el orden.", "49.90", 32),
    ("Hogar", "Difusor de aromas", "Difusor ultrasónico de 300 ml con apagado automático.", "79.90", 18),
    ("Deporte", "Botella térmica 750 ml", "Acero inoxidable, mantiene el frío 24 h y el calor 12 h.", "69.00", 28),
    ("Deporte", "Esterilla de yoga", "Superficie antideslizante de 6 mm con correa de transporte.", "119.00", 12),
    ("Deporte", "Mochila de trekking", "Mochila ligera de 28 L con cubierta impermeable.", "299.00", 7),
]


def _font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # Pillow antiguo
        return ImageFont.load_default()


def _wrap(text, width=20):
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) > width and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def build_image(product_name, category_name, color):
    """Dibuja una viñeta sencilla y devuelve los bytes PNG de la imagen."""
    image = Image.new("RGB", (640, 480), color)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((22, 22, 618, 458), radius=30, fill="#ffffff")
    draw.ellipse((472, 52, 588, 168), fill=color)
    draw.rounded_rectangle((62, 70, 176, 168), radius=18, fill=color)
    draw.text((90, 92), product_name[:1].upper(), fill="#ffffff", font=_font(52))

    y = 205
    for line in _wrap(product_name, 22)[:2]:
        draw.text((62, y), line, fill="#172226", font=_font(38))
        y += 50
    draw.line((62, y + 8, 578, y + 8), fill="#dfe6e3", width=4)
    draw.text((62, y + 28), category_name.upper(), fill=color, font=_font(26))
    draw.text((62, y + 66), "CATÁLOGO DAE · SEMANA 13", fill="#77817f", font=_font(20))

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


class Command(BaseCommand):
    help = "Carga 3 categorías y 10 productos con imagen, y crea el usuario admin de demostración."

    @transaction.atomic
    def handle(self, *args, **options):
        media_dir = Path(settings.MEDIA_ROOT) / "products"
        media_dir.mkdir(parents=True, exist_ok=True)
        for old_image in media_dir.glob("*.png"):
            old_image.unlink()

        Product.objects.all().delete()
        Category.objects.all().delete()

        categories = {}
        for name, description, color in CATEGORIES:
            categories[name] = Category.objects.create(name=name, description=description)

        for category_name, name, description, price, stock in PRODUCTS:
            product = Product(
                category=categories[category_name],
                name=name,
                description=description,
                price=price,
                stock=stock,
            )
            color = next(item[2] for item in CATEGORIES if item[0] == category_name)
            product.image.save(
                f"{_slug(name)}.png",
                ContentFile(build_image(name, category_name, color)),
                save=False,
            )
            product.save()

        password = os.environ.get("DJANGO_ADMIN_PASSWORD", "admin12345")
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={"is_staff": True, "is_superuser": True},
        )
        admin.is_staff = True
        admin.is_superuser = True
        if created or not admin.check_password(password):
            admin.set_password(password)
        admin.save()

        self.stdout.write(self.style.SUCCESS(
            f"Listo: {Category.objects.count()} categorías y {Product.objects.count()} productos con imagen."
        ))
        self.stdout.write(f"Administración: /admin/ con usuario 'admin' y contraseña '{password}'.")
