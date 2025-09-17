import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RouteForm from '../RouteForm';
import type { Profile, ClientWithDebt, CreateRouteForm } from '@/lib/types';

// Mock data
const mockCollectors: Profile[] = [
  {
    id: '1',
    email: 'collector1@test.com',
    full_name: 'Juan Pérez',
    role: 'collector',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockClients: ClientWithDebt[] = [
  {
    id: '1',
    name: 'Cliente Test',
    address: 'Dirección Test',
    phone: '123456789',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    total_active_debt: 1000,
    pending_amount: 500
  }
];

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('RouteForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(
      <RouteForm
        collectors={mockCollectors}
        clients={mockClients}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/cobrador/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de la ruta/i)).toBeInTheDocument();
    expect(screen.getByText(/clientes disponibles/i)).toBeInTheDocument();
    expect(screen.getByText(/ruta asignada/i)).toBeInTheDocument();
  });

  it('shows collectors in dropdown', () => {
    render(
      <RouteForm
        collectors={mockCollectors}
        clients={mockClients}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const collectorSelect = screen.getByLabelText(/cobrador/i);
    expect(collectorSelect).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('shows clients with active debts', () => {
    render(
      <RouteForm
        collectors={mockCollectors}
        clients={mockClients}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Cliente Test')).toBeInTheDocument();
    expect(screen.getByText('Dirección Test')).toBeInTheDocument();
    expect(screen.getByText(/deuda activa: \$1,000/i)).toBeInTheDocument();
  });

  it('allows client selection', async () => {
    render(
      <RouteForm
        collectors={mockCollectors}
        clients={mockClients}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const clientItem = screen.getByText('Cliente Test').closest('.list-group-item');
    expect(clientItem).toBeInTheDocument();

    if (clientItem) {
      fireEvent.click(clientItem);
    }

    await waitFor(() => {
      expect(screen.getByText(/ruta asignada \(1 clientes\)/i)).toBeInTheDocument();
    });
  });

  it('disables submit button when no clients selected', () => {
    render(
      <RouteForm
        collectors={mockCollectors}
        clients={mockClients}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Crear Ruta');
    expect(submitButton).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <RouteForm
        collectors={mockCollectors}
        clients={mockClients}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});