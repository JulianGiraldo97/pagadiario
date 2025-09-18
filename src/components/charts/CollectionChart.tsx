'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { DailyCollectionSummary } from '@/lib/supabase/reports'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface CollectionChartProps {
  data: DailyCollectionSummary[]
}

export default function CollectionChart({ data }: CollectionChartProps) {
  const chartData = {
    labels: data.map(item => new Date(item.route_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Recaudado',
        data: data.map(item => item.total_collected),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Total Esperado',
        data: data.map(item => item.total_expected),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolución de Recaudación'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString()
          }
        }
      }
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Gráfico de Recaudación</h5>
      </div>
      <div className="card-body">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}