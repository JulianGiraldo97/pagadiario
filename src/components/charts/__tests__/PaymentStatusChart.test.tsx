import { render, screen } from '@testing-library/react'
import PaymentStatusChart from '../PaymentStatusChart'
import { PaymentsByStatus } from '@/lib/supabase/reports'

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart">
      <div data-testid="chart-title">{options?.plugins?.title?.text}</div>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  )
}))

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  ArcElement: {},
  Tooltip: {},
  Legend: {}
}))

describe('PaymentStatusChart', () => {
  const mockData: PaymentsByStatus[] = [
    {
      payment_status: 'paid',
      count: 15,
      total_amount: 1500000
    },
    {
      payment_status: 'not_paid',
      count: 3,
      total_amount: 0
    },
    {
      payment_status: 'client_absent',
      count: 2,
      total_amount: 0
    }
  ]

  it('should render payment status chart with data', () => {
    render(<PaymentStatusChart data={mockData} />)
    
    expect(screen.getAllByText('Estado de Pagos')).toHaveLength(2)
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-title')).toHaveTextContent('Estado de Pagos')
  })

  it('should render chart with empty data', () => {
    render(<PaymentStatusChart data={[]} />)
    
    expect(screen.getAllByText('Estado de Pagos')).toHaveLength(2)
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
  })

  it('should format chart data with correct labels and colors', () => {
    render(<PaymentStatusChart data={mockData} />)
    
    const chartData = screen.getByTestId('chart-data')
    const parsedData = JSON.parse(chartData.textContent || '{}')
    
    expect(parsedData.labels).toEqual(['Pagado', 'No Pagado', 'Cliente Ausente'])
    expect(parsedData.datasets[0].data).toEqual([15, 3, 2])
    expect(parsedData.datasets[0].backgroundColor).toEqual(['#28a745', '#dc3545', '#ffc107'])
  })
})