-- Script para crear datos de prueba para el sistema de pagos
-- Ejecutar en Supabase SQL Editor

-- Crear cliente de prueba si no existe
INSERT INTO clients (name, address, phone, created_at, updated_at)
SELECT 'Juan Pérez', 'Calle 123 #45-67, Barrio Centro', '3001234567', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Juan Pérez');

INSERT INTO clients (name, address, phone, created_at, updated_at)
SELECT 'María García', 'Carrera 45 #12-34, Barrio Norte', '3007654321', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'María García');

INSERT INTO clients (name, address, phone, created_at, updated_at)
SELECT 'Carlos López', 'Avenida 80 #23-45, Barrio Sur', '3009876543', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Carlos López');

-- Crear deudas de prueba para los clientes
DO $$
DECLARE
    client_juan_id UUID;
    client_maria_id UUID;
    client_carlos_id UUID;
    debt_juan_id UUID;
    debt_maria_id UUID;
    debt_carlos_id UUID;
BEGIN
    -- Obtener IDs de clientes
    SELECT id INTO client_juan_id FROM clients WHERE name = 'Juan Pérez' LIMIT 1;
    SELECT id INTO client_maria_id FROM clients WHERE name = 'María García' LIMIT 1;
    SELECT id INTO client_carlos_id FROM clients WHERE name = 'Carlos López' LIMIT 1;
    
    -- Crear deudas si no existen
    IF NOT EXISTS (SELECT 1 FROM debts WHERE client_id = client_juan_id) THEN
        INSERT INTO debts (client_id, total_amount, installment_amount, frequency, start_date, status, created_at, updated_at)
        VALUES (client_juan_id, 500000, 25000, 'daily', CURRENT_DATE, 'active', NOW(), NOW())
        RETURNING id INTO debt_juan_id;
        
        -- Crear cronograma de pagos para Juan (próximos 20 días)
        INSERT INTO payment_schedule (debt_id, due_date, amount, status, created_at)
        SELECT debt_juan_id, CURRENT_DATE + (i || ' days')::interval, 25000, 'pending', NOW()
        FROM generate_series(0, 19) i;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM debts WHERE client_id = client_maria_id) THEN
        INSERT INTO debts (client_id, total_amount, installment_amount, frequency, start_date, status, created_at, updated_at)
        VALUES (client_maria_id, 300000, 15000, 'daily', CURRENT_DATE, 'active', NOW(), NOW())
        RETURNING id INTO debt_maria_id;
        
        -- Crear cronograma de pagos para María (próximos 20 días)
        INSERT INTO payment_schedule (debt_id, due_date, amount, status, created_at)
        SELECT debt_maria_id, CURRENT_DATE + (i || ' days')::interval, 15000, 'pending', NOW()
        FROM generate_series(0, 19) i;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM debts WHERE client_id = client_carlos_id) THEN
        INSERT INTO debts (client_id, total_amount, installment_amount, frequency, start_date, status, created_at, updated_at)
        VALUES (client_carlos_id, 400000, 20000, 'daily', CURRENT_DATE, 'active', NOW(), NOW())
        RETURNING id INTO debt_carlos_id;
        
        -- Crear cronograma de pagos para Carlos (próximos 20 días)
        INSERT INTO payment_schedule (debt_id, due_date, amount, status, created_at)
        SELECT debt_carlos_id, CURRENT_DATE + (i || ' days')::interval, 20000, 'pending', NOW()
        FROM generate_series(0, 19) i;
    END IF;
END $$;