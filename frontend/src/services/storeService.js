import { apiClient, fetchAll } from "./apiClient.js";

export async function login(username, password) {
  const { data } = await apiClient.post("auth/login/", { username, password });
  return data;
}
export async function createOrder(items) {
  const { data } = await apiClient.post("orders/", { items: items.map(({ id, quantity }) => ({ product: id, quantity })) });
  return data;
}
export async function listOrders() { return fetchAll("orders/"); }
