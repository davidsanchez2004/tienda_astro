// Cart utilities - Sistema de carrito con separación estricta usuario/invitado
// ESTRATEGIA: Una sola key de carrito que incluye metadata del propietario

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image_url: string;
  quantity: number;
  price: number;
}

interface CartData {
  ownerId: string; // 'guest' o el ID del usuario
  ownerType: 'guest' | 'user';
  items: CartItem[];
}

const CART_KEY = 'by_arena_cart_v2';
const USER_KEY = 'by_arena_current_user';

// ============================================
// GESTIÓN DE USUARIO
// ============================================

function getCurrentUser(): { id: string; type: 'user' } | { id: string; type: 'guest' } {
  if (typeof window === 'undefined') {
    return { id: 'ssr', type: 'guest' };
  }
  
  const userId = localStorage.getItem(USER_KEY);
  if (userId) {
    return { id: userId, type: 'user' };
  }
  
  return { id: 'guest', type: 'guest' };
}

function setCurrentUser(userId: string | null) {
  if (typeof window === 'undefined') return;
  
  if (userId) {
    localStorage.setItem(USER_KEY, userId);
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

// ============================================
// GESTIÓN DEL CARRITO
// ============================================

function getCartData(): CartData {
  if (typeof window === 'undefined') {
    return { ownerId: 'ssr', ownerType: 'guest', items: [] };
  }
  
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  
  const user = getCurrentUser();
  return { ownerId: user.id, ownerType: user.type, items: [] };
}

function saveCartData(data: CartData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: data.items }));
}

// ============================================
// API PÚBLICA DEL CARRITO
// ============================================

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  
  const currentUser = getCurrentUser();
  const cartData = getCartData();
  
  // REGLA CRÍTICA: Solo devolver items si el carrito pertenece al usuario actual
  if (cartData.ownerType === currentUser.type && cartData.ownerId === currentUser.id) {
    return cartData.items;
  }
  
  // El carrito pertenece a otro usuario/invitado - devolver vacío
  return [];
}

export function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  
  const currentUser = getCurrentUser();
  const cartData: CartData = {
    ownerId: currentUser.id,
    ownerType: currentUser.type,
    items: items
  };
  
  saveCartData(cartData);
}

export function clearCart() {
  if (typeof window === 'undefined') return;
  
  const currentUser = getCurrentUser();
  const cartData: CartData = {
    ownerId: currentUser.id,
    ownerType: currentUser.type,
    items: []
  };
  
  saveCartData(cartData);
}

// ============================================
// CAMBIO DE SESIÓN
// ============================================

export function handleSessionChange(userId: string | null) {
  if (typeof window === 'undefined') return;
  
  const previousUser = getCurrentUser();
  
  // Actualizar el usuario actual
  setCurrentUser(userId);
  
  const newUser = getCurrentUser();
  
  // Si cambió el tipo o ID de usuario, el carrito cambia automáticamente
  // porque getCart() verificará la propiedad
  
  console.log('[Cart] Session change:', {
    from: previousUser,
    to: newUser
  });
  
  // Notificar el cambio - getCart() devolverá los items correctos
  const items = getCart();
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }));
}

// ============================================
// UTILIDADES
// ============================================

export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

export function getCartCount(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
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

// Debug en consola del navegador
export function debugCart() {
  if (typeof window === 'undefined') {
    console.log('SSR mode');
    return;
  }
  
  console.log('=== CART DEBUG ===');
  console.log('USER_KEY value:', localStorage.getItem(USER_KEY));
  console.log('Current User:', getCurrentUser());
  console.log('Raw Cart Data:', localStorage.getItem(CART_KEY));
  console.log('Parsed Cart Data:', getCartData());
  console.log('getCart() result:', getCart());
  console.log('==================');
}
