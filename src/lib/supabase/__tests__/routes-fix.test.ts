import { getCollectorDailyRoute, getCollectorRouteProgress } from '../routes'

// Mock Supabase client
jest.mock('../client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}))

describe('Routes Fix Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCollectorDailyRoute', () => {
    it('should handle empty routes without error', async () => {
      const result = await getCollectorDailyRoute('2025-09-18')
      
      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })

    it('should handle date parameter correctly', async () => {
      const result = await getCollectorDailyRoute()
      
      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })
  })

  describe('getCollectorRouteProgress', () => {
    it('should handle empty routes without error', async () => {
      const result = await getCollectorRouteProgress('2025-09-18')
      
      expect(result.error).toBeNull()
      expect(result.data).toEqual({
        total: 0,
        visited: 0,
        paid: 0,
        notPaid: 0,
        absent: 0,
        totalCollected: 0,
        totalExpected: 0
      })
    })

    it('should handle date parameter correctly', async () => {
      const result = await getCollectorRouteProgress()
      
      expect(result.error).toBeNull()
      expect(result.data).toEqual({
        total: 0,
        visited: 0,
        paid: 0,
        notPaid: 0,
        absent: 0,
        totalCollected: 0,
        totalExpected: 0
      })
    })
  })
})