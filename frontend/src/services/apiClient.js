import axios from "axios";

// Único lugar donde se configura la dirección base de la API.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/";

export const apiClient = axios.create({
  baseURL: API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`,
  timeout: 8000,
  headers: { Accept: "application/json" },
});

// Los recursos del cuestionario siguen usando token; el catálogo es público.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("quizToken");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

/**
 * Recorre todas las páginas de un endpoint paginado de Django REST Framework.
 * Devuelve siempre un array, tanto si la API pagina como si no.
 */
export async function fetchAll(path, params = {}, signal) {
  const items = [];
  let next = path;
  let requestParams = params;

  while (next) {
    const response = await apiClient.get(next, { params: requestParams, signal });
    const page = response.data;
    items.push(...(Array.isArray(page) ? page : page.results ?? []));
    if (Array.isArray(page)) break;
    // La URL "next" ya incluye los filtros; no hay que volver a enviarlos.
    next = page.next;
    requestParams = {};
  }
  return items;
}

export function describeError(error) {
  if (axios.isCancel(error) || error?.code === "ERR_CANCELED") return "";
  if (!error?.response) {
    return "No se pudo conectar con la API. Comprueba que Django esté activo y vuelve a intentarlo.";
  }

  const { status, data } = error.response;
  if (status === 401) return "Token inválido o ausente. Revisa la credencial de acceso.";
  if (status === 403) return "Tu usuario no tiene permiso para realizar esta operación.";
  if (status === 404) return "El recurso ya no existe o la dirección solicitada no es válida.";
  if (status >= 500) return "La API tuvo un problema interno. Inténtalo de nuevo.";

  const messages = data && typeof data === "object"
    ? Object.values(data).flatMap((value) => (Array.isArray(value) ? value : [value]))
    : [];
  return messages.find((value) => typeof value === "string") || "La API rechazó la solicitud.";
}
