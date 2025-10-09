-- Sistema de Paga Diario - Payment Schedule Management
-- Migration: 008_payment_schedule_management.sql
-- Purpose: Add functions to properly manage payment schedules and route assignments

-- =====================================================================
-- Function to get the current pending installment for a client
-- =====================================================================
-- This function returns the next pending payment schedule item for a client
-- based on the due date. It prioritizes overdue payments first, then upcoming ones.

CREATE OR REPLACE FUNCTION get_current_pending_installment(client_id_param UUID)
RETURNS TABLE (
  payment_schedule_id UUID,
  debt_id UUID,
  due_date DATE,
  amount DECIMAL(10,2),
  status TEXT,
  installment_number INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id as payment_schedule_id,
    ps.debt_id,
    ps.due_date,
    ps.amount,
    ps.status::TEXT,
    -- Calculate installment number by counting how many payments come before this one
    (SELECT COUNT(*) + 1 
     FROM payment_schedule ps2 
     WHERE ps2.debt_id = ps.debt_id 
     AND ps2.due_date < ps.due_date)::INTEGER as installment_number
  FROM payment_schedule ps
  INNER JOIN debts d ON ps.debt_id = d.id
  WHERE d.client_id = client_id_param
    AND d.status = 'active'
    AND ps.status = 'pending'
  ORDER BY 
    ps.due_date ASC,  -- Prioritize by due date (overdue first)
    ps.created_at ASC  -- Then by creation order
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_current_pending_installment IS 
'Returns the current pending installment for a client, prioritizing overdue payments';


-- =====================================================================
-- Function to get all pending installments for multiple clients
-- =====================================================================
-- This is useful when creating routes to get all pending installments at once

CREATE OR REPLACE FUNCTION get_pending_installments_for_clients(client_ids_param UUID[])
RETURNS TABLE (
  client_id UUID,
  payment_schedule_id UUID,
  debt_id UUID,
  due_date DATE,
  amount DECIMAL(10,2),
  status TEXT,
  installment_number INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.client_id,
    ps.id as payment_schedule_id,
    ps.debt_id,
    ps.due_date,
    ps.amount,
    ps.status::TEXT,
    (SELECT COUNT(*) + 1 
     FROM payment_schedule ps2 
     WHERE ps2.debt_id = ps.debt_id 
     AND ps2.due_date < ps.due_date)::INTEGER as installment_number
  FROM payment_schedule ps
  INNER JOIN debts d ON ps.debt_id = d.id
  WHERE d.client_id = ANY(client_ids_param)
    AND d.status = 'active'
    AND ps.status = 'pending'
    AND ps.id IN (
      -- For each client, get only their first pending installment
      SELECT DISTINCT ON (d2.client_id) ps3.id
      FROM payment_schedule ps3
      INNER JOIN debts d2 ON ps3.debt_id = d2.id
      WHERE d2.client_id = ANY(client_ids_param)
        AND d2.status = 'active'
        AND ps3.status = 'pending'
      ORDER BY d2.client_id, ps3.due_date ASC, ps3.created_at ASC
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pending_installments_for_clients IS 
'Returns the current pending installment for each client in the provided array';


-- =====================================================================
-- Function to mark a payment schedule as paid and update debt status
-- =====================================================================
-- This function ensures data consistency when marking a payment as paid

CREATE OR REPLACE FUNCTION mark_payment_schedule_paid(
  payment_schedule_id_param UUID,
  payment_id_param UUID
)
RETURNS VOID AS $$
DECLARE
  debt_id_var UUID;
  total_installments INTEGER;
  paid_installments INTEGER;
BEGIN
  -- Update the payment schedule status
  UPDATE payment_schedule
  SET status = 'paid'
  WHERE id = payment_schedule_id_param;

  -- Get the debt_id
  SELECT debt_id INTO debt_id_var
  FROM payment_schedule
  WHERE id = payment_schedule_id_param;

  -- Count total and paid installments for this debt
  SELECT 
    COUNT(*) INTO total_installments
  FROM payment_schedule
  WHERE debt_id = debt_id_var;

  SELECT 
    COUNT(*) INTO paid_installments
  FROM payment_schedule
  WHERE debt_id = debt_id_var AND status = 'paid';

  -- If all installments are paid, mark the debt as completed
  IF paid_installments = total_installments THEN
    UPDATE debts
    SET status = 'completed'
    WHERE id = debt_id_var;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_payment_schedule_paid IS 
'Marks a payment schedule as paid and automatically completes the debt if all installments are paid';


-- =====================================================================
-- Function to get collector daily route with proper payment schedule info
-- =====================================================================
-- Enhanced version that returns complete payment schedule information

CREATE OR REPLACE FUNCTION get_collector_daily_route_enhanced(
  collector_id_param UUID,
  route_date_param DATE
)
RETURNS TABLE (
  route_assignment_id UUID,
  route_id UUID,
  client_id UUID,
  client_name TEXT,
  client_address TEXT,
  client_phone TEXT,
  payment_schedule_id UUID,
  amount_due DECIMAL(10,2),
  due_date DATE,
  installment_number INTEGER,
  total_installments INTEGER,
  visit_order INTEGER,
  payment_id UUID,
  payment_status TEXT,
  amount_paid DECIMAL(10,2),
  payment_recorded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ra.id as route_assignment_id,
    ra.route_id,
    c.id as client_id,
    c.name as client_name,
    c.address as client_address,
    c.phone as client_phone,
    ps.id as payment_schedule_id,
    ps.amount as amount_due,
    ps.due_date,
    (SELECT COUNT(*) + 1 
     FROM payment_schedule ps2 
     WHERE ps2.debt_id = ps.debt_id 
     AND ps2.due_date < ps.due_date)::INTEGER as installment_number,
    (SELECT COUNT(*) 
     FROM payment_schedule ps3 
     WHERE ps3.debt_id = ps.debt_id)::INTEGER as total_installments,
    ra.visit_order,
    p.id as payment_id,
    p.payment_status::TEXT,
    p.amount_paid,
    p.recorded_at as payment_recorded_at
  FROM route_assignments ra
  INNER JOIN routes r ON ra.route_id = r.id
  INNER JOIN clients c ON ra.client_id = c.id
  LEFT JOIN payment_schedule ps ON ra.payment_schedule_id = ps.id
  LEFT JOIN payments p ON ra.id = p.route_assignment_id
  WHERE r.collector_id = collector_id_param
    AND r.route_date = route_date_param
  ORDER BY ra.visit_order NULLS LAST, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_collector_daily_route_enhanced IS 
'Returns the collector daily route with complete payment schedule information including installment numbers';


-- =====================================================================
-- Grant necessary permissions
-- =====================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_current_pending_installment TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_installments_for_clients TO authenticated;
GRANT EXECUTE ON FUNCTION mark_payment_schedule_paid TO authenticated;
GRANT EXECUTE ON FUNCTION get_collector_daily_route_enhanced TO authenticated;

