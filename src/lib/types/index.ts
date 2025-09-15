// Database types
export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'collector'
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  address: string
  phone?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Debt {
  id: string
  client_id: string
  total_amount: number
  installment_amount: number
  frequency: 'daily' | 'weekly'
  start_date: string
  status: 'active' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
}

export interface PaymentSchedule {
  id: string
  debt_id: string
  due_date: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  created_at: string
}

export interface Route {
  id: string
  collector_id: string
  route_date: string
  status: 'pending' | 'in_progress' | 'completed'
  created_by: string
  created_at: string
}

export interface RouteAssignment {
  id: string
  route_id: string
  client_id: string
  payment_schedule_id: string
  visit_order: number
  created_at: string
}

export interface Payment {
  id: string
  route_assignment_id: string
  payment_schedule_id: string
  amount_paid?: number
  payment_status: 'paid' | 'not_paid' | 'client_absent'
  evidence_photo_url?: string
  notes?: string
  recorded_by: string
  recorded_at: string
}