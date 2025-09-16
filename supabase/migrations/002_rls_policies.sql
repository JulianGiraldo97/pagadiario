-- Sistema de Paga Diario - Row Level Security Policies
-- Migration: 002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is collector
CREATE OR REPLACE FUNCTION is_collector(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'collector'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for clients table
CREATE POLICY "Admins can manage all clients" ON clients
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Collectors can view assigned clients" ON clients
  FOR SELECT USING (
    is_collector(auth.uid()) AND EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN routes r ON ra.route_id = r.id
      WHERE ra.client_id = clients.id 
      AND r.collector_id = auth.uid()
      AND r.route_date = NOW()::DATE
    )
  );

-- Policies for debts table
CREATE POLICY "Admins can manage all debts" ON debts
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Collectors can view debts for assigned clients" ON debts
  FOR SELECT USING (
    is_collector(auth.uid()) AND EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN routes r ON ra.route_id = r.id
      WHERE ra.client_id = debts.client_id 
      AND r.collector_id = auth.uid()
      AND r.route_date = NOW()::DATE
    )
  );

-- Policies for payment_schedule table
CREATE POLICY "Admins can manage all payment schedules" ON payment_schedule
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Collectors can view payment schedules for assigned clients" ON payment_schedule
  FOR SELECT USING (
    is_collector(auth.uid()) AND EXISTS (
      SELECT 1 FROM debts d
      JOIN route_assignments ra ON ra.client_id = d.client_id
      JOIN routes r ON ra.route_id = r.id
      WHERE d.id = payment_schedule.debt_id
      AND r.collector_id = auth.uid()
      AND r.route_date = NOW()::DATE
    )
  );

-- Policies for routes table
CREATE POLICY "Admins can manage all routes" ON routes
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Collectors can view own routes" ON routes
  FOR SELECT USING (
    is_collector(auth.uid()) AND collector_id = auth.uid()
  );

-- Policies for route_assignments table
CREATE POLICY "Admins can manage all route assignments" ON route_assignments
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Collectors can view own route assignments" ON route_assignments
  FOR SELECT USING (
    is_collector(auth.uid()) AND EXISTS (
      SELECT 1 FROM routes r
      WHERE r.id = route_assignments.route_id
      AND r.collector_id = auth.uid()
    )
  );

-- Policies for payments table
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Collectors can insert payments for own routes" ON payments
  FOR INSERT WITH CHECK (
    is_collector(auth.uid()) AND EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN routes r ON ra.route_id = r.id
      WHERE ra.id = payments.route_assignment_id
      AND r.collector_id = auth.uid()
      AND r.route_date = NOW()::DATE
    )
  );

CREATE POLICY "Collectors can view own payments" ON payments
  FOR SELECT USING (
    is_collector(auth.uid()) AND recorded_by = auth.uid()
  );

CREATE POLICY "Collectors can update own payments" ON payments
  FOR UPDATE USING (
    is_collector(auth.uid()) AND recorded_by = auth.uid()
  );