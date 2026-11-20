# Entregable — Semana 13: Catálogo de productos

Proyecto construido a partir del laboratorio de la semana 12 (`dae-lab08`): se conservaron el
API de cuestionarios, el cliente de consola `quizctl.py` y el frontend React, y se añadió una
aplicación Django `catalog` consumida por una SPA React.

## Contenido

| Documento | Qué registra |
| --- | --- |
| [01-diagrama.md](01-diagrama.md) | Diagrama entidad-relación del catálogo (Mermaid + SVG). |
| [02-tabla-api.md](02-tabla-api.md) | Tabla de recursos, métodos, parámetros y ejemplo con categoría anidada. |
| [03-capturas.md](03-capturas.md) | Capturas del catálogo, del filtrado por categoría, del formulario, del admin y de la API. |

## Cómo ejecutarlo

```powershell
# 1. Backend (raíz del repositorio)
py -m pip install -r requirements.txt
py manage.py migrate
py manage.py seed_catalog        # 3 categorías + 10 productos con imagen y usuario admin
py manage.py runserver 127.0.0.1:8000

# 2. Frontend
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

- Catálogo: <http://127.0.0.1:5173/>
- API: <http://127.0.0.1:8000/api/products/> y <http://127.0.0.1:8000/api/categories/>
- Documentación interactiva (Swagger): <http://127.0.0.1:8000/api/docs/>
- Administración: <http://127.0.0.1:8000/admin/> — usuario `admin`, contraseña `admin12345`
  (solo desarrollo; se puede cambiar con la variable `DJANGO_ADMIN_PASSWORD`).

## Pruebas

```powershell
py manage.py test                     # 75 pruebas del backend
cd frontend; npm test                 # 18 pruebas del cliente
cd frontend; npm run build            # compilación de producción
```

## Checks realizados en navegador

1. `GET /api/products/` devuelve `category` como objeto con `name`, `description` e `id`.
2. El catálogo carga 10 productos y 3 categorías desde el API.
3. El filtro «Electrónica» deja 4 productos y el «Deporte» 3; la petición enviada es
   `GET /api/products/?category=1` / `?category=3` (categorías del API, no hardcoded).
4. Alta de un producto desde el formulario → aviso y tarjeta nueva sin recargar.
5. Edición del mismo producto → precio actualizado a `S/ 29.90` en la tarjeta.
6. Borrado con confirmación → la tarjeta desaparece sin recargar la página.
7. Los dos modelos aparecen en `/admin/` con listados, filtros y búsqueda.
