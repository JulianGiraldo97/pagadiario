-- Sistema de Paga Diario - Route Management Functions
-- Migration: 005_route_management_functions.sql

-- Function to get clients with active debts for route assignment
CREATE OR REPLACE FUNCTION get_clients_with_active_debts()
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  phone TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  total_active_debt DECIMAL(10,2),
  pending_amount DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.address,
    c.phone,
    c.created_by,
    c.created_at,
    c.updated_at,
    COALESCE(SUM(CASE WHEN d.status = 'active' THEN d.total_amount END), 0) as total_active_debt,
    COALESCE(SUM(
      CASE WHEN d.status = 'active' THEN 
        (SELECT SUM(ps.amount) FROM payment_schedule ps WHERE ps.debt_id = d.id AND ps.status = 'pending')
      END
    ), 0) as pending_amount
  FROM clients c
  LEFT JOIN debts d ON c.id = d.client_id
  GROUP BY c.id, c.name, c.address, c.phone, c.created_by, c.created_at, c.updated_at
  HAVING COALESCE(SUM(CASE WHEN d.status = 'active' THEN d.total_amount END), 0) > 0
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for route conflicts before creation
CREATE OR REPLACE FUNCTION check_route_conflicts(
  collector_id_param UUID,
  route_date_param DATE,
  client_ids_param UUID[]
)
RETURNS TABLE (
  conflict_type TEXT,
  conflict_message TEXT,
  conflicting_collector_name TEXT
) AS $$
DECLARE
  client_id UUID;
  existing_collector_name TEXT;
BEGIN
  -- Check if collector already has a route for this date
  SELECT p.full_name INTO existing_collector_name
  FROM routes r
  JOIN profiles p ON r.collector_id = p.id
  WHERE r.collector_id = collector_id_param 
  AND r.route_date = route_date_param;
  
  IF existing_collector_name IS NOT NULL THEN
    RETURN QUERY SELECT 
      'collector_conflict'::TEXT,
      'El cobrador ya tiene una ruta asignada para esta fecha'::TEXT,
      existing_collector_name;
    RETURN;
  END IF;
  
  -- Check if any client is already assigned to another collector for this date
  FOREACH client_id IN ARRAY client_ids_param LOOP
    SELECT p.full_name INTO existing_collector_name
    FROM route_assignments ra
    JOIN routes r ON ra.route_id = r.id
    JOIN profiles p ON r.collector_id = p.id
    WHERE ra.client_id = client_id 
    AND r.route_date = route_date_param
    AND r.collector_id != collector_id_param;
    
    IF existing_collector_name IS NOT NULL THEN
      RETURN QUERY SELECT 
        'client_conflict'::TEXT,
        'Uno o más clientes ya están asignados a otro cobrador para esta fecha'::TEXT,
        existing_collector_name;
      RETURN;
    END IF;
  END LOOP;
  
  -- No conflicts found
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get route statistics
CREATE OR REPLACE FUNCTION get_route_statistics(route_id_param UUID)
RETURNS TABLE (
  total_clients INTEGER,
  clients_visited INTEGER,
  clients_pending INTEGER,
  total_collected DECIMAL(10,2),
  total_expected DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(ra.id)::INTEGER as total_clients,
    COUNT(CASE WHEN p.payment_status IS NOT NULL THEN 1 END)::INTEGER as clients_visited,
    COUNT(CASE WHEN p.payment_status IS NULL THEN 1 END)::INTEGER as clients_pending,
    COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount_paid END), 0) as total_collected,
    COALESCE(SUM(ps.amount), 0) as total_expected
  FROM route_assignments ra
  LEFT JOIN payment_schedule ps ON ra.payment_schedule_id = ps.id
  LEFT JOIN payments p ON ra.id = p.route_assignment_id
  WHERE ra.route_id = route_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;