-- Fix collector policies to allow access to routes for any date, not just current date
-- Migration: 006_fix_collector_policies.sql

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Collectors can view assigned clients" ON clients;
DROP POLICY IF EXISTS "Collectors can view debts for assigned clients" ON debts;
DROP POLICY IF EXISTS "Collectors can view payment schedules for assigned clients" ON payment_schedule;

-- Create new policies that allow collectors to access data for any of their assigned routes
CREATE POLICY "Collectors can view assigned clients" ON clients
  FOR SELECT USING (
    is_collector(auth.uid()) AND EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN routes r ON ra.route_id = r.id
      WHERE ra.client_id = clients.id 
      AND r.collector_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can view debts for assigned clients" ON debts
  FOR SELECT USING (
    is_collector(auth.uid()) AND EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN routes r ON ra.route_id = r.id
      WHERE ra.client_id = debts.client_id 
      AND r.collector_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can view payment schedules for assigned clients" ON payment_schedule
  FOR SELECT USING (
    is_collector(auth.uid()) AND EXISTS (
      SELECT 1 FROM debts d
      JOIN route_assignments ra ON ra.client_id = d.client_id
      JOIN routes r ON ra.route_id = r.id
      WHERE d.id = payment_schedule.debt_id
      AND r.collector_id = auth.uid()
    )
  );

-- Also update the payments policy to be consistent
DROP POLICY IF EXISTS "Collectors can insert payments for own routes" ON payments;
DROP POLICY IF EXISTS "Collectors can view own payments" ON payments;
DROP POLICY IF EXISTS "Collectors can update own payments" ON payments;

CREATE POLICY "Collectors can insert payments for own routes" ON payments
  FOR INSERT WITH CHECK (
    is_collector(auth.uid()) AND EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN routes r ON ra.route_id = r.id
      WHERE ra.id = payments.route_assignment_id
      AND r.collector_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can view own payments" ON payments
  FOR SELECT USING (
    is_collector(auth.uid()) AND (
      recorded_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM route_assignments ra
        JOIN routes r ON ra.route_id = r.id
        WHERE ra.id = payments.route_assignment_id
        AND r.collector_id = auth.uid()
      )
    )
  );

CREATE POLICY "Collectors can update own payments" ON payments
  FOR UPDATE USING (
    is_collector(auth.uid()) AND recorded_by = auth.uid()
  );