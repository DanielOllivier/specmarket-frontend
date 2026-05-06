'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [priceHistory, setPriceHistory] = useState<number[]>([])
  const isInitialized = useRef(false)

  // Inicializar historia solo una vez
  useEffect(() => {
    if (!isInitialized.current) {
      initializePriceHistory()
      isInitialized.current = true
    }
  }, [])

  // Actualizar gráfico cuando cambia el precio o timeframe
  useEffect(() => {
    if (priceHistory.length > 0) {
      updateChart()
    }
  }, [priceHistory, timeframe])

  // Actualizar precio actual suavemente
  useEffect(() => {
    if (priceHistory.length === 0) return

    const interval = setInterval(() => {
      setPriceHistory(prev => {
        const lastPrice = prev[prev.length - 1]
        const diff = currentPrice - lastPrice
        
        // Si el cambio es muy pequeño, no actualizar
        if (Math.abs(diff) < currentPrice * 0.0001) {
          return prev
        }
        
        // Movimiento suave hacia el nuevo precio (10% del camino)
        const newPrice = lastPrice + (diff * 0.1)
        
        // Mantener últimos 500 puntos
        return [...prev.slice(-499), newPrice]
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [currentPrice])

  const initializePriceHistory = () => {
    // Generar 200 puntos de historia inicial
    const history: number[] = []
    let price = currentPrice * 0.98
    
    for (let i = 0; i < 200; i++) {
      const drift = (currentPrice - price) * 0.01
      const noise = (Math.random() - 0.5) * currentPrice * 0.002
      price = Math.max(price + drift + noise, currentPrice * 0.5)
      history.push(price)
    }
    
    history.push(currentPrice)
    setPriceHistory(history)
  }

  const updateChart = () => {
    const config: Record<string, { points: number; interval: number; label: string }> = {
      '1m': { points: 60, interval: 60, label: 'Last hour' },
      '5m': { points: 72, interval: 300, label: 'Last 6 hours' },
      '15m': { points: 96, interval: 900, label: 'Last 24 hours' },
      '1h': { points: 168, interval: 3600, label: 'Last week' },
      '1d': { points: 90, interval: 86400, label: 'Last 90 days' },
    }

    const { points, interval } = config[timeframe]
    
    // Usar los últimos N puntos de la historia
    const dataPoints = priceHistory.slice(-points)
    
    const labels: string[] = []
    const now = new Date()
    
    dataPoints.forEach((_, i) => {
      const time = new Date(now.getTime() - ((dataPoints.length - i - 1) * interval * 1000))
      
      if (timeframe === '1d') {
        labels.push(time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      } else if (timeframe === '1h') {
        labels.push(time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      } else {
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      }
    })

    setChartData({
      labels,
      datasets: [
        {
          label: 'Price',
          data: dataPoints,
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
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
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

  if (!chartData) {
    return (
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 h-[500px] flex items-center justify-center">
        <div className="text-white">Loading chart...</div>
      </div>
    )
  }

  const firstPrice = chartData.datasets[0].data[0]
  const lastPrice = chartData.datasets[0].data[chartData.datasets[0].data.length - 1]
  const priceChange = lastPrice - firstPrice
  const priceChangePercent = (priceChange / firstPrice) * 100

  const timeframeLabels: Record<string, string> = {
    '1m': 'Last 60 minutes',
    '5m': 'Last 6 hours',
    '15m': 'Last 24 hours',
    '1h': 'Last 7 days',
    '1d': 'Last 90 days',
  }

  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{marketName}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-gray-400 text-sm">{timeframeLabels[timeframe]}</span>
            <span className={`text-sm font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>

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

      <div className="h-[400px]">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-4 flex flex-col md:flex-row justify-between gap-2 text-sm">
        <div className="flex gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span className="text-gray-400">Current: ${currentPrice.toLocaleString()}</span>
          </div>
          <div className="text-gray-400">
            High: ${Math.max(...chartData.datasets[0].data).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className="text-gray-400">
            Low: ${Math.min(...chartData.datasets[0].data).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-gray-400 text-xs">
          Live price tracking
        </div>
      </div>
    </div>
  )
}
