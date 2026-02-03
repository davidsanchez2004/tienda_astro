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
  const previousUserId = currentUserIdInMemory;
  currentUserIdInMemory = userId;
  
  // Si cambió el usuario, notificar para refrescar el carrito
  if (previousUserId !== userId) {
    notifyCartUpdate();
  }
}

// Obtener la key del carrito según el usuario
function getCartKey(): string {
  const userId = getCurrentUserId();
  if (userId) {
    // Usuario autenticado - carrito persistente por ID de usuario
    return `by_arena_cart_user_${userId}`;
  }
  
  // Para invitados, usar una key basada en sessionStorage (único por pestaña/sesión)
  if (typeof window === 'undefined') return 'by_arena_cart_guest_temp';
  
  let guestId = sessionStorage.getItem('by_arena_guest_id');
  if (!guestId) {
    // Crear un ID único para este invitado (basado en timestamp + random)
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('by_arena_guest_id', guestId);
  }
  return `by_arena_cart_${guestId}`;
}

// Notificar cambios en el carrito
function notifyCartUpdate() {
  if (typeof window === 'undefined') return;
  const cart = getCart();
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
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

// Limpiar carrito de invitado actual (se llama al iniciar sesión)
function clearCurrentGuestCart() {
  if (typeof window === 'undefined') return;
  const guestId = sessionStorage.getItem('by_arena_guest_id');
  if (guestId) {
    // Eliminar el carrito del invitado del localStorage
    localStorage.removeItem(`by_arena_cart_${guestId}`);
    // Eliminar el ID del invitado del sessionStorage
    sessionStorage.removeItem('by_arena_guest_id');
  }
}

// Manejar cambio de sesión (login/logout)
export function handleSessionChange(userId: string | null) {
  if (typeof window === 'undefined') return;
  
  const wasGuest = currentUserIdInMemory === null;
  const isLoggingIn = userId !== null && wasGuest;
  const isLoggingOut = userId === null && currentUserIdInMemory !== null;
  
  // Al iniciar sesión: limpiar el carrito de invitado (no transferir al usuario)
  if (isLoggingIn) {
    clearCurrentGuestCart();
  }
  
  // Al cerrar sesión: el carrito del usuario se mantiene guardado para cuando vuelva
  // El nuevo invitado empezará con carrito vacío (nuevo guestId)
  if (isLoggingOut) {
    // El carrito del usuario queda en localStorage con su key específica
    // Al cerrar sesión, se creará un nuevo guestId automáticamente
  }
  
  // Actualizar el usuario actual en memoria (esto también notifica el cambio)
  setCurrentUserId(userId);
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
