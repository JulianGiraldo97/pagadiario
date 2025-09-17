import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientTable from '../ClientTable';
import type { Client } from '@/lib/types';

// Mock client data
const mockClients: Client[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    address: 'Calle 123 #45-67',
    phone: '300 123 4567',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'María García',
    address: 'Carrera 50 #25-30',
    phone: '310 555 1234',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    name: 'Carlos López',
    address: 'Avenida 80 #15-20',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  }
];

describe('ClientTable', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders clients table correctly', () => {
    render(
      <ClientTable
        clients={mockClients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Lista de Clientes (3)')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('displays phone numbers correctly', () => {
    render(
      <ClientTable
        clients={mockClients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('300 123 4567')).toBeInTheDocument();
    expect(screen.getByText('310 555 1234')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument(); // For Carlos López who has no phone
  });

  it('shows empty state when no clients', () => {
    render(
      <ClientTable
        clients={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <ClientTable
        clients={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isLoading={true}
      />
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('filters clients by search term', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientTable
        clients={mockClients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(searchInput, 'Juan');

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.queryByText('María García')).not.toBeInTheDocument();
    expect(screen.queryByText('Carlos López')).not.toBeInTheDocument();
  });

  it('filters clients by address', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientTable
        clients={mockClients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(searchInput, 'Carrera');

    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.queryByText('Carlos López')).not.toBeInTheDocument();
  });

  it('shows no results message when search has no matches', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientTable
        clients={mockClients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(searchInput, 'NoExiste');

    expect(screen.getByText('No se encontraron clientes que coincidan con la búsqueda')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientTable
        clients={mockClients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByTitle('Editar cliente');
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockClients[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientTable
        clients={mockClients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByTitle('Eliminar cliente');
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockClients[0]);
  });

  it('handles pagination correctly', () => {
    // Create more clients to test pagination
    const manyClients = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Cliente ${i + 1}`,
      address: `Dirección ${i + 1}`,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }));

    render(
      <ClientTable
        clients={manyClients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Should show pagination controls
    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
    
    // Should show page numbers
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Should show pagination info
    expect(screen.getByText(/Mostrando 1 a 10 de 25 clientes/)).toBeInTheDocument();
  });

  it('navigates to next page', async () => {
    const user = userEvent.setup();
    
    // Create more clients to test pagination
    const manyClients = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Cliente ${i + 1}`,
      address: `Dirección ${i + 1}`,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }));

    render(
      <ClientTable
        clients={manyClients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const nextButton = screen.getByText('Siguiente');
    await user.click(nextButton);

    // Should show different pagination info
    expect(screen.getByText(/Mostrando 11 a 15 de 15 clientes/)).toBeInTheDocument();
  });

  it('resets to first page when search changes', async () => {
    const user = userEvent.setup();
    
    // Create more clients to test pagination
    const manyClients = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Cliente ${i + 1}`,
      address: `Dirección ${i + 1}`,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }));

    render(
      <ClientTable
        clients={manyClients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Go to second page
    const nextButton = screen.getByText('Siguiente');
    await user.click(nextButton);

    // Now search for something
    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(searchInput, 'Cliente 1');

    // Should be back on first page and show filtered results
    // Since there are only 7 results, no pagination footer should be shown
    expect(screen.getByText('Lista de Clientes (7)')).toBeInTheDocument();
  });
});