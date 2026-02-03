// Cart utilities - carritos completamente independientes por usuario
// Usa localStorage para persistencia del userId y sessionStorage para invitados

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image_url: string;
  quantity: number;
  price: number;
}

// ============================================
// GESTIÓN DE USUARIO ACTUAL
// ============================================

// Obtener el ID del usuario desde localStorage (sincronizado con Supabase)
function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('by_arena_current_user_id');
}

// Guardar el ID del usuario actual en localStorage
function setCurrentUserId(userId: string | null) {
  if (typeof window === 'undefined') return;
  if (userId) {
    localStorage.setItem('by_arena_current_user_id', userId);
  } else {
    localStorage.removeItem('by_arena_current_user_id');
  }
}

// ============================================
// GESTIÓN DE INVITADOS
// ============================================

// Obtener o crear ID de invitado (único por pestaña/sesión del navegador)
function getGuestId(): string {
  if (typeof window === 'undefined') return 'guest_ssr';
  
  let guestId = sessionStorage.getItem('by_arena_guest_id');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('by_arena_guest_id', guestId);
  }
  return guestId;
}

// Limpiar el carrito del invitado actual
function clearGuestData() {
  if (typeof window === 'undefined') return;
  
  const guestId = sessionStorage.getItem('by_arena_guest_id');
  if (guestId) {
    localStorage.removeItem(`by_arena_cart_${guestId}`);
    sessionStorage.removeItem('by_arena_guest_id');
  }
}

// ============================================
// KEYS DEL CARRITO
// ============================================

// Obtener la key del carrito según si hay usuario o invitado
function getCartKey(): string {
  const userId = getCurrentUserId();
  if (userId) {
    return `by_arena_cart_user_${userId}`;
  }
  return `by_arena_cart_${getGuestId()}`;
}

// ============================================
// OPERACIONES DEL CARRITO
// ============================================

// Obtener el carrito
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

// Guardar el carrito
export function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  const cartKey = getCartKey();
  localStorage.setItem(cartKey, JSON.stringify(cart));
  notifyCartUpdate(cart);
}

// Limpiar el carrito actual
export function clearCart() {
  if (typeof window === 'undefined') return;
  const cartKey = getCartKey();
  localStorage.removeItem(cartKey);
  notifyCartUpdate([]);
}

// Notificar cambios
function notifyCartUpdate(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
}

// ============================================
// CAMBIO DE SESIÓN
// ============================================

// Llamar cuando el usuario inicia sesión, cierra sesión, o se detecta la sesión inicial
export function handleSessionChange(userId: string | null) {
  if (typeof window === 'undefined') return;
  
  const previousUserId = getCurrentUserId();
  
  // Si no hay cambio real, solo refrescar el carrito
  if (previousUserId === userId) {
    notifyCartUpdate(getCart());
    return;
  }
  
  // Login: el usuario pasa de invitado a autenticado
  if (userId && !previousUserId) {
    // Limpiar carrito de invitado (no se transfiere al usuario)
    clearGuestData();
    // Guardar el nuevo userId en localStorage
    setCurrentUserId(userId);
    // Notificar con el carrito del usuario
    notifyCartUpdate(getCart());
    return;
  }
  
  // Logout: el usuario pasa de autenticado a invitado
  if (!userId && previousUserId) {
    // Limpiar el userId (el carrito del usuario queda guardado para cuando vuelva)
    setCurrentUserId(null);
    // Notificar con carrito vacío (nuevo invitado)
    notifyCartUpdate(getCart());
    return;
  }
  
  // Cambio de usuario
  if (userId && previousUserId && userId !== previousUserId) {
    setCurrentUserId(userId);
    notifyCartUpdate(getCart());
    return;
  }
}

// ============================================
// UTILIDADES
// ============================================

// Total del carrito
export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Cantidad de items
export function getCartCount(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Hook para componentes React
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

// Debug: ver estado actual del carrito (usar en consola del navegador)
export function debugCartState() {
  if (typeof window === 'undefined') {
    console.log('SSR mode - no cart state');
    return;
  }
  console.log('=== CART DEBUG ===');
  console.log('User ID (localStorage):', getCurrentUserId());
  console.log('Guest ID (sessionStorage):', sessionStorage.getItem('by_arena_guest_id'));
  console.log('Active Cart Key:', getCartKey());
  console.log('Cart Contents:', getCart());
  console.log('==================');
}
