import { 
  getAllCollectors, 
  getCollectorById, 
  createCollector, 
  updateCollector, 
  deleteCollector,
  resetCollectorPassword
} from '../collectors';
import { supabase } from '../client';

// Mock the Supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      admin: {
        createUser: jest.fn(),
        updateUserById: jest.fn(),
        deleteUser: jest.fn()
      }
    }
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Collectors Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCollectors', () => {
    it('should return collectors successfully', async () => {
      const mockCollectors = [
        { id: '1', full_name: 'Collector 1', email: 'c1@test.com', role: 'collector' },
        { id: '2', full_name: 'Collector 2', email: 'c2@test.com', role: 'collector' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockCollectors,
              error: null
            })
          })
        })
      } as any);

      const result = await getAllCollectors();

      expect(result.data).toEqual(mockCollectors);
      expect(result.error).toBeNull();
    });

    it('should handle database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      } as any);

      const result = await getAllCollectors();

      expect(result.data).toEqual([]);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getCollectorById', () => {
    it('should return collector by id', async () => {
      const mockCollector = { 
        id: '1', 
        full_name: 'Collector 1', 
        email: 'c1@test.com', 
        role: 'collector' 
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockCollector,
                error: null
              })
            })
          })
        })
      } as any);

      const result = await getCollectorById('1');

      expect(result.data).toEqual(mockCollector);
      expect(result.error).toBeNull();
    });

    it('should handle not found error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' }
              })
            })
          })
        })
      } as any);

      const result = await getCollectorById('999');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Not found');
    });
  });

  describe('createCollector', () => {
    it('should create collector successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockAuthUser = { user: mockUser };
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Test Collector',
        role: 'collector'
      };

      // Mock auth.getUser
      mockSupabase.auth.getUser.mockResolvedValue({
        data: mockAuthUser,
        error: null
      } as any);

      // Mock existing user check (no existing user)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      } as any);

      // Mock auth user creation
      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: mockAuthUser,
        error: null
      } as any);

      // Mock profile creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      } as any);

      const result = await createCollector({
        email: 'test@example.com',
        full_name: 'Test Collector',
        password: 'password123'
      });

      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
    });

    it('should handle existing email error', async () => {
      const mockUser = { id: 'user-1' };
      const mockAuthUser = { user: mockUser };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: mockAuthUser,
        error: null
      } as any);

      // Mock existing user found
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'existing-user' },
              error: null
            })
          })
        })
      } as any);

      const result = await createCollector({
        email: 'existing@example.com',
        full_name: 'Test Collector',
        password: 'password123'
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('Ya existe un usuario con este email');
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      } as any);

      const result = await createCollector({
        email: 'test@example.com',
        full_name: 'Test Collector',
        password: 'password123'
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('Usuario no autenticado');
    });
  });

  describe('deleteCollector', () => {
    it('should delete collector successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockAuthUser = { user: mockUser };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: mockAuthUser,
        error: null
      } as any);

      // Mock no active routes
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      } as any);

      // Mock profile deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null
            })
          })
        })
      } as any);

      // Mock auth user deletion
      mockSupabase.auth.admin.deleteUser.mockResolvedValue({
        error: null
      } as any);

      const result = await deleteCollector('collector-1');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should prevent deletion of collector with active routes', async () => {
      const mockUser = { id: 'user-1' };
      const mockAuthUser = { user: mockUser };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: mockAuthUser,
        error: null
      } as any);

      // Mock active routes found
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{ id: 'route-1' }],
                error: null
              })
            })
          })
        })
      } as any);

      const result = await deleteCollector('collector-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No se puede eliminar un cobrador con rutas activas');
    });
  });

  describe('resetCollectorPassword', () => {
    it('should reset password successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockAuthUser = { user: mockUser };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: mockAuthUser,
        error: null
      } as any);

      mockSupabase.auth.admin.updateUserById.mockResolvedValue({
        error: null
      } as any);

      const result = await resetCollectorPassword('collector-1', 'newpassword123');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('collector-1', {
        password: 'newpassword123'
      });
    });

    it('should handle auth error', async () => {
      const mockUser = { id: 'user-1' };
      const mockAuthUser = { user: mockUser };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: mockAuthUser,
        error: null
      } as any);

      mockSupabase.auth.admin.updateUserById.mockResolvedValue({
        error: { message: 'Auth error' }
      } as any);

      const result = await resetCollectorPassword('collector-1', 'newpassword123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auth error');
    });
  });
});