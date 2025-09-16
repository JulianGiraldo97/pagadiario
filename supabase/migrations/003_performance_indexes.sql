-- Sistema de Paga Diario - Performance Indexes
-- Migration: 003_performance_indexes.sql

-- Indexes for profiles table
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Indexes for clients table
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_created_by ON clients(created_by);
CREATE INDEX idx_clients_created_at ON clients(created_at);

-- Indexes for debts table
CREATE INDEX idx_debts_client_id ON debts(client_id);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debts_created_by ON debts(created_by);
CREATE INDEX idx_debts_start_date ON debts(start_date);
CREATE INDEX idx_debts_frequency ON debts(frequency);

-- Indexes for payment_schedule table
CREATE INDEX idx_payment_schedule_debt_id ON payment_schedule(debt_id);
CREATE INDEX idx_payment_schedule_due_date ON payment_schedule(due_date);
CREATE INDEX idx_payment_schedule_status ON payment_schedule(status);
CREATE INDEX idx_payment_schedule_due_date_status ON payment_schedule(due_date, status);

-- Indexes for routes table
CREATE INDEX idx_routes_collector_id ON routes(collector_id);
CREATE INDEX idx_routes_route_date ON routes(route_date);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_collector_date ON routes(collector_id, route_date);

-- Indexes for route_assignments table
CREATE INDEX idx_route_assignments_route_id ON route_assignments(route_id);
CREATE INDEX idx_route_assignments_client_id ON route_assignments(client_id);
CREATE INDEX idx_route_assignments_payment_schedule_id ON route_assignments(payment_schedule_id);
CREATE INDEX idx_route_assignments_visit_order ON route_assignments(route_id, visit_order);

-- Indexes for payments table
CREATE INDEX idx_payments_route_assignment_id ON payments(route_assignment_id);
CREATE INDEX idx_payments_payment_schedule_id ON payments(payment_schedule_id);
CREATE INDEX idx_payments_recorded_by ON payments(recorded_by);
CREATE INDEX idx_payments_recorded_at ON payments(recorded_at);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);
CREATE INDEX idx_payments_recorded_at_status ON payments(recorded_at, payment_status);

-- Composite indexes for common queries
CREATE INDEX idx_routes_collector_date_status ON routes(collector_id, route_date, status);
CREATE INDEX idx_debts_client_status ON debts(client_id, status);
CREATE INDEX idx_payment_schedule_debt_due_status ON payment_schedule(debt_id, due_date, status);