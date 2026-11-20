export function CategoryFilter({ categories, value, onChange, disabled = false }) {
  return (
    <div className="category-filter">
      <label htmlFor="category-filter">Filtrar por categoría</label>
      <select
        id="category-filter"
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Todas las categorías</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
