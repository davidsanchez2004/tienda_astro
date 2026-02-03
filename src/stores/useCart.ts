/**
 * SISTEMA DE CARRITO - BY ARENA
 * 
 * REGLAS:
 * - Invitado: usa key "guest_cart"
 * - Usuario: usa key "user_cart_<userId>"
 * - Login: se limpia guest_cart, se carga user_cart_<userId>
 * - Logout: se elimina referencia al usuario, se usa guest_cart (vacío o existente)
 */

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image_url: string;
  quantity: number;
  price: number;
}

// Key para guardar el userId actual
const CURRENT_USER_KEY = 'by_arena_auth_user_id';

// ============================================
// FUNCIONES DE GESTIÓN DE USUARIO
// ============================================

/**
 * Obtiene el userId guardado en localStorage
 */
function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

/**
 * Guarda o elimina el userId en localStorage
 */
function setStoredUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  
  if (userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// ============================================
// FUNCIONES DE KEY DEL CARRITO
// ============================================

/**
 * Devuelve la key del carrito según el estado de autenticación
 * - Si hay userId → "user_cart_<userId>"
 * - Si no hay userId → "guest_cart"
 */
function getCartKey(): string {
  const userId = getStoredUserId();
  
  if (userId) {
    return `user_cart_${userId}`;
  }
  
  return 'guest_cart';
}

// ============================================
// OPERACIONES DEL CARRITO
// ============================================

/**
 * Obtiene los items del carrito actual
 */
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const key = getCartKey();
    const data = localStorage.getItem(key);
    
    if (!data) return [];
    
    const items = JSON.parse(data);
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error('[Cart] Error reading cart:', error);
    return [];
  }
}

/**
 * Guarda los items en el carrito actual
 */
export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  
  const key = getCartKey();
  localStorage.setItem(key, JSON.stringify(items));
  
  // Notificar a todos los componentes
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }));
}

/**
 * Limpia el carrito actual
 */
export function clearCart(): void {
  if (typeof window === 'undefined') return;
  
  const key = getCartKey();
  localStorage.removeItem(key);
  
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
}

// ============================================
// GESTIÓN DE SESIÓN (LOGIN/LOGOUT)
// ============================================

/**
 * LLAMAR cuando el usuario inicia sesión o se detecta una sesión existente
 */
export function onUserLogin(userId: string): void {
  if (typeof window === 'undefined') return;
  
  console.log('[Cart] User login:', userId);
  
  // 1. Limpiar el carrito de invitado (NO se transfiere)
  localStorage.removeItem('guest_cart');
  
  // 2. Guardar el nuevo userId
  setStoredUserId(userId);
  
  // 3. Cargar el carrito del usuario (puede estar vacío)
  const userCart = getCart();
  
  // 4. Notificar el cambio
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: userCart }));
}

/**
 * LLAMAR cuando el usuario cierra sesión
 */
export function onUserLogout(): void {
  if (typeof window === 'undefined') return;
  
  console.log('[Cart] User logout');
  
  // 1. Eliminar el userId (el carrito del usuario queda en localStorage para cuando vuelva)
  setStoredUserId(null);
  
  // 2. El carrito ahora es guest_cart (vacío si no existía)
  const guestCart = getCart();
  
  // 3. Notificar el cambio
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: guestCart }));
}

/**
 * LLAMAR desde AuthContext para sincronizar el estado
 * Esta función decide si hacer login o logout según el userId
 */
export function handleSessionChange(userId: string | null): void {
  if (typeof window === 'undefined') return;
  
  const currentStoredUserId = getStoredUserId();
  
  // Caso 1: Usuario hace login (pasa de null a userId)
  if (userId && !currentStoredUserId) {
    onUserLogin(userId);
    return;
  }
  
  // Caso 2: Usuario hace logout (pasa de userId a null)
  if (!userId && currentStoredUserId) {
    onUserLogout();
    return;
  }
  
  // Caso 3: Cambio de usuario (raro pero posible)
  if (userId && currentStoredUserId && userId !== currentStoredUserId) {
    // Logout del usuario anterior, login del nuevo
    setStoredUserId(null);
    onUserLogin(userId);
    return;
  }
  
  // Caso 4: Sin cambio real, solo refrescar
  const cart = getCart();
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
}

// ============================================
// UTILIDADES
// ============================================

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

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

/**
 * DEBUG: Ejecutar en consola del navegador para ver el estado
 */
export function debugCart(): void {
  if (typeof window === 'undefined') {
    console.log('SSR - no cart');
    return;
  }
  
  const userId = getStoredUserId();
  const cartKey = getCartKey();
  const cartItems = getCart();
  
  console.log('╔══════════════════════════════════════╗');
  console.log('║        CART DEBUG - BY ARENA         ║');
  console.log('╠══════════════════════════════════════╣');
  console.log('║ Stored User ID:', userId || '(none - guest)');
  console.log('║ Active Cart Key:', cartKey);
  console.log('║ Cart Items:', cartItems.length);
  console.log('║ Items:', cartItems);
  console.log('╠══════════════════════════════════════╣');
  console.log('║ All cart keys in localStorage:');
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('cart') || key.includes('user'))) {
      console.log('║   -', key, ':', localStorage.getItem(key)?.substring(0, 50));
    }
  }
  
  console.log('╚══════════════════════════════════════╝');
}
