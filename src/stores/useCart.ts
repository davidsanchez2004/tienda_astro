// Cart utilities using localStorage - carritos independientes por usuario

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image_url: string;
  quantity: number;
  price: number;
}

// Variable para trackear el usuario actual en memoria
let currentUserIdInMemory: string | null = null;

// Obtener el ID del usuario actual
function getCurrentUserId(): string | null {
  return currentUserIdInMemory;
}

// Guardar el ID del usuario actual
export function setCurrentUserId(userId: string | null) {
  currentUserIdInMemory = userId;
}

// Obtener la key del carrito según el usuario
function getCartKey(): string {
  const userId = getCurrentUserId();
  if (userId) {
    return `by_arena_cart_user_${userId}`;
  }
  // Para invitados, usar sessionStorage para key temporal
  if (typeof window === 'undefined') return 'by_arena_cart_guest';
  
  let guestId = sessionStorage.getItem('by_arena_guest_id');
  if (!guestId) {
    guestId = `guest_${Date.now()}`;
    sessionStorage.setItem('by_arena_guest_id', guestId);
  }
  return `by_arena_cart_${guestId}`;
}

// Get cart from localStorage
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const cartKey = getCartKey();
    const cart = localStorage.getItem(cartKey);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

// Save cart to localStorage
export function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  const cartKey = getCartKey();
  localStorage.setItem(cartKey, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
}

// Clear cart
export function clearCart() {
  if (typeof window === 'undefined') return;
  const cartKey = getCartKey();
  localStorage.removeItem(cartKey);
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
}

// Limpiar carrito de invitado (se llama al iniciar sesión)
function clearGuestCart() {
  if (typeof window === 'undefined') return;
  const guestId = sessionStorage.getItem('by_arena_guest_id');
  if (guestId) {
    localStorage.removeItem(`by_arena_cart_${guestId}`);
    sessionStorage.removeItem('by_arena_guest_id');
  }
}

// Manejar cambio de sesión (login/logout)
export function handleSessionChange(userId: string | null) {
  if (typeof window === 'undefined') return;
  
  // Siempre limpiar carrito de invitado cuando hay un usuario logueado
  if (userId) {
    clearGuestCart();
  }
  
  // Actualizar el usuario actual en memoria
  setCurrentUserId(userId);
  
  // Disparar evento para que los componentes actualicen con el carrito del nuevo usuario
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: getCart() }));
}

// Get cart total
export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Get cart items count
export function getCartCount(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Hook for React components (compatible interface)
export function useCart() {
  return {
    items: getCart(),
    total: getCartTotal(),
    count: getCartCount(),
    clearCart,
    getCart,
    saveCart
  };
}
