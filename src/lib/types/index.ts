// Database Types for Sistema de Paga Diario

export type UserRole = 'admin' | 'collector';
export type DebtFrequency = 'daily' | 'weekly';
export type DebtStatus = 'active' | 'completed' | 'cancelled';
export type PaymentScheduleStatus = 'pending' | 'paid' | 'overdue';
export type RouteStatus = 'pending' | 'in_progress' | 'completed';
export type PaymentStatus = 'paid' | 'not_paid' | 'client_absent';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  phone?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  client_id: string;
  total_amount: number;
  installment_amount: number;
  frequency: DebtFrequency;
  start_date: string;
  status: DebtStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentSchedule {
  id: string;
  debt_id: string;
  due_date: string;
  amount: number;
  status: PaymentScheduleStatus;
  created_at: string;
}

export interface Route {
  id: string;
  collector_id: string;
  route_date: string;
  status: RouteStatus;
  created_by?: string;
  created_at: string;
}

export interface RouteAssignment {
  id: string;
  route_id: string;
  client_id: string;
  payment_schedule_id?: string;
  visit_order?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  route_assignment_id?: string;
  payment_schedule_id?: string;
  amount_paid?: number;
  payment_status: PaymentStatus;
  evidence_photo_url?: string;
  notes?: string;
  recorded_by?: string;
  recorded_at: string;
}

// Extended types with relations
export interface ClientWithDebt extends Client {
  debts?: Debt[];
  total_active_debt?: number;
  pending_amount?: number;
}

export interface RouteWithAssignments extends Route {
  collector?: Profile;
  assignments?: RouteAssignmentWithDetails[];
}

export interface RouteAssignmentWithDetails extends RouteAssignment {
  client?: Client;
  payment_schedule?: PaymentSchedule;
  payment?: Payment;
}

// View types
export interface DailyCollectionSummary {
  route_date: string;
  collector_id: string;
  collector_name: string;
  total_clients: number;
  clients_paid: number;
  clients_not_paid: number;
  clients_absent: number;
  total_collected: number;
  total_expected: number;
}

export interface ClientDebtSummary {
  client_id: string;
  client_name: string;
  address: string;
  phone?: string;
  total_debts: number;
  active_debts: number;
  total_active_debt: number;
  pending_amount: number;
}

// Function return types
export interface CollectorDailyRoute {
  route_assignment_id: string;
  client_id: string;
  client_name: string;
  client_address: string;
  client_phone?: string;
  payment_schedule_id?: string;
  amount_due?: number;
  visit_order?: number;
  payment_status: string;
}

// Form types
export interface CreateClientForm {
  name: string;
  address: string;
  phone?: string;
}

export interface CreateDebtForm {
  client_id: string;
  total_amount: number;
  installment_amount: number;
  frequency: DebtFrequency;
  start_date: string;
}

export interface CreateRouteForm {
  collector_id: string;
  route_date: string;
  client_ids: string[];
}

export interface RecordPaymentForm {
  route_assignment_id: string;
  payment_schedule_id?: string;
  amount_paid?: number;
  payment_status: PaymentStatus;
  evidence_photo?: File;
  notes?: string;
}