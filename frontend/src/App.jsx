import { useEffect, useMemo, useState } from "react";
import { CatalogPage } from "./pages/CatalogPage.jsx";
import { ProductFormPage } from "./pages/ProductFormPage.jsx";
import { login, createOrder, listOrders } from "./services/storeService.js";
import { describeError } from "./services/apiClient.js";

const readStored = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

export function App() {
  const [view, setView] = useState(() => location.hash.slice(1) || "catalog");
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [cart, setCart] = useState(() => readStored("storeCart", []));
  const [user, setUser] = useState(() => readStored("storeUser", null));
  const [cartError, setCartError] = useState("");
  useEffect(() => { localStorage.setItem("storeCart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { const change = () => setView(location.hash.slice(1) || "catalog"); addEventListener("hashchange", change); return () => removeEventListener("hashchange", change); }, []);
  function navigate(name) { location.hash = name; setView(name); }
  const count = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  function add(product) { setCart(current => { const found = current.find(item => item.id === product.id); return found ? current.map(item => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item) : [...current, { ...product, quantity: 1 }]; }); setNotice("Producto agregado al carrito."); }
  function handleSaved(message) { setRevision(value => value + 1); setNotice(message); navigate("catalog"); }
  async function submitLogin(event) { event.preventDefault(); setCartError(""); try { const data = await login(event.currentTarget.username.value, event.currentTarget.password.value); localStorage.setItem("storeToken", data.token); localStorage.setItem("storeUser", JSON.stringify(data.user)); setUser(data.user); navigate("catalog"); } catch (error) { setCartError(describeError(error)); } }
  function logout() { localStorage.removeItem("storeToken"); localStorage.removeItem("storeUser"); setUser(null); navigate("catalog"); }
  async function checkout() { setCartError(""); try { await createOrder(cart); setCart([]); setNotice("Pedido creado. Las existencias fueron actualizadas por el servidor."); navigate("orders"); } catch (error) { setCartError(describeError(error)); } }
  if (view === "create" || view.startsWith("edit")) return <ProductFormPage productId={view.startsWith("edit:") ? view.split(":")[1] : null} onNavigate={() => navigate("catalog")} onSaved={handleSaved} />;
  if (view === "login") return <main className="store-page"><StoreHeader user={user} count={count} navigate={navigate} logout={logout}/><h1>Ingresar</h1><form className="store-form" onSubmit={submitLogin}><label>Usuario<input name="username" autoComplete="username" required /></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label><button className="button button-primary">Ingresar</button>{cartError && <p role="alert">{cartError}</p>}</form></main>;
  if (view === "cart") return <CartPage cart={cart} setCart={setCart} error={cartError} checkout={checkout} navigate={navigate} user={user}/>;
  if (view === "orders") return <OrdersPage user={user} navigate={navigate}/>;
  if (view.startsWith("product:")) return <ProductDetail id={view.split(":")[1]} add={add} navigate={navigate}/>;
  return <div className="store-page"><StoreHeader user={user} count={count} navigate={navigate} logout={logout}/><CatalogPage revision={revision} notice={notice} onDismissNotice={() => setNotice("")} onAddToCart={add} onNavigate={(target) => { if(target.name === "edit") navigate(`edit:${target.productId}`); else if(target.name === "detail") navigate(`product:${target.productId}`); else navigate(target.name); }}/></div>;
}

function StoreHeader({ user, count, navigate, logout }) { return <header className="store-header"><button className="store-brand" onClick={() => navigate("catalog")}>Tienda DAE</button><nav><button onClick={() => navigate("catalog")}>Catálogo</button><button onClick={() => navigate("cart")}>Carrito ({count})</button>{user ? <><button onClick={() => navigate("orders")}>Mis pedidos</button><span>Hola, {user.first_name || user.username}</span><button onClick={logout}>Salir</button></> : <button onClick={() => navigate("login")}>Ingresar</button>}</nav></header>; }
function CartPage({ cart, setCart, error, checkout, navigate, user }) { const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0); return <main className="store-page"><StoreHeader user={user} count={cart.reduce((s,i)=>s+i.quantity,0)} navigate={navigate}/><h1>Carrito</h1>{cart.length ? <><ul>{cart.map(item => <li key={item.id}><b>{item.name}</b> — S/ {item.price} <input aria-label={`Cantidad de ${item.name}`} type="number" min="1" max={item.stock} value={item.quantity} onChange={e => setCart(current => current.map(row => row.id === item.id ? {...row, quantity: Math.max(1, Math.min(item.stock, Number(e.target.value)))} : row))}/><button onClick={() => setCart(current => current.filter(row => row.id !== item.id))}>Quitar</button></li>)}</ul><p>Total provisional: <b>S/ {total.toFixed(2)}</b></p><small>El servidor confirmará el total con los precios vigentes al crear el pedido.</small><p><button className="button button-primary" onClick={() => user ? checkout() : navigate("login")}>{user ? "Crear pedido" : "Ingresa para continuar"}</button></p></> : <p>Tu carrito está vacío.</p>}{error && <p role="alert">{error}</p>}</main>; }
function OrdersPage({ user, navigate }) { const [orders,setOrders]=useState([]),[error,setError]=useState(""); useEffect(()=>{if(user) listOrders().then(setOrders).catch(e=>setError(describeError(e)));},[user]); return <main className="store-page"><StoreHeader user={user} navigate={navigate}/><h1>Mis pedidos</h1>{!user ? <p>Ingresa para consultar tus pedidos.</p> : error ? <p role="alert">{error}</p> : orders.map(o=><article className="order-card" key={o.id}><h2>Pedido #{o.id} · {o.status}</h2><p>{new Date(o.created_at).toLocaleString()}</p><ul>{o.items.map(i=><li key={i.id}>{i.quantity} × {i.product_name} · S/ {i.unit_price}</li>)}</ul><b>Total S/ {Number(o.total).toFixed(2)}</b></article>)}</main>; }
function ProductDetail({ id, add, navigate }) { const [product,setProduct]=useState(null),[error,setError]=useState(""); useEffect(()=>{import("./services/productService.js").then(m=>m.getProduct(id)).then(setProduct).catch(e=>setError(describeError(e)));},[id]); return <main className="store-page"><StoreHeader navigate={navigate}/>{error && <p role="alert">{error}</p>}{product && <article className="order-card"><button onClick={()=>navigate("catalog")}>← Catálogo</button><h1>{product.name}</h1><p>{product.description}</p><p>S/ {product.price} · Disponibles: {product.stock}</p><button className="button button-primary" disabled={!product.stock} onClick={()=>add(product)}>Agregar al carrito</button></article>}</main>; }
