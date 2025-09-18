import { render, screen, fireEvent } from '@testing-library/react';
import ClientCard from '../ClientCard';
import type { RouteAssignmentWithDetails } from '@/lib/types';

// Mock assignment data
const mockAssignment: RouteAssignmentWithDetails = {
  id: '1',
  route_id: 'route-1',
  client_id: 'client-1',
  visit_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  client: {
    id: 'client-1',
    name: 'Juan Pérez',
    address: 'Calle 123 #45-67',
    phone: '3001234567',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  payment_schedule: {
    id: 'schedule-1',
    debt_id: 'debt-1',
    due_date: '2024-01-01',
    amount: 50000,
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z'
  }
};

const mockAssignmentWithPayment: RouteAssignmentWithDetails = {
  ...mockAssignment,
  payment: {
    id: 'payment-1',
    payment_status: 'paid',
    amount_paid: 50000,
    recorded_at: '2024-01-01T10:00:00Z'
  }
};

describe('ClientCard', () => {
  const mockOnPaymentClick = jest.fn();

  beforeEach(() => {
    mockOnPaymentClick.mockClear();
  });

  it('renders client information correctly', () => {
    render(
      <ClientCard 
        assignment={mockAssignment} 
        onPaymentClick={mockOnPaymentClick} 
      />
    );

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Calle 123 #45-67')).toBeInTheDocument();
    expect(screen.getByText('3001234567')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  it('shows pending status for unpaid clients', () => {
    render(
      <ClientCard 
        assignment={mockAssignment} 
        onPaymentClick={mockOnPaymentClick} 
      />
    );

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Registrar Pago')).toBeInTheDocument();
  });

  it('shows paid status for paid clients', () => {
    render(
      <ClientCard 
        assignment={mockAssignmentWithPayment} 
        onPaymentClick={mockOnPaymentClick} 
      />
    );

    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.queryByText('Registrar Pago')).not.toBeInTheDocument();
  });

  it('calls onPaymentClick when payment button is clicked', () => {
    render(
      <ClientCard 
        assignment={mockAssignment} 
        onPaymentClick={mockOnPaymentClick} 
      />
    );

    fireEvent.click(screen.getByText('Registrar Pago'));
    expect(mockOnPaymentClick).toHaveBeenCalledWith(mockAssignment);
  });

  it('renders mobile optimized version', () => {
    render(
      <ClientCard 
        assignment={mockAssignment} 
        onPaymentClick={mockOnPaymentClick} 
        isOptimizedForMobile={true}
      />
    );

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    // Mobile version should have expand button
    const expandButton = screen.getByRole('button', { name: /chevron/i });
    expect(expandButton).toBeInTheDocument();
  });
});