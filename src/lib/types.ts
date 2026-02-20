// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'customer';
  created_at: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  images_urls?: string[];
  category_ids?: string[];
  sku?: string | null;
  featured: boolean;
  active: boolean;
  // Offer fields
  on_offer?: boolean;
  offer_price?: number | null;
  offer_percentage?: number | null;
  offer_start_date?: string | null;
  offer_end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
}

// Cart types
export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

// Order types
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type ShippingOption = 'pickup' | 'home';

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_option: ShippingOption;
  shipping_address: Address;
  tracking_number?: string;
  payment_intent_id: string;
  created_at: string;
  updated_at: string;
}

// Address types
export interface Address {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  apartment?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

// Return/RMA types
export type ReturnReason = 'not_liked' | 'defective' | 'error' | 'other';

export interface Return {
  id: string;
  order_id: string;
  reason: ReturnReason;
  description: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  refund_amount?: number;
  created_at: string;
  updated_at: string;
}

// Coupon types
export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  max_uses: number;
  current_uses: number;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
}

// Invoice types
export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  type: 'purchase' | 'return';
  return_id?: string;
  amount: number;
  customer_name?: string;
  customer_email?: string;
  pdf_url?: string;
  pdf_data?: string;
  created_at: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  type: 'purchase' | 'return';
  returnNumber?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: Address;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  shipping: number;
  discount?: number;
  tax: number;
  total: number;
  notes: string;
}

// Promo types
export interface Promo {
  id: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  product_ids?: string[];
  min_purchase?: number;
  active: boolean;
  start_date: string;
  end_date: string;
}

// Pack types
export interface Pack {
  id: string;
  name: string;
  description: string;
  products: string[];
  original_price: number;
  pack_price: number;
  stock: number;
  active: boolean;
}

// Support types
export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  updated_at: string;
}

// Analytics types
export interface OrderMetrics {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  orders_this_month: number;
  revenue_this_month: number;
}
