import { useEffect, useState } from "react";
import { CategoryFilter } from "../components/CategoryFilter/CategoryFilter.jsx";
import { ProductCard } from "../components/ProductCard/ProductCard.jsx";
import { describeError } from "../services/apiClient.js";
import { listCategories } from "../services/categoryService.js";
import { deleteProduct, listProducts } from "../services/productService.js";

/**
 * Página del catálogo: carga por servicio dentro del efecto y muestra los
 * tres estados de la petición (loading / error / success).
 */
export function CatalogPage({ revision = 0, notice = "", onNavigate, onDismissNotice, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [retry, setRetry] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setStatus("loading");
    setError("");

    listProducts({ categoryId: categoryId || undefined, signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setProducts(data);
        setStatus("success");
      })
      .catch((requestError) => {
        if (!active) return;
        const message = describeError(requestError);
        if (!message) return; // petición cancelada al cambiar el filtro
        setError(message);
        setStatus("error");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [categoryId, revision, retry]);

  // Las categorías del filtro vienen del API; no están escritas a mano.
  useEffect(() => {
    const controller = new AbortController();
    listCategories(controller.signal)
      .then((data) => setCategories(data))
      .catch((requestError) => {
        const message = describeError(requestError);
        if (message) setCategoryError(message);
      });
    return () => controller.abort();
  }, []);

  const activeCategory = categories.find((category) => String(category.id) === String(categoryId));

  function handleDelete(product) {
    if (!window.confirm(`¿Eliminar "${product.name}" del catálogo?`)) return;
    setDeletingId(product.id);
    setError("");
    deleteProduct(product.id)
      .then(() => setProducts((current) => current.filter((item) => item.id !== product.id)))
      .catch((requestError) => setError(describeError(requestError)))
      .finally(() => setDeletingId(null));
  }

  return (
    <div className="page-shell catalog-shell">
      <header className="catalog-topbar">
        <div className="brand">
          <span className="brand-mark">CD</span>
          <span>Catálogo <span className="brand-light">DAE</span></span>
        </div>
        <div className="topbar-actions">
          <span className="status-dot" aria-hidden="true" />
          <span>API conectada</span>
          <button
            type="button"
            className="button button-primary"
            onClick={() => onNavigate({ name: "create" })}
          >
            + Nuevo producto
          </button>
        </div>
      </header>

      <section className="catalog-hero">
        <p className="hero-kicker">DAE · SEMANA 13 · CATÁLOGO</p>
        <h1>Tu tienda, lista para crecer</h1>
        <p className="hero-description">
          Productos con su categoría anidada, traídos directamente desde la API de Django.
        </p>
      </section>

      <main className="catalog-main">
        {notice && (
          <div className="notice notice-success" role="status">
            {notice}
            <button type="button" className="notice-close" onClick={onDismissNotice} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        )}

        <div className="toolbar">
          <div className="toolbar-copy">
            <h2>Productos</h2>
            <span className="count-pill" aria-live="polite">
              {status === "success" ? products.length : "…"} artículos
            </span>
          </div>
          <CategoryFilter
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            disabled={categories.length === 0}
          />
        </div>

        {categoryError && <div className="notice notice-error" role="alert">{categoryError}</div>}
        {error && status === "success" && <div className="notice notice-error" role="alert">{error}</div>}

        {status === "loading" && (
          <div className="state-card" role="status" aria-busy="true">
            <span className="spinner" aria-hidden="true" />
            <p>Cargando catálogo…</p>
          </div>
        )}

        {status === "error" && (
          <div className="state-card state-error" role="alert">
            <span className="state-symbol" aria-hidden="true">!</span>
            <p>{error || "No se pudo cargar el catálogo."}</p>
            <button type="button" className="button button-primary" onClick={() => setRetry((value) => value + 1)}>
              Reintentar
            </button>
          </div>
        )}

        {status === "success" && products.length === 0 && (
          <div className="state-card" role="status">
            <span className="empty-symbol" aria-hidden="true">◇</span>
            <p>No hay productos en esta categoría.</p>
          </div>
        )}

        {status === "success" && products.length > 0 && (
          <>
            <p className="filter-summary" aria-live="polite">
              {activeCategory
                ? `Mostrando ${products.length} producto(s) de “${activeCategory.name}”`
                : `Mostrando los ${products.length} productos del catálogo`}
            </p>
            <section className="product-grid" aria-label="Listado de productos">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  deleting={deletingId === product.id}
                  onEdit={(item) => onNavigate({ name: "edit", productId: item.id })}
                  onDelete={handleDelete}
                  onAddToCart={onAddToCart}
                  onDetail={(item) => onNavigate({ name: "detail", productId: item.id })}
                />
              ))}
            </section>
          </>
        )}
      </main>

      <footer className="catalog-footer">
        Catálogo DAE · Django REST Framework + React · Semana 13
      </footer>
    </div>
  );
}
