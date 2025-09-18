import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CollectorTable from '../CollectorTable';
import type { Profile } from '../../../lib/types';

// Mock the collectors module
jest.mock('../../../lib/supabase/collectors', () => ({
  deleteCollector: jest.fn(),
  resetCollectorPassword: jest.fn()
}));

import { deleteCollector, resetCollectorPassword } from '../../../lib/supabase/collectors';

const mockDeleteCollector = deleteCollector as jest.MockedFunction<typeof deleteCollector>;
const mockResetCollectorPassword = resetCollectorPassword as jest.MockedFunction<typeof resetCollectorPassword>;

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

// Mock window.alert
const mockAlert = jest.fn();
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true
});

const mockCollectors: Profile[] = [
  {
    id: '1',
    email: 'collector1@example.com',
    full_name: 'Collector One',
    role: 'collector',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'collector2@example.com',
    full_name: 'Collector Two',
    role: 'collector',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

describe('CollectorTable', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('renders collectors correctly', () => {
    render(
      <CollectorTable
        collectors={mockCollectors}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Collector One')).toBeInTheDocument();
    expect(screen.getByText('Collector Two')).toBeInTheDocument();
    expect(screen.getByText('collector1@example.com')).toBeInTheDocument();
    expect(screen.getByText('collector2@example.com')).toBeInTheDocument();
  });

  it('shows empty state when no collectors', () => {
    render(
      <CollectorTable
        collectors={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No hay cobradores registrados')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <CollectorTable
        collectors={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        loading={true}
      />
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <CollectorTable
        collectors={mockCollectors}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByTitle('Editar cobrador');
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCollectors[0]);
  });

  it('deletes collector successfully', async () => {
    mockDeleteCollector.mockResolvedValue({
      success: true,
      error: null
    });

    render(
      <CollectorTable
        collectors={mockCollectors}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByTitle('Eliminar cobrador');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        '¿Estás seguro de que deseas eliminar al cobrador "Collector One"?'
      );
      expect(mockDeleteCollector).toHaveBeenCalledWith('1');
      expect(mockOnDelete).toHaveBeenCalledWith('1');
    });
  });

  it('handles delete error', async () => {
    mockDeleteCollector.mockResolvedValue({
      success: false,
      error: 'Cannot delete collector with active routes'
    });

    render(
      <CollectorTable
        collectors={mockCollectors}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByTitle('Eliminar cobrador');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Error al eliminar cobrador: Cannot delete collector with active routes'
      );
    });
  });

  it('opens password reset modal', () => {
    render(
      <CollectorTable
        collectors={mockCollectors}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const resetButtons = screen.getAllByTitle('Resetear contraseña');
    fireEvent.click(resetButtons[0]);

    expect(screen.getByText('Resetear Contraseña - Collector One')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument();
  });

  it('resets password successfully', async () => {
    mockResetCollectorPassword.mockResolvedValue({
      success: true,
      error: null
    });

    render(
      <CollectorTable
        collectors={mockCollectors}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Open password modal
    const resetButtons = screen.getAllByTitle('Resetear contraseña');
    fireEvent.click(resetButtons[0]);

    // Enter new password
    const passwordInput = screen.getByLabelText('Nueva Contraseña');
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

    // Submit
    fireEvent.click(screen.getByText('Actualizar Contraseña'));

    await waitFor(() => {
      expect(mockResetCollectorPassword).toHaveBeenCalledWith('1', 'newpassword123');
      expect(mockAlert).toHaveBeenCalledWith('Contraseña actualizada exitosamente');
    });
  });

  it('validates password length', async () => {
    render(
      <CollectorTable
        collectors={mockCollectors}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Open password modal
    const resetButtons = screen.getAllByTitle('Resetear contraseña');
    fireEvent.click(resetButtons[0]);

    // Enter short password
    const passwordInput = screen.getByLabelText('Nueva Contraseña');
    fireEvent.change(passwordInput, { target: { value: '123' } });

    // Submit
    fireEvent.click(screen.getByText('Actualizar Contraseña'));

    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
    });
  });
});