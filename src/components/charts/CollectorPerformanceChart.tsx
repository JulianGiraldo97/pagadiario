'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { CollectorPerformance } from '@/lib/supabase/reports'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface CollectorPerformanceChartProps {
  data: CollectorPerformance[]
}

export default function CollectorPerformanceChart({ data }: CollectorPerformanceChartProps) {
  const chartData = {
    labels: data.map(item => item.collector_name),
    datasets: [
      {
        label: 'Tasa de Cobro (%)',
        data: data.map(item => item.collection_rate),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        label: 'Total Recaudado',
        data: data.map(item => item.total_collected),
        backgroundColor: 'rgba(255, 206, 86, 0.8)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
        yAxisID: 'y1'
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Rendimiento por Cobrador'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
            } else {
              return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
            }
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Cobradores'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Tasa de Cobro (%)'
        },
        max: 100
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Total Recaudado ($)'
        },
        grid: {
          drawOnChartArea: false,
        },
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
        <h5 className="mb-0">Rendimiento por Cobrador</h5>
      </div>
      <div className="card-body">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}