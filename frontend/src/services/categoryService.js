import { apiClient, fetchAll } from "./apiClient.js";

export async function listCategories(signal) {
  return fetchAll("categories/", {}, signal);
}

export async function getCategory(id, signal) {
  const { data } = await apiClient.get(`categories/${id}/`, { signal });
  return data;
}

export async function createCategory({ name, description }) {
  const { data } = await apiClient.post("categories/", { name, description });
  return data;
}

export async function updateCategory(id, { name, description }) {
  const { data } = await apiClient.patch(`categories/${id}/`, { name, description });
  return data;
}

export async function deleteCategory(id) {
  await apiClient.delete(`categories/${id}/`);
}
