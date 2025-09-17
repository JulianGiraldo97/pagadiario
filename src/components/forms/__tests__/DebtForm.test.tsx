import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DebtForm from '../DebtForm';
import type { Client, CreateDebtForm } from '@/lib/types';

// Mock the debts module
jest.mock('@/lib/supabase/debts', () => ({
  generatePaymentSchedule: jest.fn((totalAmount, installmentAmount, frequency, startDate) => [
    { due_date: '2024-01-01', amount: installmentAmount, installment_number: 1 },
    { due_date: '2024-01-02', amount: installmentAmount, installment_number: 2 }
  ])
}));

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    address: 'Calle 123',
    phone: '555-0001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'María García',
    address: 'Avenida 456',
    phone: '555-0002',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('DebtForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDebtForm = (props = {}) => {
    const defaultProps = {
      clients: mockClients,
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
      isLoading: false,
      ...props
    };

    return render(<DebtForm {...defaultProps} />);
  };

  it('renders form with all required fields', () => {
    renderDebtForm();

    expect(screen.getByLabelText(/cliente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monto total/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/frecuencia de pago/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monto por cuota/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de inicio/i)).toBeInTheDocument();
  });

  it('displays client options correctly', () => {
    renderDebtForm();

    const clientSelect = screen.getByLabelText(/cliente/i);
    expect(clientSelect).toBeInTheDocument();
    
    // Check that clients are in the select options
    expect(screen.getByText('Juan Pérez - Calle 123')).toBeInTheDocument();
    expect(screen.getByText('María García - Avenida 456')).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    renderDebtForm();

    const submitButton = screen.getByRole('button', { name: /crear deuda/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/seleccione un cliente/i)).toBeInTheDocument();
      expect(screen.getByText(/el monto total es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/seleccione la frecuencia/i)).toBeInTheDocument();
      expect(screen.getByText(/el monto por cuota es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/la fecha de inicio es requerida/i)).toBeInTheDocument();
    });
  });

  it('validates that installment amount is not greater than total amount', async () => {
    const user = userEvent.setup();
    renderDebtForm();

    await user.selectOptions(screen.getByLabelText(/cliente/i), '1');
    await user.type(screen.getByLabelText(/monto total/i), '1000');
    await user.type(screen.getByLabelText(/monto por cuota/i), '1500');
    await user.selectOptions(screen.getByLabelText(/frecuencia de pago/i), 'daily');
    await user.type(screen.getByLabelText(/fecha de inicio/i), '2024-01-01');

    const submitButton = screen.getByRole('button', { name: /crear deuda/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/la cuota no puede ser mayor al monto total/i)).toBeInTheDocument();
    });
  });

  it('suggests installment amount when frequency changes', async () => {
    const user = userEvent.setup();
    renderDebtForm();

    // Fill total amount first
    await user.type(screen.getByLabelText(/monto total/i), '3000');
    
    // Select daily frequency
    await user.selectOptions(screen.getByLabelText(/frecuencia de pago/i), 'daily');

    await waitFor(() => {
      const installmentInput = screen.getByLabelText(/monto por cuota/i) as HTMLInputElement;
      expect(installmentInput.value).toBe('100'); // 3000 / 30 days = 100
    });

    // Change to weekly frequency
    await user.selectOptions(screen.getByLabelText(/frecuencia de pago/i), 'weekly');

    await waitFor(() => {
      const installmentInput = screen.getByLabelText(/monto por cuota/i) as HTMLInputElement;
      expect(installmentInput.value).toBe('250'); // 3000 / 12 weeks = 250
    });
  });

  it('shows suggested installment amounts in help text', async () => {
    const user = userEvent.setup();
    renderDebtForm();

    await user.type(screen.getByLabelText(/monto total/i), '1200');
    await user.selectOptions(screen.getByLabelText(/frecuencia de pago/i), 'daily');

    expect(screen.getByText(/sugerido: \$40 \(30 días\)/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/frecuencia de pago/i), 'weekly');

    expect(screen.getByText(/sugerido: \$100 \(12 semanas\)/i)).toBeInTheDocument();
  });

  it('enables preview button when all required fields are filled', async () => {
    const user = userEvent.setup();
    renderDebtForm();

    const previewButton = screen.getByRole('button', { name: /previsualizar cronograma/i });
    expect(previewButton).toBeDisabled();

    // Fill all required fields for preview
    await user.selectOptions(screen.getByLabelText(/cliente/i), '1');
    await user.type(screen.getByLabelText(/monto total/i), '1000');
    await user.selectOptions(screen.getByLabelText(/frecuencia de pago/i), 'daily');
    await user.type(screen.getByLabelText(/monto por cuota/i), '100');
    await user.type(screen.getByLabelText(/fecha de inicio/i), '2024-01-01');

    expect(previewButton).toBeEnabled();
  });

  it('shows payment schedule preview when preview button is clicked', async () => {
    const user = userEvent.setup();
    renderDebtForm();

    // Fill required fields
    await user.selectOptions(screen.getByLabelText(/cliente/i), '1');
    await user.type(screen.getByLabelText(/monto total/i), '200');
    await user.selectOptions(screen.getByLabelText(/frecuencia de pago/i), 'daily');
    await user.type(screen.getByLabelText(/monto por cuota/i), '100');
    await user.type(screen.getByLabelText(/fecha de inicio/i), '2024-01-01');

    const previewButton = screen.getByRole('button', { name: /previsualizar cronograma/i });
    await user.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText(/cronograma de pagos \(previsualización\)/i)).toBeInTheDocument();
      expect(screen.getByText(/total de cuotas: 2/i)).toBeInTheDocument();
    });
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    renderDebtForm();

    // Fill form
    await user.selectOptions(screen.getByLabelText(/cliente/i), '1');
    await user.type(screen.getByLabelText(/monto total/i), '1000');
    await user.selectOptions(screen.getByLabelText(/frecuencia de pago/i), 'daily');
    await user.type(screen.getByLabelText(/monto por cuota/i), '100');
    await user.type(screen.getByLabelText(/fecha de inicio/i), '2024-01-01');

    const submitButton = screen.getByRole('button', { name: /crear deuda/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        client_id: '1',
        total_amount: 1000,
        installment_amount: 100,
        frequency: 'daily',
        start_date: '2024-01-01'
      });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderDebtForm();

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    renderDebtForm({ isLoading: true });

    const submitButton = screen.getByRole('button', { name: /creando.../i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument(); // spinner

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    expect(cancelButton).toBeDisabled();
  });

  it('validates minimum values for amounts', async () => {
    const user = userEvent.setup();
    renderDebtForm();

    await user.selectOptions(screen.getByLabelText(/cliente/i), '1');
    await user.type(screen.getByLabelText(/monto total/i), '0');
    await user.type(screen.getByLabelText(/monto por cuota/i), '0');

    const submitButton = screen.getByRole('button', { name: /crear deuda/i });
    await user.click(submitButton);

    await waitFor(() => {
      const errorMessages = screen.getAllByText(/el monto debe ser mayor a 0/i);
      expect(errorMessages).toHaveLength(2); // One for each amount field
    });
  });

  it('sets minimum date to today for start date', () => {
    renderDebtForm();

    const dateInput = screen.getByLabelText(/fecha de inicio/i) as HTMLInputElement;
    const today = new Date().toISOString().split('T')[0];
    expect(dateInput.min).toBe(today);
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    renderDebtForm();

    // Fill and submit form
    await user.selectOptions(screen.getByLabelText(/cliente/i), '1');
    await user.type(screen.getByLabelText(/monto total/i), '1000');
    await user.selectOptions(screen.getByLabelText(/frecuencia de pago/i), 'daily');
    await user.type(screen.getByLabelText(/monto por cuota/i), '100');
    await user.type(screen.getByLabelText(/fecha de inicio/i), '2024-01-01');

    const submitButton = screen.getByRole('button', { name: /crear deuda/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Check that form is reset
    await waitFor(() => {
      const clientSelect = screen.getByLabelText(/cliente/i) as HTMLSelectElement;
      const totalAmountInput = screen.getByLabelText(/monto total/i) as HTMLInputElement;
      
      expect(clientSelect.value).toBe('');
      expect(totalAmountInput.value).toBe('');
    });
  });
});