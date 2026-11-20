# 3. Capturas del catálogo funcionando

## API con la categoría anidada

`GET /api/products/` → cada producto trae `category.description`, no solo el id.

![API con categoría anidada](capturas/01-api-productos-categoria-anidada.png)

## Catálogo completo (10 productos)

Tarjetas con imagen, precio, existencias y la descripción de la categoría anidada.

![Catálogo completo](capturas/02-catalogo-completo.png)

## Filtrado por categoría

El desplegable se llena con `GET /api/categories/`. Al elegir **Electrónica** la petición es
`GET /api/products/?category=1` y se muestran 4 productos.

![Filtrado por Electrónica](capturas/03-catalogo-filtrado-electronica.png)

Al elegir **Deporte**: `GET /api/products/?category=3` y 3 productos.

![Filtrado por Deporte](capturas/04-catalogo-filtrado-deporte.png)

## Alta, edición y borrado

Formulario controlado con la lista de categorías cargada por servicio:

![Formulario de alta](capturas/05-formulario-alta.png)

Tras crear, editar (precio `S/ 29.90`) y borrar un producto, el catálogo se actualiza sin recargar:

![Catálogo tras la edición](capturas/06-catalogo-tras-edicion.png)

## Administración de Django

Ambos modelos registrados con `list_display`, `list_filter` y `search_fields`:

![Admin de productos](capturas/07-admin-productos.png)
