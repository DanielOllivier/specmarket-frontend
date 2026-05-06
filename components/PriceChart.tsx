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
  const [historicalPrices, setHistoricalPrices] = useState<number[]>([])

  useEffect(() => {
    // Inicializar precios históricos solo una vez
    if (historicalPrices.length === 0) {
      generateInitialHistory()
    }
  }, [])

  useEffect(() => {
    if (historicalPrices.length > 0) {
      generateChartData()
    }
  }, [currentPrice, timeframe, historicalPrices])

  const generateInitialHistory = () => {
    // Generar historia realista basada en el precio actual
    const history: number[] = []
    let price = currentPrice * 0.98 // Empezar 2% abajo
    
    const volatility = currentPrice * 0.002 // 0.2% de volatilidad por punto
    
    for (let i = 0; i < 50; i++) {
      // Caminar aleatoriamente hacia el precio actual
      const drift = (currentPrice - price) * 0.02 // Drift hacia precio actual
      const randomWalk = (Math.random() - 0.5) * volatility
      
      price = price + drift + randomWalk
      history.push(price)
    }
    
    // Añadir precio actual al final
    history.push(currentPrice)
    
    setHistoricalPrices(history)
  }

  const generateChartData = () => {
    const intervals: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '1d': 86400,
    }
    
    const interval = intervals[timeframe]
    const numPoints = Math.min(50, historicalPrices.length)
    
    const labels: string[] = []
    const prices: number[] = []
    
    const now = new Date()
    
    // Usar los últimos N puntos de la historia
    const startIndex = Math.max(0, historicalPrices.length - numPoints)
    const dataPoints = historicalPrices.slice(startIndex)
    
    for (let i = 0; i < dataPoints.length; i++) {
      const time = new Date(now.getTime() - ((dataPoints.length - i) * interval * 1000))
      
      if (timeframe === '1d') {
        labels.push(time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      } else if (timeframe === '1h') {
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      } else {
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      }
      
      prices.push(dataPoints[i])
    }
    
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

  // Actualizar precio actual suavemente
  useEffect(() => {
    const interval = setInterval(() => {
      setHistoricalPrices(prev => {
        if (prev.length === 0) return prev
        
        const lastPrice = prev[prev.length - 1]
        const priceDiff = currentPrice - lastPrice
        
        // Si la diferencia es pequeña, solo ajustar suavemente
        if (Math.abs(priceDiff) < currentPrice * 0.001) {
          return prev // No cambiar si es menos del 0.1%
        }
        
        // Movimiento suave hacia el nuevo precio
        const newPrice = lastPrice + (priceDiff * 0.3) + ((Math.random() - 0.5) * currentPrice * 0.001)
        
        // Mantener solo últimos 100 puntos
        const updated = [...prev.slice(-99), newPrice]
        return updated
      })
    }, 3000) // Actualizar cada 3 segundos

    return () => clearInterval(interval)
  }, [currentPrice])

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

  if (!chartData) {
    return (
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 h-[500px] flex items-center justify-center">
        <div className="text-white">Loading chart...</div>
      </div>
    )
  }

  // Calcular cambio desde el primer punto visible
  const firstPrice = chartData.datasets[0].data[0]
  const lastPrice = chartData.datasets[0].data[chartData.datasets[0].data.length - 1]
  const priceChange = lastPrice - firstPrice
  const priceChangePercent = (priceChange / firstPrice) * 100

  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{marketName}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-gray-400 text-sm">Price Chart</span>
            <span className={`text-sm font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
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
            <span className="text-gray-400">Current: ${currentPrice.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-gray-400">
          Updates smoothly based on market price
        </div>
      </div>
    </div>
  )
}
