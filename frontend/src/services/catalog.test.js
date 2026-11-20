import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  fetchAll: vi.fn(),
  describeError: vi.fn(),
}));

import { apiClient, fetchAll } from "./apiClient.js";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "./categoryService.js";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "./productService.js";

const productPayload = {
  name: "Auriculares",
  description: "Bluetooth",
  price: "189.90",
  stock: "24",
  categoryId: 1,
  image: null,
};

beforeEach(() => vi.clearAllMocks());

describe("productService", () => {
  it("pide el listado con el filtro de categoría", async () => {
    fetchAll.mockResolvedValue([]);
    await listProducts({ categoryId: 2 });
    expect(fetchAll).toHaveBeenCalledWith("products/", { category: 2 }, undefined);
  });

  it("usa category_id como campo de escritura", async () => {
    apiClient.post.mockResolvedValue({ data: { id: 9 } });
    await createProduct(productPayload);
    expect(apiClient.post).toHaveBeenCalledWith("products/", {
      name: "Auriculares",
      description: "Bluetooth",
      price: "189.90",
      stock: "24",
      category_id: 1,
    });
  });

  it("envía multipart cuando hay imagen", async () => {
    apiClient.patch.mockResolvedValue({ data: { id: 9 } });
    const image = new File(["x"], "foto.png", { type: "image/png" });
    await updateProduct(9, { ...productPayload, image });
    const body = apiClient.patch.mock.calls[0][1];
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("category_id")).toBe("1");
    expect(body.get("image")).toBe(image);
  });

  it("expone obtener uno y eliminar", async () => {
    apiClient.get.mockResolvedValue({ data: { id: 3 } });
    apiClient.delete.mockResolvedValue({});
    await getProduct(3);
    await deleteProduct(3);
    expect(apiClient.get).toHaveBeenCalledWith("products/3/", { signal: undefined });
    expect(apiClient.delete).toHaveBeenCalledWith("products/3/");
  });
});

describe("categoryService", () => {
  it("expone las cinco operaciones", async () => {
    fetchAll.mockResolvedValue([]);
    apiClient.get.mockResolvedValue({ data: { id: 1 } });
    apiClient.post.mockResolvedValue({ data: { id: 1 } });
    apiClient.patch.mockResolvedValue({ data: { id: 1 } });
    apiClient.delete.mockResolvedValue({});

    await listCategories();
    await getCategory(1);
    await createCategory({ name: "Hogar", description: "Artículos para el hogar." });
    await updateCategory(1, { name: "Hogar", description: "Actualizado." });
    await deleteCategory(1);

    expect(fetchAll).toHaveBeenCalledWith("categories/", {}, undefined);
    expect(apiClient.get).toHaveBeenCalledWith("categories/1/", { signal: undefined });
    expect(apiClient.post).toHaveBeenCalledWith("categories/", {
      name: "Hogar",
      description: "Artículos para el hogar.",
    });
    expect(apiClient.patch).toHaveBeenCalledWith("categories/1/", {
      name: "Hogar",
      description: "Actualizado.",
    });
    expect(apiClient.delete).toHaveBeenCalledWith("categories/1/");
  });
});
