import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientForm from '../ClientForm';
import type { Client, CreateClientForm } from '@/lib/types';

// Mock client data
const mockClient: Client = {
  id: '1',
  name: 'Juan Pérez',
  address: 'Calle 123 #45-67',
  phone: '300 123 4567',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('ClientForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <ClientForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear cliente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('renders edit form with client data', () => {
    render(
      <ClientForm
        client={mockClient}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Calle 123 #45-67')).toBeInTheDocument();
    expect(screen.getByDisplayValue('300 123 4567')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actualizar cliente/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /crear cliente/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/la dirección es requerida/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates name length', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/nombre completo/i);
    await user.type(nameInput, 'A');

    const submitButton = screen.getByRole('button', { name: /crear cliente/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/el nombre debe tener al menos 2 caracteres/i)).toBeInTheDocument();
    });
  });

  it('validates phone format', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const phoneInput = screen.getByLabelText(/teléfono/i);
    await user.type(phoneInput, 'invalid-phone');

    const submitButton = screen.getByRole('button', { name: /crear cliente/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/formato de teléfono inválido/i)).toBeInTheDocument();
    });
  });

  it('submits valid form data', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(
      <ClientForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const addressInput = screen.getByLabelText(/dirección/i);
    const phoneInput = screen.getByLabelText(/teléfono/i);

    await user.type(nameInput, 'María García');
    await user.type(addressInput, 'Carrera 50 #25-30');
    await user.type(phoneInput, '310 555 1234');

    const submitButton = screen.getByRole('button', { name: /crear cliente/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'María García',
        address: 'Carrera 50 #25-30',
        phone: '310 555 1234'
      });
    });
  });

  it('handles submit errors', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Error al crear cliente';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));
    
    render(
      <ClientForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const addressInput = screen.getByLabelText(/dirección/i);

    await user.type(nameInput, 'Test Client');
    await user.type(addressInput, 'Test Address');

    const submitButton = screen.getByRole('button', { name: /crear cliente/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables form when loading', () => {
    render(
      <ClientForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByLabelText(/nombre completo/i)).toBeDisabled();
    expect(screen.getByLabelText(/dirección/i)).toBeDisabled();
    expect(screen.getByLabelText(/teléfono/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();
  });
});