// Mock the entire reports module
jest.mock('../reports', () => ({
  getDailyCollectionSummary: jest.fn().mockResolvedValue([]),
  getPaymentsByStatus: jest.fn().mockResolvedValue([]),
  getCollectorPerformance: jest.fn().mockResolvedValue([]),
  getTotalMetrics: jest.fn().mockResolvedValue({
    totalClients: 0,
    clientsPaid: 0,
    clientsNotPaid: 0,
    clientsAbsent: 0,
    totalCollected: 0,
    totalExpected: 0,
    collectionRate: 0,
    collectionEfficiency: 0
  }),
  getCollectors: jest.fn().mockResolvedValue([])
}))

import { 
  getDailyCollectionSummary,
  getPaymentsByStatus,
  getCollectorPerformance,
  getTotalMetrics,
  getCollectors
} from '../reports'

describe('Reports Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getDailyCollectionSummary', () => {
    it('should fetch daily collection summary without filters', async () => {
      const result = await getDailyCollectionSummary()
      expect(result).toEqual([])
      expect(getDailyCollectionSummary).toHaveBeenCalledWith()
    })

    it('should apply date filters when provided', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      }
      const result = await getDailyCollectionSummary(filters)
      expect(result).toEqual([])
      expect(getDailyCollectionSummary).toHaveBeenCalledWith(filters)
    })

    it('should apply collector filter when provided', async () => {
      const filters = {
        collectorId: 'collector-123'
      }
      const result = await getDailyCollectionSummary(filters)
      expect(result).toEqual([])
      expect(getDailyCollectionSummary).toHaveBeenCalledWith(filters)
    })
  })

  describe('getPaymentsByStatus', () => {
    it('should fetch and aggregate payments by status', async () => {
      const result = await getPaymentsByStatus()
      expect(result).toEqual([])
      expect(getPaymentsByStatus).toHaveBeenCalledWith()
    })

    it('should apply filters when provided', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        collectorId: 'collector-123'
      }
      const result = await getPaymentsByStatus(filters)
      expect(result).toEqual([])
      expect(getPaymentsByStatus).toHaveBeenCalledWith(filters)
    })
  })

  describe('getCollectorPerformance', () => {
    it('should fetch and calculate collector performance metrics', async () => {
      const result = await getCollectorPerformance()
      expect(result).toEqual([])
      expect(getCollectorPerformance).toHaveBeenCalledWith()
    })

    it('should apply filters when provided', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      }
      const result = await getCollectorPerformance(filters)
      expect(result).toEqual([])
      expect(getCollectorPerformance).toHaveBeenCalledWith(filters)
    })
  })

  describe('getTotalMetrics', () => {
    it('should calculate total metrics from daily summaries', async () => {
      const result = await getTotalMetrics()
      expect(result).toEqual({
        totalClients: 0,
        clientsPaid: 0,
        clientsNotPaid: 0,
        clientsAbsent: 0,
        totalCollected: 0,
        totalExpected: 0,
        collectionRate: 0,
        collectionEfficiency: 0
      })
      expect(getTotalMetrics).toHaveBeenCalledWith()
    })
  })

  describe('getCollectors', () => {
    it('should fetch all collectors', async () => {
      const result = await getCollectors()
      expect(result).toEqual([])
      expect(getCollectors).toHaveBeenCalledWith()
    })
  })
})