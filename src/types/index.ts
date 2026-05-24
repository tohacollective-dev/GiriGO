// =============================================================================
// GiriGo — Shared TypeScript Types
// =============================================================================

export type UserRole       = 'customer' | 'courier' | 'admin'
export type CourierStatus  = 'online'   | 'offline'  | 'busy'
export type OrderStatus    = 'pending'  | 'assigned' | 'picked_up' | 'delivered' | 'cancelled' | 'failed'
export type PaymentMethod  = 'cod'      | 'transfer' | 'ewallet'
export type PayoutStatus   = 'unpaid'   | 'settled'
export type DispatchResult = 'accepted' | 'rejected' | 'timeout'   | 'admin_alert'
export type SessionState   =
  | 'idle' | 'awaiting_name' | 'awaiting_pickup' | 'awaiting_dropoff'
  | 'awaiting_package_type' | 'awaiting_payment' | 'awaiting_confirmation'
  | 'order_active' | 'awaiting_rating'

// ── Database row types ────────────────────────────────────────────────────────
export interface User {
  id:         string
  name:       string
  phone:      string
  role:       UserRole
  created_at: string
  updated_at: string
}

export interface Courier {
  id:               string
  user_id:          string
  rating:           number
  status:           CourierStatus
  total_orders:     number
  total_earnings:   number
  current_lat:      number | null
  current_lng:      number | null
  location_updated: string | null
  vehicle_type:     string
  is_verified:      boolean
  created_at:       string
  updated_at:       string
  // joined
  user?:            User
}

export interface Order {
  id:                string
  order_code:        string
  customer_id:       string
  courier_id:        string | null
  pickup_address:    string
  pickup_lat:        number | null
  pickup_lng:        number | null
  dropoff_address:   string
  dropoff_lat:       number | null
  dropoff_lng:       number | null
  item_type:         string
  item_weight_kg:    number
  notes:             string | null
  distance_km:       number | null
  base_fee:          number
  weight_surcharge:  number
  delivery_fee:      number
  package_value:     number
  payment_method:    PaymentMethod
  status:            OrderStatus
  pickup_photo_url:  string | null
  dropoff_photo_url: string | null
  created_at:        string
  assigned_at:       string | null
  picked_up_at:      string | null
  delivered_at:      string | null
  updated_at:        string
  // joined
  customer?:         User
  courier?:          Courier & { user: User }
}

export interface LedgerEntry {
  id:                 string
  order_id:           string
  courier_id:         string
  date:               string
  total_delivery_fee: number
  courier_share:      number
  platform_share:     number
  cod_collected:      number
  payout_status:      PayoutStatus
  settled_at:         string | null
  created_at:         string
}

export interface WaSession {
  id:          string
  phone:       string
  user_id:     string | null
  state:       SessionState
  context:     OrderContext
  last_msg_at: string
  created_at:  string
}

export interface DispatchLogEntry {
  id:           string
  order_id:     string
  courier_id:   string | null
  attempt:      number
  score:        number | null
  result:       DispatchResult
  offered_at:   string
  responded_at: string | null
}

export interface Rating {
  id:          string
  order_id:    string
  customer_id: string
  courier_id:  string
  score:       number
  comment:     string | null
  created_at:  string
}

// ── Application DTOs ──────────────────────────────────────────────────────────
export interface OrderContext {
  pickup_address?:   string
  pickup_lat?:       number
  pickup_lng?:       number
  dropoff_address?:  string
  dropoff_lat?:      number
  dropoff_lng?:      number
  item_type?:        string
  item_weight_kg?:   number
  notes?:            string
  payment_method?:   PaymentMethod
  package_value?:    number
  distance_km?:      number
  delivery_fee?:     number
  order_id?:         string
  order_code?:       string
}

export interface PriceCalculation {
  distance_km:      number
  base_fee:         number
  weight_surcharge: number
  delivery_fee:     number
  courier_share:    number
  platform_share:   number
}

export interface GeocodeResult {
  address:      string
  lat:          number
  lng:          number
  display_name: string
}

export interface DistanceResult {
  distance_km:   number
  duration_min:  number
  nav_link:      string
}

export interface CourierScore {
  courier_id:   string
  courier:      Courier & { user: User }
  total_score:  number
  dist_score:   number
  workload_score: number
  rating_score: number
  distance_km:  number
}

export interface WhatsAppInboundMessage {
  from:        string   // sender phone E.164
  body:        string   // message text
  timestamp:   string
  message_id:  string
  type:        'text' | 'image' | 'audio' | 'document'
  media_url?:  string
}

export interface DailySummary {
  date:             string
  total_orders:     number
  delivered:        number
  cancelled:        number
  gross_revenue:    number
  success_rate_pct: number
}

// ── Route-based dispatch types ────────────────────────────────────────────────

export interface CourierActiveRoute {
  id:                        string
  courier_id:                string
  route_start_address:       string
  route_end_address:         string
  start_lat:                 number
  start_lng:                 number
  end_lat:                   number
  end_lng:                   number
  current_location:          { lat: number | null; lng: number | null; updated_at: string | null }
  orders_in_route:           string[]
  total_distance_km:         number
  estimated_completion_time: string | null
  status:                    'active' | 'idle' | 'completed'
  created_at:                string
  updated_at:                string
  // joined
  courier?:                  Courier & { user: User }
}

export interface RouteCourierScore {
  courier_id:           string
  courier_name:         string
  courier_phone:        string
  route_id:             string | null
  total_score:          number
  match_type:           'exact' | 'similar' | 'nearby' | 'none'
  distance_to_pickup_m: number
  orders_in_route:      number
  rating:               number
}

export interface RouteAssignmentResult {
  assigned_courier_id:    string
  route_id:               string
  route_info: {
    match_type:           string
    orders_in_route:      number
    total_distance_km:    number
  }
  estimated_pickup_time:  string
  estimated_dropoff_time: string
  cost_estimate:          number
}
