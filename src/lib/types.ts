// ============================================
// Database types matching Supabase schema
// ============================================

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Match {
  id: string;
  rival: string;
  rival_shield_url: string | null;
  date: string;
  venue: string;
  competition: string;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  match_id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
  reserved: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  match_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_dni: string;
  total: number;
  status: OrderStatus;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  mp_merchant_order_id: string | null;
  items: OrderItem[];
  email_sent: boolean;
  email_error: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  ticket_type_id: string;
  name: string;
  qty: number;
  price: number;
}

export interface Ticket {
  id: string;
  order_id: string;
  match_id: string;
  ticket_type_id: string;
  code: string;
  token: string;
  holder_name: string | null;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

// ============================================
// Extended types for views
// ============================================

export interface MatchWithTicketTypes extends Match {
  ticket_types: TicketType[];
}

export interface TicketWithDetails extends Ticket {
  match?: Match;
  ticket_type?: TicketType;
  order?: Order;
}

export interface CartItem {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CheckoutData {
  matchId: string;
  buyerName: string;
  buyerEmail: string;
  buyerDni: string;
  items: CartItem[];
}
