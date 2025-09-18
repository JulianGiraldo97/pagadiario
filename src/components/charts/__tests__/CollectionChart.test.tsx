import { render, screen } from '@testing-library/react'
import CollectionChart from '../CollectionChart'
import { DailyCollectionSummary } from '@/lib/supabase/reports'

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-title">{options?.plugins?.title?.text}</div>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  )
}))

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {}
}))

describe('CollectionChart', () => {
  const mockData: DailyCollectionSummary[] = [
    {
      route_date: '2024-01-01',
      collector_id: 'collector-1',
      collector_name: 'Juan Pérez',
      total_clients: 10,
      clients_paid: 8,
      clients_not_paid: 1,
      clients_absent: 1,
      total_collected: 800000,
      total_expected: 1000000
    },
    {
      route_date: '2024-01-02',
      collector_id: 'collector-1',
      collector_name: 'Juan Pérez',
      total_clients: 12,
      clients_paid: 10,
      clients_not_paid: 2,
      clients_absent: 0,
      total_collected: 1200000,
      total_expected: 1200000
    }
  ]

  it('should render collection chart with data', () => {
    render(<CollectionChart data={mockData} />)
    
    expect(screen.getByText('Gráfico de Recaudación')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-title')).toHaveTextContent('Evolución de Recaudación')
  })

  it('should render chart with empty data', () => {
    render(<CollectionChart data={[]} />)
    
    expect(screen.getByText('Gráfico de Recaudación')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('should format chart data correctly', () => {
    render(<CollectionChart data={mockData} />)
    
    const chartData = screen.getByTestId('chart-data')
    const parsedData = JSON.parse(chartData.textContent || '{}')
    
    expect(parsedData.labels).toHaveLength(2)
    expect(parsedData.datasets).toHaveLength(2)
    expect(parsedData.datasets[0].label).toBe('Total Recaudado')
    expect(parsedData.datasets[1].label).toBe('Total Esperado')
  })
})