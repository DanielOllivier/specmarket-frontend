'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

interface PriceChartProps {
  marketName: string
  currentPrice: number
}

export function PriceChart({ marketName, currentPrice }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('5m')
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    generateChartData()
  }, [currentPrice, timeframe])

  const generateChartData = () => {
    const intervals: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '1d': 86400,
    }
    
    const interval = intervals[timeframe]
    const numPoints = 50
    
    const labels: string[] = []
    const prices: number[] = []
    
    let price = currentPrice * 0.95
    const now = new Date()
    
    for (let i = numPoints; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * interval * 1000))
      
      if (timeframe === '1d') {
        labels.push(time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      } else if (timeframe === '1h') {
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      } else {
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      }
      
      const change = (Math.random() - 0.48) * (currentPrice * 0.01)
      price += change
      prices.push(price)
    }
    
    // Add current price
    labels.push('Now')
    prices.push(currentPrice)
    
    setChartData({
      labels,
      datasets: [
        {
          label: 'Price',
          data: prices,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    })
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(168, 85, 247, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `Price: $${context.parsed.y.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          maxRotation: 0,
          autoSkipPadding: 20,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return '$' + value.toLocaleString()
          }
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      generateChartData()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentPrice, timeframe])

  if (!chartData) {
    return (
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 h-[500px] flex items-center justify-center">
        <div className="text-white">Loading chart...</div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{marketName}</h3>
          <p className="text-gray-400 text-sm">Price Chart</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {(['1m', '5m', '15m', '1h', '1d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm font-semibold transition whitespace-nowrap ${
                timeframe === tf
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        <Line data={chartData} options={options} />
      </div>

      {/* Info */}
      <div className="mt-4 flex flex-col md:flex-row justify-between gap-2 text-sm">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span className="text-gray-400">Price Movement</span>
          </div>
        </div>
        <div className="text-gray-400">
          Updates every 5 seconds • {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
