import { useStore } from '@nanostores/react';
import { $cartCount } from '../../stores/useCart';

/**
 * Badge reactivo del carrito.
 * Se suscribe al nanostore $cartCount y se re-renderiza automáticamente.
 */
export default function CartBadge() {
  const count = useStore($cartCount);

  if (count <= 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-arena text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}
