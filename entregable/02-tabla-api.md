# 2. Tabla de la API

Base: `http://127.0.0.1:8000/api/`. Los recursos del catálogo son públicos (`AllowAny`);
los del cuestionario (`exams`, `questions`, `choices`) mantienen el token de la semana 12.
Paginación global: 5 elementos por página; el cliente recorre `next` hasta juntar todos.

| Recurso | Método | Ruta | Cuerpo / parámetros | Resultado |
| --- | --- | --- | --- | --- |
| Categorías | `GET` | `categories/` | `?search=texto` | 200 · `{count, next, previous, results[]}` |
| Categorías | `POST` | `categories/` | `{name, description}` | 201 · categoría creada |
| Categoría | `GET` | `categories/{id}/` | — | 200 · categoría |
| Categoría | `PATCH` / `PUT` | `categories/{id}/` | `{name, description}` | 200 · categoría modificada |
| Categoría | `DELETE` | `categories/{id}/` | — | 204 |
| Productos | `GET` | `products/` | `?category={id}&search=texto` | 200 · lista con categoría anidada |
| Productos | `POST` | `products/` | `{name, description, price, stock, category_id, image?}` | 201 · producto creado |
| Producto | `GET` | `products/{id}/` | — | 200 · producto con categoría anidada |
| Producto | `PATCH` / `PUT` | `products/{id}/` | campos a modificar | 200 · producto actualizado |
| Producto | `DELETE` | `products/{id}/` | — | 204 |
| Esquema | `GET` | `schema/` | — | 200 · OpenAPI YAML |
| Documentación | `GET` | `docs/` | — | 200 · Swagger UI |

## Campos de la respuesta de producto

| Campo | Tipo | Origen | Observación |
| --- | --- | --- | --- |
| `id` | integer | `Product.id` | — |
| `name` | string | `Product.name` | — |
| `description` | string | `Product.description` | — |
| `price` | string decimal | `Product.price` | dos decimales |
| `stock` | integer | `Product.stock` | existencias |
| `image` | URL \| null | `Product.image` | servida desde `/media/` |
| `category` | object | `CategorySerializer` | **anidado**: `id`, `name`, `description`, `created_at` |
| `category_id` | — | `PrimaryKeyRelatedField(write_only)` | solo entrada |
| `created_at` | datetime | `Product.created_at` | solo lectura |

## Ejemplo real (`GET /api/products/?category=1`)

```json
{
  "count": 4,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Auriculares Bluetooth",
      "description": "Sonido inalámbrico con cancelación de ruido y 30 h de batería.",
      "price": "189.90",
      "stock": 24,
      "image": "http://127.0.0.1:8000/media/products/auriculares-bluetooth.png",
      "category": {
        "id": 1,
        "name": "Electrónica",
        "description": "Dispositivos y accesorios tecnológicos para el día a día.",
        "created_at": "2026-11-20T13:43:20.520520-05:00"
      },
      "created_at": "2026-11-20T13:43:20.541524-05:00"
    }
  ]
}
```

## Cliente React (capa de servicios)

```
src/services/apiClient.js      → axios con baseURL única + fetchAll() + describeError()
src/services/productService.js → listProducts, getProduct, createProduct, updateProduct, deleteProduct
src/services/categoryService.js→ listCategories, getCategory, createCategory, updateCategory, deleteCategory
```

Ningún componente importa `axios`: todos pasan por estos servicios. La dirección base se lee de
`VITE_API_BASE_URL` (por defecto `http://127.0.0.1:8000/api/`) en un solo archivo.
