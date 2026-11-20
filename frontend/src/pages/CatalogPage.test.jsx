import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogPage } from "./CatalogPage.jsx";

vi.mock("../services/productService.js", () => ({
  listProducts: vi.fn(),
  deleteProduct: vi.fn(),
}));
vi.mock("../services/categoryService.js", () => ({ listCategories: vi.fn() }));

import { listCategories } from "../services/categoryService.js";
import { listProducts } from "../services/productService.js";

const product = {
  id: 1,
  name: "Auriculares Bluetooth",
  description: "Sonido inalámbrico.",
  price: "189.90",
  stock: 24,
  image: "",
  category: {
    id: 1,
    name: "Electrónica",
    description: "Descripción de electrónica desde el API.",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  listProducts.mockResolvedValue([product]);
  listCategories.mockResolvedValue([product.category]);
});

describe("CatalogPage", () => {
  it("muestra la descripción de la categoría anidada", async () => {
    render(<CatalogPage onNavigate={() => {}} />);
    expect(await screen.findByText("Descripción de electrónica desde el API.")).toBeInTheDocument();
    expect(screen.getByText("Auriculares Bluetooth")).toBeInTheDocument();
  });

  it("carga las categorías del API para filtrar", async () => {
    render(<CatalogPage onNavigate={() => {}} />);
    expect(await screen.findByRole("option", { name: "Electrónica" })).toBeInTheDocument();
    expect(listCategories).toHaveBeenCalledTimes(1);
  });

  it("vuelve a pedir los productos al cambiar el filtro", async () => {
    render(<CatalogPage onNavigate={() => {}} />);
    await screen.findByText("Descripción de electrónica desde el API.");
    fireEvent.change(screen.getByLabelText("Filtrar por categoría"), { target: { value: "1" } });
    await waitFor(() => {
      expect(listProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: "1" }),
      );
    });
  });

  it("muestra el estado de error y permite reintentar", async () => {
    listProducts.mockRejectedValueOnce({ response: { status: 500, data: {} } });
    render(<CatalogPage onNavigate={() => {}} />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
