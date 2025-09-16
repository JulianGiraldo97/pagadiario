-- Sistema de Paga Diario - Seed Data
-- This file contains initial data for development and testing

-- Insert sample admin user (this would typically be done through Supabase Auth UI)
-- Note: In production, users should be created through the authentication flow
-- This is just for development purposes

-- Sample profiles (these IDs should match actual auth.users IDs in your Supabase project)
-- You'll need to replace these UUIDs with actual user IDs from your auth.users table

-- Example admin profile
-- INSERT INTO profiles (id, email, full_name, role) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'admin@pagadiario.com', 'Administrador Sistema', 'admin');

-- Example collector profiles
-- INSERT INTO profiles (id, email, full_name, role) VALUES 
-- ('00000000-0000-0000-0000-000000000002', 'cobrador1@pagadiario.com', 'Juan Pérez', 'collector'),
-- ('00000000-0000-0000-0000-000000000003', 'cobrador2@pagadiario.com', 'María García', 'collector');

-- Sample clients
INSERT INTO clients (name, address, phone) VALUES 
('Ana Rodríguez', 'Calle 123 #45-67, Barrio Centro', '3001234567'),
('Carlos Mendoza', 'Carrera 89 #12-34, Barrio Norte', '3009876543'),
('Lucía Fernández', 'Avenida 56 #78-90, Barrio Sur', '3005551234'),
('Roberto Silva', 'Calle 34 #56-78, Barrio Este', '3007778888'),
('Patricia López', 'Carrera 12 #34-56, Barrio Oeste', '3002223333');

-- Note: Debts, routes, and other data should be created through the application
-- to ensure proper validation and business logic execution

-- Create a function to set up sample data with proper user IDs
CREATE OR REPLACE FUNCTION setup_sample_data(
  admin_user_id UUID,
  collector1_user_id UUID,
  collector2_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert profiles
  INSERT INTO profiles (id, email, full_name, role) VALUES 
  (admin_user_id, 'admin@pagadiario.com', 'Administrador Sistema', 'admin')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  
  INSERT INTO profiles (id, email, full_name, role) VALUES 
  (collector1_user_id, 'cobrador1@pagadiario.com', 'Juan Pérez', 'collector')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  
  IF collector2_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, full_name, role) VALUES 
    (collector2_user_id, 'cobrador2@pagadiario.com', 'María García', 'collector')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  END IF;
  
  -- Update clients to have created_by reference
  UPDATE clients SET created_by = admin_user_id WHERE created_by IS NULL;
  
END;
$$ LANGUAGE plpgsql;

-- Instructions for using this seed data:
-- 1. Create users through Supabase Auth (sign up process)
-- 2. Get the user IDs from auth.users table
-- 3. Run: SELECT setup_sample_data('admin-uuid', 'collector1-uuid', 'collector2-uuid');