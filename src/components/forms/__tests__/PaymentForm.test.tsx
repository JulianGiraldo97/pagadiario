/**
 * Unit tests for PaymentForm component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentForm from '../PaymentForm';
import { recordPayment, updatePayment } from '@/lib/supabase/payments';
import type { Payment } from '@/lib/types';

// Mock Supabase functions
const mockRecordPayment = jest.fn();
const mockUpdatePayment = jest.fn();

jest.mock('@/lib/supabase/payments', () => ({
  recordPayment: (...args: any[]) => mockRecordPayment(...args),
  updatePayment: (...args: any[]) => mockUpdatePayment(...args),
}));

describe('PaymentForm', () => {
  const defaultProps = {
    assignmentId: 'assignment-123',
    paymentScheduleId: 'schedule-123',
    clientName: 'Juan Pérez',
    expectedAmount: 1000,
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form with correct title and client name', () => {
      render(<PaymentForm {...defaultProps} />);

      expect(screen.getByText('Registrar Pago')).toBeInTheDocument();
      expect(screen.getByText('Cliente: Juan Pérez')).toBeInTheDocument();
    });

    it('renders form in edit mode when existing payment is provided', () => {
      const existingPayment: Payment = {
        id: 'payment-123',
        route_assignment_id: 'assignment-123',
        payment_schedule_id: 'schedule-123',
        amount_paid: 800,
        payment_status: 'paid',
        evidence_photo_url: undefined,
        notes: 'Existing payment',
        recorded_by: 'user-123',
        recorded_at: new Date().toISOString(),
      };

      render(<PaymentForm {...defaultProps} existingPayment={existingPayment} />);

      expect(screen.getByText('Editar Registro')).toBeInTheDocument();
      expect(screen.getByDisplayValue('800')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing payment')).toBeInTheDocument();
    });

    it('renders all payment status options', () => {
      render(<PaymentForm {...defaultProps} />);

      expect(screen.getByText('Pagó')).toBeInTheDocument();
      expect(screen.getByText('No Pagó')).toBeInTheDocument();
      expect(screen.getByText('Ausente')).toBeInTheDocument();
    });

    it('shows expected amount and quick fill button', () => {
      render(<PaymentForm {...defaultProps} />);

      // Select "Pagó" to show amount field
      const paidRadio = screen.getByDisplayValue('paid');
      fireEvent.click(paidRadio);

      expect(screen.getByText('Monto esperado: $1,000')).toBeInTheDocument();
      expect(screen.getByText('Usar monto esperado')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('shows amount field only when payment status is "paid"', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Initially, amount field should not be visible (default is paid but need to select)
      expect(screen.queryByLabelText(/Monto Recibido/)).not.toBeInTheDocument();

      // Select "Pagó"
      const paidRadio = screen.getByDisplayValue('paid');
      await user.click(paidRadio);

      expect(screen.getByLabelText(/Monto Recibido/)).toBeInTheDocument();

      // Select "No Pagó"
      const notPaidRadio = screen.getByDisplayValue('not_paid');
      await user.click(notPaidRadio);

      expect(screen.queryByLabelText(/Monto Recibido/)).not.toBeInTheDocument();
    });

    it('fills expected amount when quick fill button is clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Select "Pagó" to show amount field
      const paidRadio = screen.getByDisplayValue('paid');
      await user.click(paidRadio);

      const amountInput = screen.getByLabelText(/Monto Recibido/);
      const quickFillButton = screen.getByText('Usar monto esperado');

      // Clear the input first
      await user.clear(amountInput);
      expect(amountInput).toHaveValue(null);

      // Click quick fill
      await user.click(quickFillButton);
      expect(amountInput).toHaveValue(1000);
    });

    it('handles file upload for evidence photo', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const file = new File(['test'], 'evidence.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Foto de Evidencia/);

      await user.upload(fileInput, file);

      expect((fileInput as HTMLInputElement).files?.[0]).toBe(file);
    });

    it('shows preview when image is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        result: 'data:image/jpeg;base64,test',
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      const file = new File(['test'], 'evidence.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Foto de Evidencia/);

      await user.upload(fileInput, file);

      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } } as any);

      await waitFor(() => {
        expect(screen.getByAltText('Vista previa')).toBeInTheDocument();
      });
    });

    it('removes image preview when remove button is clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        result: 'data:image/jpeg;base64,test',
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      const file = new File(['test'], 'evidence.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Foto de Evidencia/);

      await user.upload(fileInput, file);

      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } } as any);

      await waitFor(() => {
        expect(screen.getByAltText('Vista previa')).toBeInTheDocument();
      });

      // Click remove button
      const removeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(removeButton);

      expect(screen.queryByAltText('Vista previa')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires payment status selection', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Selecciona el estado del pago/)).toBeInTheDocument();
      });
    });

    it('requires amount when payment status is "paid"', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Select "Pagó"
      const paidRadio = screen.getByDisplayValue('paid');
      await user.click(paidRadio);

      // Clear the amount field
      const amountInput = screen.getByLabelText(/Monto Recibido/);
      await user.clear(amountInput);

      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Ingresa el monto recibido/)).toBeInTheDocument();
      });
    });

    it('requires evidence photo for non-payment statuses', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Select "No Pagó"
      const notPaidRadio = screen.getByDisplayValue('not_paid');
      await user.click(notPaidRadio);

      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/La foto de evidencia es requerida/)).toBeInTheDocument();
      });
    });

    it('validates minimum amount', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Select "Pagó"
      const paidRadio = screen.getByDisplayValue('paid');
      await user.click(paidRadio);

      // Enter negative amount
      const amountInput = screen.getByLabelText(/Monto Recibido/);
      await user.clear(amountInput);
      await user.type(amountInput, '-100');

      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/El monto debe ser mayor a 0/)).toBeInTheDocument();
      });
    });

    it('validates file type for evidence photo', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Create a non-image file
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/Foto de Evidencia/);

      // Mock the file input change event
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/Solo se permiten archivos de imagen/)).toBeInTheDocument();
      });
    });

    it('validates file size for evidence photo', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Create a large file (6MB)
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Foto de Evidencia/);

      // Mock the file input change event
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/El archivo no puede ser mayor a 5MB/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('successfully submits new payment', async () => {
      const user = userEvent.setup();
      const mockPayment: Payment = {
        id: 'payment-123',
        route_assignment_id: 'assignment-123',
        payment_schedule_id: 'schedule-123',
        amount_paid: 1000,
        payment_status: 'paid',
        evidence_photo_url: undefined,
        notes: 'Test payment',
        recorded_by: 'user-123',
        recorded_at: new Date().toISOString(),
      };

      mockRecordPayment.mockResolvedValue({
        data: mockPayment,
        error: null,
      });

      render(<PaymentForm {...defaultProps} />);

      // Fill form
      const paidRadio = screen.getByDisplayValue('paid');
      await user.click(paidRadio);

      const amountInput = screen.getByLabelText(/Monto Recibido/);
      await user.clear(amountInput);
      await user.type(amountInput, '1000');

      const notesInput = screen.getByLabelText(/Observaciones/);
      await user.type(notesInput, 'Test payment');

      // Submit
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRecordPayment).toHaveBeenCalledWith({
          route_assignment_id: 'assignment-123',
          payment_schedule_id: 'schedule-123',
          amount_paid: 1000,
          payment_status: 'paid',
          evidence_photo: undefined,
          notes: 'Test payment',
        });
        expect(defaultProps.onSuccess).toHaveBeenCalledWith(mockPayment);
      });
    });

    it('successfully updates existing payment', async () => {
      const user = userEvent.setup();
      const existingPayment: Payment = {
        id: 'payment-123',
        route_assignment_id: 'assignment-123',
        payment_schedule_id: 'schedule-123',
        amount_paid: 800,
        payment_status: 'paid',
        evidence_photo_url: undefined,
        notes: 'Original payment',
        recorded_by: 'user-123',
        recorded_at: new Date().toISOString(),
      };

      const updatedPayment: Payment = {
        ...existingPayment,
        amount_paid: 1000,
        notes: 'Updated payment',
      };

      mockUpdatePayment.mockResolvedValue({
        data: updatedPayment,
        error: null,
      });

      render(<PaymentForm {...defaultProps} existingPayment={existingPayment} />);

      // Update amount
      const amountInput = screen.getByLabelText(/Monto Recibido/);
      await user.clear(amountInput);
      await user.type(amountInput, '1000');

      // Update notes
      const notesInput = screen.getByLabelText(/Observaciones/);
      await user.clear(notesInput);
      await user.type(notesInput, 'Updated payment');

      // Submit
      const submitButton = screen.getByRole('button', { name: /Actualizar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePayment).toHaveBeenCalledWith('payment-123', {
          route_assignment_id: 'assignment-123',
          payment_schedule_id: 'schedule-123',
          amount_paid: 1000,
          payment_status: 'paid',
          evidence_photo: undefined,
          notes: 'Updated payment',
        });
        expect(defaultProps.onSuccess).toHaveBeenCalledWith(updatedPayment);
      });
    });

    it('handles submission error', async () => {
      const user = userEvent.setup();
      mockRecordPayment.mockResolvedValue({
        data: null,
        error: 'Error de conexión',
      });

      render(<PaymentForm {...defaultProps} />);

      // Fill and submit form
      const paidRadio = screen.getByDisplayValue('paid');
      await user.click(paidRadio);

      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Error de conexión/)).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockRecordPayment.mockReturnValue(promise);

      render(<PaymentForm {...defaultProps} />);

      // Fill and submit form
      const paidRadio = screen.getByDisplayValue('paid');
      await user.click(paidRadio);

      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText(/Registrando.../)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve promise
      resolvePromise!({ data: null, error: 'Test error' });

      await waitFor(() => {
        expect(screen.queryByText(/Registrando.../)).not.toBeInTheDocument();
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancelar/ });
      await user.click(cancelButton);

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });
});