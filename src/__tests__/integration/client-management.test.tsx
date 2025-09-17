/**
 * Integration test for client management functionality
 * Tests the complete flow from UI interactions to database operations
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientForm from '@/components/forms/ClientForm';
import ClientTable from '@/components/tables/ClientTable';
import type { Client, CreateClientForm } from '@/lib/types';
import { it } from 'node:test';
import { describe } from 'node:test';

// Mock data
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
    }
];

describe('Client Management Integration', () => {
    describe('ClientForm and ClientTable Integration', () => {
        it('should handle complete client creation flow', async () => {
            const user = userEvent.setup();
            let clients = [...mockClients];
            const mockOnSubmit = jest.fn().mockImplementation(async (data: CreateClientForm) => {
                const newClient: Client = {
                    id: '3',
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                clients.push(newClient);
                return Promise.resolve();
            });
            const mockOnCancel = jest.fn();
            const mockOnEdit = jest.fn();
            const mockOnDelete = jest.fn();

            const { rerender } = render(
                <div>
                    <ClientForm
                        onSubmit={mockOnSubmit}
                        onCancel={mockOnCancel}
                    />
                    <ClientTable
                        clients={clients}
                        onEdit={mockOnEdit}
                        onDelete={mockOnDelete}
                    />
                </div>
            );

            // Fill out the form
            const nameInput = screen.getByLabelText(/nombre completo/i);
            const addressInput = screen.getByLabelText(/dirección/i);
            const phoneInput = screen.getByLabelText(/teléfono/i);

            await user.type(nameInput, 'Carlos López');
            await user.type(addressInput, 'Avenida 80 #15-20');
            await user.type(phoneInput, '320 999 8888');

            // Submit the form
            const submitButton = screen.getByRole('button', { name: /crear cliente/i });
            await user.click(submitButton);

            // Verify form submission
            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith({
                    name: 'Carlos López',
                    address: 'Avenida 80 #15-20',
                    phone: '320 999 8888'
                });
            });

            // Re-render with updated clients list
            rerender(
                <div>
                    <ClientForm
                        onSubmit={mockOnSubmit}
                        onCancel={mockOnCancel}
                    />
                    <ClientTable
                        clients={clients}
                        onEdit={mockOnEdit}
                        onDelete={mockOnDelete}
                    />
                </div>
            );

            // Verify the new client appears in the table
            expect(screen.getByText('Carlos López')).toBeInTheDocument();
            expect(screen.getByText('Avenida 80 #15-20')).toBeInTheDocument();
            expect(screen.getByText('320 999 8888')).toBeInTheDocument();
        });

        it('should handle client editing flow', async () => {
            const user = userEvent.setup();
            let clients = [...mockClients];
            const mockOnSubmit = jest.fn().mockImplementation(async (data: CreateClientForm) => {
                clients[0] = { ...clients[0], ...data };
                return Promise.resolve();
            });
            const mockOnCancel = jest.fn();
            const mockOnEdit = jest.fn();
            const mockOnDelete = jest.fn();

            const { rerender } = render(
                <div>
                    <ClientForm
                        client={clients[0]}
                        onSubmit={mockOnSubmit}
                        onCancel={mockOnCancel}
                    />
                    <ClientTable
                        clients={clients}
                        onEdit={mockOnEdit}
                        onDelete={mockOnDelete}
                    />
                </div>
            );

            // Verify form is pre-filled
            expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Calle 123 #45-67')).toBeInTheDocument();

            // Update the name
            const nameInput = screen.getByDisplayValue('Juan Pérez');
            await user.clear(nameInput);
            await user.type(nameInput, 'Juan Pérez Actualizado');

            // Submit the form
            const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
            await user.click(submitButton);

            // Verify form submission
            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith({
                    name: 'Juan Pérez Actualizado',
                    address: 'Calle 123 #45-67',
                    phone: '300 123 4567'
                });
            });

            // Re-render with updated clients list
            rerender(
                <div>
                    <ClientForm
                        client={clients[0]}
                        onSubmit={mockOnSubmit}
                        onCancel={mockOnCancel}
                    />
                    <ClientTable
                        clients={clients}
                        onEdit={mockOnEdit}
                        onDelete={mockOnDelete}
                    />
                </div>
            );

            // Verify the updated client appears in the table
            expect(screen.getByText('Juan Pérez Actualizado')).toBeInTheDocument();
        });

        it('should handle table interactions', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = jest.fn();
            const mockOnCancel = jest.fn();
            const mockOnEdit = jest.fn();
            const mockOnDelete = jest.fn();

            render(
                <ClientTable
                    clients={mockClients}
                    onEdit={mockOnEdit}
                    onDelete={mockOnDelete}
                />
            );

            // Test search functionality
            const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
            await user.type(searchInput, 'Juan');

            // Should show only Juan Pérez
            expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
            expect(screen.queryByText('María García')).not.toBeInTheDocument();

            // Clear search
            await user.clear(searchInput);

            // Both clients should be visible again
            expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
            expect(screen.getByText('María García')).toBeInTheDocument();

            // Test edit button
            const editButtons = screen.getAllByTitle('Editar cliente');
            await user.click(editButtons[0]);

            expect(mockOnEdit).toHaveBeenCalledWith(mockClients[0]);

            // Test delete button
            const deleteButtons = screen.getAllByTitle('Eliminar cliente');
            await user.click(deleteButtons[0]);

            expect(mockOnDelete).toHaveBeenCalledWith(mockClients[0]);
        });

        it('should handle form validation errors', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = jest.fn();
            const mockOnCancel = jest.fn();

            render(
                <ClientForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            // Try to submit empty form
            const submitButton = screen.getByRole('button', { name: /crear cliente/i });
            await user.click(submitButton);

            // Should show validation errors
            await waitFor(() => {
                expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
                expect(screen.getByText(/la dirección es requerida/i)).toBeInTheDocument();
            });

            // Form should not be submitted
            expect(mockOnSubmit).not.toHaveBeenCalled();

            // Fill in valid data
            const nameInput = screen.getByLabelText(/nombre completo/i);
            const addressInput = screen.getByLabelText(/dirección/i);

            await user.type(nameInput, 'Test Client');
            await user.type(addressInput, 'Test Address');

            // Submit again
            await user.click(submitButton);

            // Should submit successfully
            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith({
                    name: 'Test Client',
                    address: 'Test Address',
                    phone: ''
                });
            });
        });

        it('should handle loading states', () => {
            const mockOnSubmit = jest.fn();
            const mockOnCancel = jest.fn();
            const mockOnEdit = jest.fn();
            const mockOnDelete = jest.fn();

            render(
                <div>
                    <ClientForm
                        onSubmit={mockOnSubmit}
                        onCancel={mockOnCancel}
                        isLoading={true}
                    />
                    <ClientTable
                        clients={[]}
                        onEdit={mockOnEdit}
                        onDelete={mockOnDelete}
                        isLoading={true}
                    />
                </div>
            );

            // Form should be disabled
            expect(screen.getByLabelText(/nombre completo/i)).toBeDisabled();
            expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();

            // Table should show loading state
            expect(screen.getByText('Cargando...')).toBeInTheDocument();
        });
    });
});