import { getClients, createClient, updateClient, deleteClient, getClient } from '../clients';
import { supabase } from '../client';
import type { CreateClientForm } from '@/lib/types';

// Mock Supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Client Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClients', () => {
    it('fetches all clients successfully', async () => {
      const mockClients = [
        { id: '1', name: 'Juan Pérez', address: 'Calle 123', created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '2', name: 'María García', address: 'Carrera 50', created_at: '2024-01-02', updated_at: '2024-01-02' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockClients, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await getClients();

      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('name');
      expect(result).toEqual({ data: mockClients, error: null });
    });

    it('handles search term correctly', async () => {
      const mockClients = [
        { id: '1', name: 'Juan Pérez', address: 'Calle 123', created_at: '2024-01-01', updated_at: '2024-01-01' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: mockClients, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await getClients('Juan');

      expect(mockQuery.or).toHaveBeenCalledWith('name.ilike.%Juan%,address.ilike.%Juan%,phone.ilike.%Juan%');
      expect(result).toEqual({ data: mockClients, error: null });
    });

    it('handles database errors', async () => {
      const mockError = { message: 'Database error' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await getClients();

      expect(result).toEqual({ data: null, error: 'Database error' });
    });
  });

  describe('createClient', () => {
    const mockClientData: CreateClientForm = {
      name: 'Test Client',
      address: 'Test Address',
      phone: '123456789'
    };

    it('creates client successfully', async () => {
      const mockUser = { id: 'user-123' };
      const mockCreatedClient = { id: '1', ...mockClientData, created_by: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null } as any);

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatedClient, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await createClient(mockClientData);

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        ...mockClientData,
        created_by: 'user-123'
      });
      expect(result).toEqual({ data: mockCreatedClient, error: null });
    });

    it('handles unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const result = await createClient(mockClientData);

      expect(result).toEqual({ data: null, error: 'Usuario no autenticado' });
    });

    it('handles database errors', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = { message: 'Insert failed' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null } as any);

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await createClient(mockClientData);

      expect(result).toEqual({ data: null, error: 'Insert failed' });
    });
  });

  describe('updateClient', () => {
    const mockUpdateData = { name: 'Updated Name' };

    it('updates client successfully', async () => {
      const mockUpdatedClient = { id: '1', name: 'Updated Name', address: 'Test Address' };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdatedClient, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await updateClient('1', mockUpdateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockQuery.update).toHaveBeenCalledWith({
        ...mockUpdateData,
        updated_at: expect.any(String)
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual({ data: mockUpdatedClient, error: null });
    });

    it('handles database errors', async () => {
      const mockError = { message: 'Update failed' };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await updateClient('1', mockUpdateData);

      expect(result).toEqual({ data: null, error: 'Update failed' });
    });
  });

  describe('deleteClient', () => {
    it('deletes client successfully when no debts exist', async () => {
      // Mock debt check - no debts found
      const mockDebtQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      // Mock delete operation
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockDebtQuery as any) // First call for debt check
        .mockReturnValueOnce(mockDeleteQuery as any); // Second call for delete

      const result = await deleteClient('1');

      expect(mockSupabase.from).toHaveBeenCalledWith('debts');
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(result).toEqual({ success: true, error: null });
    });

    it('prevents deletion when client has debts', async () => {
      // Mock debt check - debts found
      const mockDebtQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'debt-1' }], error: null })
      };

      mockSupabase.from.mockReturnValue(mockDebtQuery as any);

      const result = await deleteClient('1');

      expect(result).toEqual({ 
        success: false, 
        error: 'No se puede eliminar el cliente porque tiene deudas asociadas' 
      });
    });

    it('handles database errors during debt check', async () => {
      const mockError = { message: 'Database error' };
      const mockDebtQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };

      mockSupabase.from.mockReturnValue(mockDebtQuery as any);

      const result = await deleteClient('1');

      expect(result).toEqual({ success: false, error: 'Database error' });
    });
  });

  describe('getClient', () => {
    it('fetches single client successfully', async () => {
      const mockClient = { id: '1', name: 'Juan Pérez', address: 'Calle 123' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockClient, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await getClient('1');

      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual({ data: mockClient, error: null });
    });

    it('handles not found error', async () => {
      const mockError = { message: 'Not found' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await getClient('1');

      expect(result).toEqual({ data: null, error: 'Not found' });
    });
  });
});