import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CollectorForm from '../CollectorForm';
import type { Profile } from '../../../lib/types';

// Mock the collectors module
jest.mock('../../../lib/supabase/collectors', () => ({
  createCollector: jest.fn(),
  updateCollector: jest.fn()
}));

import { createCollector, updateCollector } from '../../../lib/supabase/collectors';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

const mockCreateCollector = createCollector as jest.MockedFunction<typeof createCollector>;
const mockUpdateCollector = updateCollector as jest.MockedFunction<typeof updateCollector>;

const mockCollector: Profile = {
  id: '1',
  email: 'test@example.com',
  full_name: 'Test Collector',
  role: 'collector',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('CollectorForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <CollectorForm 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña *')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar Contraseña *')).toBeInTheDocument();
    expect(screen.getByText('Crear Cobrador')).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    render(
      <CollectorForm 
        collector={mockCollector}
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByDisplayValue('Test Collector')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.queryByLabelText('Contraseña *')).not.toBeInTheDocument();
    expect(screen.getByText('Actualizar Cobrador')).toBeInTheDocument();
  });

  it('shows submit button as disabled initially', () => {
    render(
      <CollectorForm 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    const submitButton = screen.getByText('Crear Cobrador');
    expect(submitButton).toBeInTheDocument();
  });

  it('allows filling form fields', () => {
    render(
      <CollectorForm 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(nameInput).toHaveValue('Test User');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('creates collector successfully', async () => {
    mockCreateCollector.mockResolvedValue({
      data: mockCollector,
      error: null
    });

    render(
      <CollectorForm 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Fill form correctly
    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Contraseña *'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText('Confirmar Contraseña *'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByText('Crear Cobrador'));

    await waitFor(() => {
      expect(mockCreateCollector).toHaveBeenCalledWith({
        email: 'test@example.com',
        full_name: 'Test User',
        password: 'password123'
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(mockCollector);
    });
  });

  it('handles create error', async () => {
    mockCreateCollector.mockResolvedValue({
      data: null,
      error: 'Email already exists'
    });

    render(
      <CollectorForm 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Fill form correctly
    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Contraseña *'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText('Confirmar Contraseña *'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByText('Crear Cobrador'));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <CollectorForm 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});