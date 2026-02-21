/**
 * NANOSTORE DEL CARRITO - BY ARENA
 * 
 * Fuente de verdad reactiva para el estado del carrito.
 * Usa nanostores para que todos los componentes (Astro, React, etc.)
 * se actualicen automáticamente cuando cambia el carrito.
 * 
 * REGLAS:
 * - Invitado: usa key "guest_cart" en sessionStorage (se borra al cerrar pestaña/navegador)
 * - Usuario: usa key "user_cart_<userId>" en localStorage (persiste entre sesiones)
 * - Login: se limpia guest_cart, se carga user_cart_<userId>
 * - Logout: se elimina referencia al usuario, se usa guest_cart (vacío)
 */

import { atom, computed } from 'nanostores';

// ============================================
// TIPOS
// ============================================

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image_url: string;
  quantity: number;
  price: number;
  stock: number;
}

// ============================================
// ATOMS (estado reactivo)
// ============================================

/** Lista de items del carrito - fuente de verdad */
export const $cartItems = atom<CartItem[]>([]);

/** Computed: número total de unidades en el carrito */
export const $cartCount = computed($cartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);

/** Computed: precio total del carrito */
export const $cartTotal = computed($cartItems, (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// ============================================
// CONSTANTES
// ============================================

const CURRENT_USER_KEY = 'by_arena_auth_user_id';
const SESSION_FLAG = 'by_arena_session_active';

// ============================================
// FUNCIONES INTERNAS DE STORAGE
// ============================================

function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

function setStoredUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  if (userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function isGuestCart(): boolean {
  return !getStoredUserId();
}

function getCartKey(): string {
  const userId = getStoredUserId();
  return userId ? `user_cart_${userId}` : 'guest_cart';
}

function getCartStorage(): Storage {
  if (typeof window === 'undefined') return localStorage;
  return isGuestCart() ? sessionStorage : localStorage;
}

// ============================================
// LEER/ESCRIBIR STORAGE ↔ ATOM
// ============================================

/** Lee del storage y sincroniza al atom */
function loadCartFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getCartKey();
    const storage = getCartStorage();
    const data = storage.getItem(key);
    if (!data) {
      $cartItems.set([]);
      return;
    }
    const items = JSON.parse(data);
    $cartItems.set(Array.isArray(items) ? items : []);
  } catch {
    $cartItems.set([]);
  }
}

/** Persiste el atom actual al storage */
function persistCart(): void {
  if (typeof window === 'undefined') return;
  const key = getCartKey();
  const storage = getCartStorage();
  const items = $cartItems.get();
  if (items.length === 0) {
    storage.removeItem(key);
  } else {
    storage.setItem(key, JSON.stringify(items));
  }
  // Evento legacy para compatibilidad con componentes que aún escuchen
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }));
}

// ============================================
// API PÚBLICA
// ============================================

/** Obtiene los items actuales del carrito */
export function getCart(): CartItem[] {
  return $cartItems.get();
}

/** Obtiene el conteo total de items */
export function getCartCount(): number {
  return $cartCount.get();
}

/** Obtiene el total en precio */
export function getCartTotal(): number {
  return $cartTotal.get();
}

/** Guarda items en el carrito (reemplaza todo) */
export function saveCart(items: CartItem[]): void {
  $cartItems.set(items);
  persistCart();
}

/** Limpia el carrito actual */
export function clearCart(): void {
  if (typeof window === 'undefined') return;
  const key = getCartKey();
  const storage = getCartStorage();
  storage.removeItem(key);
  $cartItems.set([]);
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
}

// ============================================
// GESTIÓN DE SESIÓN
// ============================================

export function onUserLogin(userId: string): void {
  if (typeof window === 'undefined') return;
  console.log('[Cart] User login:', userId);
  sessionStorage.removeItem('guest_cart');
  setStoredUserId(userId);
  loadCartFromStorage();
}

export function onUserLogout(): void {
  if (typeof window === 'undefined') return;
  console.log('[Cart] User logout');
  setStoredUserId(null);
  loadCartFromStorage();
}

export function handleSessionChange(userId: string | null): void {
  if (typeof window === 'undefined') return;
  const currentStoredUserId = getStoredUserId();

  if (userId && !currentStoredUserId) {
    onUserLogin(userId);
    return;
  }
  if (!userId && currentStoredUserId) {
    onUserLogout();
    return;
  }
  if (userId && currentStoredUserId && userId !== currentStoredUserId) {
    setStoredUserId(null);
    onUserLogin(userId);
    return;
  }
  // Sin cambio real, solo refrescar
  loadCartFromStorage();
}

// ============================================
// HELPER HOOK (compatibilidad)
// ============================================

export function useCart() {
  return {
    items: getCart(),
    total: getCartTotal(),
    count: getCartCount(),
    clearCart,
    getCart,
    saveCart,
  };
}

// ============================================
// AUTO-LIMPIEZA + INICIALIZACIÓN
// ============================================

function init(): void {
  if (typeof window === 'undefined') return;

  // Migración: limpiar guest_cart de localStorage si quedó de versiones anteriores
  localStorage.removeItem('guest_cart');

  // Si la flag de sesión NO existe → nueva sesión → limpiar carrito invitado
  if (!sessionStorage.getItem(SESSION_FLAG)) {
    sessionStorage.removeItem('guest_cart');
    sessionStorage.setItem(SESSION_FLAG, '1');
  }

  // Al cerrar pestaña/navegador, limpiar carrito de invitado
  window.addEventListener('beforeunload', () => {
    if (isGuestCart()) {
      sessionStorage.removeItem('guest_cart');
      sessionStorage.removeItem(SESSION_FLAG);
    }
  });

  // Cargar carrito inicial desde storage al atom
  loadCartFromStorage();
}

init();

// ============================================
// DEBUG
// ============================================

export function debugCart(): void {
  if (typeof window === 'undefined') { console.log('SSR - no cart'); return; }
  const userId = getStoredUserId();
  console.log('╔══════════════════════════════════════╗');
  console.log('║        CART DEBUG - BY ARENA         ║');
  console.log('╠══════════════════════════════════════╣');
  console.log('║ Stored User ID:', userId || '(none - guest)');
  console.log('║ Active Cart Key:', getCartKey());
  console.log('║ Cart Items (atom):', $cartItems.get().length);
  console.log('║ Cart Count (computed):', $cartCount.get());
  console.log('║ Cart Total (computed):', $cartTotal.get());
  console.log('║ Items:', $cartItems.get());
  console.log('╠══════════════════════════════════════╣');
  console.log('║ Guest cart in sessionStorage:');
  const guestData = sessionStorage.getItem('guest_cart');
  console.log('║   - guest_cart:', guestData ? guestData.substring(0, 50) : '(empty)');
  console.log('╚══════════════════════════════════════╝');
}
