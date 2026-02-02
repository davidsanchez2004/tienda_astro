// Cart utilities using localStorage - no Context needed

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image_url: string;
  quantity: number;
  price: number;
}

// Get cart from localStorage
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const cart = localStorage.getItem('by_arena_cart');
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

// Save cart to localStorage
export function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('by_arena_cart', JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
}

// Clear cart
export function clearCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('by_arena_cart');
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
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
