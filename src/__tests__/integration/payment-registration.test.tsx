/**
 * Integration tests for payment registration functionality
 * Tests the complete flow from collector dashboard to payment registration
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentForm from '@/components/forms/PaymentForm';
import type { Payment } from '@/lib/types';

// Mock Supabase functions
jest.mock('@/lib/supabase/payments', () => ({
  recordPayment: jest.fn(),
  updatePayment: jest.fn(),
  getPaymentByAssignment: jest.fn(),
}));

// Mock hooks - provide a simple mock that doesn't require the actual module
const mockUseIsMobile = jest.fn(() => false);
jest.doMock('@/hooks/useIsMobile', () => ({
  useIsMobile: mockUseIsMobile,
}));

describe('Payment Registration Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PaymentForm Component Integration', () => {
    const defaultProps = {
      assignmentId: 'assignment-123',
      paymentScheduleId: 'schedule-123',
      clientName: 'Juan Pérez',
      expectedAmount: 1000,
      onSuccess: jest.fn(),
      onCancel: jest.fn(),
    };

    it('renders payment form with all required fields', () => {
      render(<PaymentForm {...defaultProps} />);

      expect(screen.getByText('Registrar Pago')).toBeInTheDocument();
      expect(screen.getByText('Cliente: Juan Pérez')).toBeInTheDocument();
      expect(screen.getByLabelText(/Estado del Pago/)).toBeInTheDocument();
      expect(screen.getByText('Pagó')).toBeInTheDocument();
      expect(screen.getByText('No Pagó')).toBeInTheDocument();
      expect(screen.getByText('Ausente')).toBeInTheDocument();
    });

    it('shows amount field when payment status is "paid"', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Select "Pagó" option
      const paidRadio = screen.getByDisplayValue('paid');
      await user.click(paidRadio);

      expect(screen.getByLabelText(/Monto Recibido/)).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    it('hides amount field when payment status is not "paid"', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Select "No Pagó" option
      const notPaidRadio = screen.getByDisplayValue('not_paid');
      await user.click(notPaidRadio);

      expect(screen.queryByLabelText(/Monto Recibido/)).not.toBeInTheDocument();
    });

    it('requires evidence photo for non-payment statuses', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Select "No Pagó" option
      const notPaidRadio = screen.getByDisplayValue('not_paid');
      await user.click(notPaidRadio);

      // Try to submit without photo
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/La foto de evidencia es requerida/)).toBeInTheDocument();
      });
    });

    it('handles file upload for evidence photo', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Select "No Pagó" option to require photo
      const notPaidRadio = screen.getByDisplayValue('not_paid');
      await user.click(notPaidRadio);

      // Create a mock file
      const file = new File(['test'], 'evidence.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Foto de Evidencia/) as HTMLInputElement;

      await user.upload(fileInput, file);

      expect(fileInput.files?.[0]).toBe(file);
    });

    it('validates file type for evidence photo', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Create a non-image file
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/Foto de Evidencia/) as HTMLInputElement;

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
  });

  describe('Form Validation Integration', () => {
    const defaultProps = {
      assignmentId: 'assignment-123',
      paymentScheduleId: 'schedule-123',
      clientName: 'Juan Pérez',
      expectedAmount: 1000,
      onSuccess: jest.fn(),
      onCancel: jest.fn(),
    };

    it('validates required fields before submission', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Try to submit without selecting payment status
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Selecciona el estado del pago/)).toBeInTheDocument();
      });
    });

    it('validates amount when payment status is paid', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Select "Pagó" option
      const paidRadio = screen.getByDisplayValue('paid');
      await user.click(paidRadio);

      // Clear the amount field
      const amountInput = screen.getByLabelText(/Monto Recibido/);
      await user.clear(amountInput);

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Ingresa el monto recibido/)).toBeInTheDocument();
      });
    });

    it('validates evidence photo for non-payment statuses', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Select "No Pagó" option
      const notPaidRadio = screen.getByDisplayValue('not_paid');
      await user.click(notPaidRadio);

      // Try to submit without photo
      const submitButton = screen.getByRole('button', { name: /Registrar/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/La foto de evidencia es requerida/)).toBeInTheDocument();
      });
    });
  });
});
