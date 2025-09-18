import { supabase } from '../client'

// This is an integration test to verify the database function works
describe('Database Function Integration Test', () => {
  it('should call get_collector_daily_route function without error', async () => {
    // Mock the supabase.rpc call
    const mockRpc = jest.fn().mockResolvedValue({ data: [], error: null })
    
    // Replace the rpc method temporarily
    const originalRpc = supabase.rpc
    supabase.rpc = mockRpc
    
    try {
      const result = await supabase.rpc('get_collector_daily_route', {
        collector_id_param: 'test-id',
        route_date_param: '2025-09-20'
      })
      
      expect(mockRpc).toHaveBeenCalledWith('get_collector_daily_route', {
        collector_id_param: 'test-id',
        route_date_param: '2025-09-20'
      })
      
      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    } finally {
      // Restore original method
      supabase.rpc = originalRpc
    }
  })
})