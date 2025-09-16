-- Sistema de Paga Diario - Initial Database Schema
-- Migration: 001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'collector');
CREATE TYPE debt_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE debt_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE payment_schedule_status AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE route_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE payment_status AS ENUM ('paid', 'not_paid', 'client_absent');

-- Tabla de perfiles de usuario (extendida de auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'collector',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de deudas
CREATE TABLE debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  installment_amount DECIMAL(10,2) NOT NULL CHECK (installment_amount > 0),
  frequency debt_frequency NOT NULL,
  start_date DATE NOT NULL,
  status debt_status DEFAULT 'active',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cronograma de pagos
CREATE TABLE payment_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status payment_schedule_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de rutas
CREATE TABLE routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id UUID REFERENCES profiles(id) NOT NULL,
  route_date DATE NOT NULL,
  status route_status DEFAULT 'pending',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collector_id, route_date)
);

-- Tabla de asignaciones de ruta
CREATE TABLE route_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  payment_schedule_id UUID REFERENCES payment_schedule(id),
  visit_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(route_id, client_id)
);

-- Tabla de pagos registrados
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_assignment_id UUID REFERENCES route_assignments(id),
  payment_schedule_id UUID REFERENCES payment_schedule(id),
  amount_paid DECIMAL(10,2) CHECK (amount_paid >= 0),
  payment_status payment_status NOT NULL,
  evidence_photo_url TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();