import { useEffect, useState } from "react";
import { describeError } from "../services/apiClient.js";
import { listCategories } from "../services/categoryService.js";
import {
  createProduct,
  getProduct,
  updateProduct,
} from "../services/productService.js";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  categoryId: "",
};

/** Alta y edición comparten la misma página y los mismos servicios. */
export function ProductFormPage({ productId = null, onNavigate, onSaved }) {
  const isEdit = Boolean(productId);
  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listCategories(controller.signal)
      .then((data) => setCategories(data))
      .catch((requestError) => {
        const message = describeError(requestError);
        if (message) setError(message);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isEdit) return undefined;
    const controller = new AbortController();
    setLoading(true);
    getProduct(productId, controller.signal)
      .then((product) => {
        setForm({
          name: product.name,
          description: product.description,
          price: String(product.price),
          stock: String(product.stock),
          categoryId: String(product.category?.id ?? ""),
        });
        setCurrentImage(product.image || "");
        setLoading(false);
      })
      .catch((requestError) => {
        const message = describeError(requestError);
        if (message) setError(message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [isEdit, productId]);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.categoryId) {
      setError("Completa el nombre y selecciona una categoría.");
      return;
    }
    if (Number(form.price) < 0 || Number(form.stock) < 0) {
      setError("El precio y las existencias no pueden ser negativos.");
      return;
    }

    setSubmitting(true);
    const payload = { ...form, image };
    try {
      if (isEdit) {
        await updateProduct(productId, payload);
        onSaved(`Producto “${form.name}” actualizado.`);
      } else {
        await createProduct(payload);
        onSaved(`Producto “${form.name}” creado.`);
      }
      onNavigate({ name: "catalog" });
    } catch (requestError) {
      setError(describeError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell catalog-shell">
      <header className="catalog-topbar">
        <div className="brand">
          <span className="brand-mark">CD</span>
          <span>{isEdit ? "Editar producto" : "Nuevo producto"}</span>
        </div>
        <button type="button" className="button button-subtle" onClick={() => onNavigate({ name: "catalog" })}>
          ← Volver al catálogo
        </button>
      </header>

      <main className="form-page">
        <div className="form-card">
          <h1>{isEdit ? "Modificar producto" : "Dar de alta un producto"}</h1>
          <p className="form-intro">
            La categoría se carga desde el API y se envía como <code>category_id</code>.
          </p>

          {loading && <div className="state-card" role="status"><span className="spinner" />Cargando producto…</div>}

          {!loading && (
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-grid">
                <div className="field field-wide">
                  <label htmlFor="product-name">Nombre</label>
                  <input
                    id="product-name"
                    className="input"
                    value={form.name}
                    onChange={(event) => change("name", event.target.value)}
                    required
                  />
                </div>

                <div className="field field-wide">
                  <label htmlFor="product-description">Descripción</label>
                  <textarea
                    id="product-description"
                    className="input"
                    rows="3"
                    value={form.description}
                    onChange={(event) => change("description", event.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="product-price">Precio</label>
                  <input
                    id="product-price"
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(event) => change("price", event.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="product-stock">Existencias</label>
                  <input
                    id="product-stock"
                    className="input"
                    type="number"
                    step="1"
                    min="0"
                    value={form.stock}
                    onChange={(event) => change("stock", event.target.value)}
                    required
                  />
                </div>

                <div className="field field-wide">
                  <label htmlFor="product-category">Categoría</label>
                  <select
                    id="product-category"
                    className="input"
                    value={form.categoryId}
                    onChange={(event) => change("categoryId", event.target.value)}
                    required
                  >
                    <option value="">Selecciona una categoría…</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field field-wide">
                  <label htmlFor="product-image">Imagen (opcional)</label>
                  <input
                    id="product-image"
                    className="input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                  />
                  {isEdit && currentImage && !image && (
                    <img className="current-image" src={currentImage} alt="Imagen actual del producto" />
                  )}
                </div>
              </div>

              {error && <div className="notice notice-error" role="alert">{error}</div>}

              <div className="form-actions">
                <button type="button" className="button button-subtle" onClick={() => onNavigate({ name: "catalog" })}>
                  Cancelar
                </button>
                <button type="submit" className="button button-primary" disabled={submitting}>
                  {submitting
                    ? "Guardando…"
                    : isEdit ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
