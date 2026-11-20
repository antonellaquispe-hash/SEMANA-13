import { useState } from "react";
import { CatalogPage } from "./pages/CatalogPage.jsx";
import { ProductFormPage } from "./pages/ProductFormPage.jsx";

/** Navegación mínima de la SPA entre catálogo, alta y edición. */
export function App() {
  const [view, setView] = useState({ name: "catalog" });
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");

  function handleSaved(message) {
    setRevision((value) => value + 1); // el catálogo se recarga por servicio, sin recargar la página
    setNotice(message);
  }

  if (view.name === "create" || view.name === "edit") {
    return (
      <ProductFormPage
        productId={view.name === "edit" ? view.productId : null}
        onNavigate={setView}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <CatalogPage
      revision={revision}
      notice={notice}
      onDismissNotice={() => setNotice("")}
      onNavigate={setView}
    />
  );
}
