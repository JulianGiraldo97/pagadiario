'use client'

import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { PaymentsByStatus } from '@/lib/supabase/reports'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PaymentStatusChartProps {
  data: PaymentsByStatus[]
}

export default function PaymentStatusChart({ data }: PaymentStatusChartProps) {
  const statusLabels = {
    paid: 'Pagado',
    not_paid: 'No Pagado',
    client_absent: 'Cliente Ausente'
  }

  const statusColors = {
    paid: '#28a745',
    not_paid: '#dc3545',
    client_absent: '#ffc107'
  }

  const chartData = {
    labels: data.map(item => statusLabels[item.payment_status as keyof typeof statusLabels] || item.payment_status),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => statusColors[item.payment_status as keyof typeof statusColors] || '#6c757d'),
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Estado de Pagos'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = data.reduce((sum, item) => sum + item.count, 0)
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0'
            return `${context.label}: ${context.parsed} (${percentage}%)`
          }
        }
      }
    },
    maintainAspectRatio: false
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Estado de Pagos</h5>
      </div>
      <div className="card-body">
        <div style={{ height: '300px' }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </div>
    </div>
  )
}