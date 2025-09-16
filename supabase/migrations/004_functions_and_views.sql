-- Sistema de Paga Diario - Database Functions and Views
-- Migration: 004_functions_and_views.sql

-- Function to generate payment schedule for a debt
CREATE OR REPLACE FUNCTION generate_payment_schedule(
  debt_id_param UUID,
  total_amount_param DECIMAL(10,2),
  installment_amount_param DECIMAL(10,2),
  frequency_param debt_frequency,
  start_date_param DATE
)
RETURNS VOID AS $$
DECLARE
  payment_date DATE := start_date_param;
  remaining_amount DECIMAL(10,2) := total_amount_param;
  installment_count INTEGER := 0;
  max_installments INTEGER := 1000; -- Safety limit
BEGIN
  -- Clear existing schedule for this debt
  DELETE FROM payment_schedule WHERE debt_id = debt_id_param;
  
  -- Generate payment schedule
  WHILE remaining_amount > 0 AND installment_count < max_installments LOOP
    INSERT INTO payment_schedule (debt_id, due_date, amount)
    VALUES (
      debt_id_param,
      payment_date,
      LEAST(installment_amount_param, remaining_amount)
    );
    
    remaining_amount := remaining_amount - installment_amount_param;
    installment_count := installment_count + 1;
    
    -- Calculate next payment date based on frequency
    IF frequency_param = 'daily' THEN
      payment_date := payment_date + INTERVAL '1 day';
    ELSIF frequency_param = 'weekly' THEN
      payment_date := payment_date + INTERVAL '1 week';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update payment schedule status based on due dates
CREATE OR REPLACE FUNCTION update_overdue_payments()
RETURNS VOID AS $$
BEGIN
  UPDATE payment_schedule 
  SET status = 'overdue'
  WHERE status = 'pending' 
  AND due_date < NOW()::DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get collector's daily route with client and debt information
CREATE OR REPLACE FUNCTION get_collector_daily_route(
  collector_id_param UUID,
  route_date_param DATE DEFAULT NULL
)
RETURNS TABLE (
  route_assignment_id UUID,
  client_id UUID,
  client_name TEXT,
  client_address TEXT,
  client_phone TEXT,
  payment_schedule_id UUID,
  amount_due DECIMAL(10,2),
  visit_order INTEGER,
  payment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ra.id as route_assignment_id,
    c.id as client_id,
    c.name as client_name,
    c.address as client_address,
    c.phone as client_phone,
    ps.id as payment_schedule_id,
    ps.amount as amount_due,
    ra.visit_order,
    COALESCE(p.payment_status::TEXT, 'pending') as payment_status
  FROM route_assignments ra
  JOIN routes r ON ra.route_id = r.id
  JOIN clients c ON ra.client_id = c.id
  LEFT JOIN payment_schedule ps ON ra.payment_schedule_id = ps.id
  LEFT JOIN payments p ON p.route_assignment_id = ra.id
  WHERE r.collector_id = collector_id_param
  AND r.route_date = COALESCE(route_date_param, CURRENT_DATE)
  ORDER BY ra.visit_order NULLS LAST, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for daily collection summary
CREATE OR REPLACE VIEW daily_collection_summary AS
SELECT 
  r.route_date,
  r.collector_id,
  p.full_name as collector_name,
  COUNT(ra.id) as total_clients,
  COUNT(CASE WHEN pay.payment_status = 'paid' THEN 1 END) as clients_paid,
  COUNT(CASE WHEN pay.payment_status = 'not_paid' THEN 1 END) as clients_not_paid,
  COUNT(CASE WHEN pay.payment_status = 'client_absent' THEN 1 END) as clients_absent,
  COALESCE(SUM(CASE WHEN pay.payment_status = 'paid' THEN pay.amount_paid END), 0) as total_collected,
  COALESCE(SUM(ps.amount), 0) as total_expected
FROM routes r
JOIN profiles p ON r.collector_id = p.id
LEFT JOIN route_assignments ra ON r.id = ra.route_id
LEFT JOIN payment_schedule ps ON ra.payment_schedule_id = ps.id
LEFT JOIN payments pay ON ra.id = pay.route_assignment_id
GROUP BY r.route_date, r.collector_id, p.full_name;

-- View for client debt summary
CREATE OR REPLACE VIEW client_debt_summary AS
SELECT 
  c.id as client_id,
  c.name as client_name,
  c.address,
  c.phone,
  COUNT(d.id) as total_debts,
  COUNT(CASE WHEN d.status = 'active' THEN 1 END) as active_debts,
  COALESCE(SUM(CASE WHEN d.status = 'active' THEN d.total_amount END), 0) as total_active_debt,
  COALESCE(SUM(
    CASE WHEN d.status = 'active' THEN 
      (SELECT SUM(amount) FROM payment_schedule WHERE debt_id = d.id AND status = 'pending')
    END
  ), 0) as pending_amount
FROM clients c
LEFT JOIN debts d ON c.id = d.client_id
GROUP BY c.id, c.name, c.address, c.phone;

-- Trigger to automatically generate payment schedule when debt is created
CREATE OR REPLACE FUNCTION trigger_generate_payment_schedule()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM generate_payment_schedule(
    NEW.id,
    NEW.total_amount,
    NEW.installment_amount,
    NEW.frequency,
    NEW.start_date
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_payment_schedule
  AFTER INSERT ON debts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_payment_schedule();

-- Trigger to update payment schedule status when payment is recorded
CREATE OR REPLACE FUNCTION trigger_update_payment_schedule_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND NEW.payment_schedule_id IS NOT NULL THEN
    UPDATE payment_schedule 
    SET status = 'paid'
    WHERE id = NEW.payment_schedule_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_schedule_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_payment_schedule_status();