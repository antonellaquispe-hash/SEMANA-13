const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function ProductCard({ product, onEdit, onDelete, deleting = false }) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img
          className="product-image"
          src={product.image || "/placeholder-product.svg"}
          alt={`Imagen de ${product.name}`}
          loading="lazy"
        />
        <span className="product-category-badge">{product.category?.name ?? "Sin categoría"}</span>
      </div>

      <div className="product-card-body">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-category-description">
          {product.category?.description ?? "Categoría no disponible"}
        </p>
        <p className="product-description">{product.description}</p>

        <div className="product-meta">
          <span className="product-price">{money.format(Number(product.price))}</span>
          <span className={`product-stock${product.stock > 0 ? "" : " is-empty"}`}>
            {product.stock} existencias
          </span>
        </div>

        <div className="product-actions">
          <button type="button" className="button button-subtle" onClick={() => onEdit(product)}>
            Editar
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={() => onDelete(product)}
            disabled={deleting}
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </article>
  );
}
