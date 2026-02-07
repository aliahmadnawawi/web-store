const CART_KEY = "memberCart";

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw || "");
  } catch {
    return fallback;
  }
}

export function getCart() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CART_KEY);
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function setCart(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(Array.isArray(items) ? items : []));
}

export function addToCart(productId, qty = 1) {
  const id = String(productId || "").trim();
  if (!id) return;
  const items = getCart();
  const nextQty = Math.max(1, Number(qty) || 1);
  const idx = items.findIndex((it) => String(it?.productId) === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], qty: Math.min(99, (Number(items[idx].qty) || 1) + nextQty) };
    setCart(items);
    return;
  }
  setCart([...items, { productId: id, qty: nextQty }]);
}

export function removeFromCart(productId) {
  const id = String(productId || "").trim();
  if (!id) return;
  const items = getCart().filter((it) => String(it?.productId) !== id);
  setCart(items);
}

export function clearCart() {
  setCart([]);
}

