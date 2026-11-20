import { apiClient, fetchAll } from "./apiClient.js";

function buildPayload({ name, description, price, stock, categoryId, image }) {
  if (image) {
    // Con archivo hay que usar multipart/form-data; la categoría sigue
    // enviándose como category_id, que es el campo de escritura del API.
    const form = new FormData();
    form.append("name", name);
    form.append("description", description);
    form.append("price", String(price));
    form.append("stock", String(stock));
    form.append("category_id", String(categoryId));
    form.append("image", image);
    return form;
  }
  return { name, description, price, stock, category_id: categoryId };
}

export async function listProducts({ categoryId, signal } = {}) {
  const params = categoryId ? { category: categoryId } : {};
  return fetchAll("products/", params, signal);
}

export async function getProduct(id, signal) {
  const { data } = await apiClient.get(`products/${id}/`, { signal });
  return data;
}

export async function createProduct(payload) {
  const { data } = await apiClient.post("products/", buildPayload(payload));
  return data;
}

export async function updateProduct(id, payload) {
  const { data } = await apiClient.patch(`products/${id}/`, buildPayload(payload));
  return data;
}

export async function deleteProduct(id) {
  await apiClient.delete(`products/${id}/`);
}
