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

## Semana 14 — Autenticación, pedidos y carrito

| Servidor Django | Cliente React |
|---|---|
| `catalog.Order` guarda usuario, fecha y estado inicial `pending`. | `StoreHeader` muestra identidad, acceso a pedidos, salida y contador persistente. |
| `catalog.OrderItem` conserva producto, cantidad y precio unitario al comprar. | `storeService.js` concentra ingreso, creación y consulta de pedidos. |
| `POST /api/auth/login/` valida con Django y devuelve identidad y token DRF. | Formulario de ingreso conserva usuario/token en `localStorage` y presenta errores. |
| `/api/orders/` requiere autenticación, filtra por usuario y calcula precios desde el servidor. | Catálogo, detalle, carrito, ingreso y mis pedidos se navegan con rutas hash. |
| La creación es atómica, verifica existencias, guarda el precio vigente y descuenta stock. | Carrito compartido en `App`, persistido entre recargas; cantidades editables y eliminación. |
| Admin registra Order con sus líneas dentro del formulario. | El total del carrito se identifica como provisional hasta confirmación del servidor. |

### Decisión de existencias y concurrencia

El stock se descuenta al crear el pedido: la API confirma el pedido únicamente si puede reservar todas sus líneas y guarda el precio vigente. La operación usa una transacción y `select_for_update`; en SQLite, usado por esta práctica, el bloqueo por fila no ofrece la misma garantía concurrente que PostgreSQL. En producción se recomienda PostgreSQL y transacciones con bloqueo de filas o una actualización condicional atómica (`stock >= cantidad`) para impedir sobreventa cuando llegan pedidos simultáneos. Un pago posterior debería confirmar la reserva o liberarla al cancelar o expirar.

### Pruebas manuales de laboratorio

1. Ejecutar `python manage.py migrate` y `python manage.py createsuperuser`; en `/admin/` crear dos usuarios de prueba con credenciales acordadas en clase.
2. Ingresar en React. Probar una contraseña incorrecta y registrar `400` con el mensaje de credenciales incorrectas; un ingreso válido devuelve `token` y `user`.
3. Desde el cliente REST, llamar `POST /api/auth/login/` con JSON `{ "username": "…", "password": "…" }`. Usar `Authorization: Token <token>` en `GET /api/orders/`; sin token responde `401`.
4. Agregar productos al carrito, cambiar cantidades y recargar la página. El contador y las líneas deben mantenerse.
5. Crear un pedido y revisar `Mis pedidos` y el admin. El API calcula el total y descuenta existencias.
6. Dejar una unidad disponible y enviar dos pedidos consecutivos por una unidad. El primero debe responder `201`; el siguiente `400` por existencias insuficientes. La interfaz conserva el carrito y presenta el error.

Las credenciales no se incluyen en el repositorio. No se pudieron ejecutar las migraciones ni comprobaciones automáticas en este entorno porque Django no está instalado. Instala `requirements.txt` antes de iniciar el servidor.
