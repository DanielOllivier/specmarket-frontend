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
    
    // Actualizar más frecuentemente para timeframes cortos
    const updateInterval = timeframe === '1m' ? 2000 : 
                          timeframe === '5m' ? 5000 : 
                          timeframe === '15m' ? 10000 : 
                          timeframe === '1h' ? 30000 : 60000

    const interval = setInterval(generateChartData, updateInterval)
    return () => clearInterval(interval)
  }, [currentPrice, timeframe])

  const generateChartData = () => {
    // Configuración por timeframe
    const config: Record<string, { points: number; interval: number; volatility: number; drift: number }> = {
      '1m': { 
        points: 60,      // Últimos 60 minutos
        interval: 60,    // 1 minuto
        volatility: 0.001, // 0.1% volatilidad
        drift: 0.0002    // Muy poco drift
      },
      '5m': { 
        points: 72,      // Últimas 6 horas (72 * 5min)
        interval: 300,   // 5 minutos
        volatility: 0.003,
        drift: 0.0005
      },
      '15m': { 
        points: 96,      // Últimas 24 horas (96 * 15min)
        interval: 900,   // 15 minutos
        volatility: 0.005,
        drift: 0.001
      },
      '1h': { 
        points: 168,     // Última semana (168 horas)
        interval: 3600,  // 1 hora
        volatility: 0.01,
        drift: 0.002
      },
      '1d': { 
        points: 90,      // Últimos 90 días
        interval: 86400, // 1 día
        volatility: 0.03,
        drift: 0.005
      },
    }

    const { points, interval, volatility, drift } = config[timeframe]
    
    const labels: string[] = []
    const prices: number[] = []
    
    const now = new Date()
    
    // Generar precios históricos con random walk
    let price = currentPrice * (1 - (drift * points / 2)) // Empezar más abajo
    
    for (let i = points; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * interval * 1000))
      
      // Formatear label según timeframe
      if (timeframe === '1d') {
        labels.push(time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      } else if (timeframe === '1h') {
        labels.push(time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      } else {
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      }
      
      // Random walk con drift hacia precio actual
      const driftTowardsCurrent = (currentPrice - price) * drift
      const randomWalk = (Math.random() - 0.5) * (currentPrice * volatility * 2)
      
      price = price + driftTowardsCurrent + randomWalk
      
      // Evitar precios negativos
      price = Math.max(price, currentPrice * 0.5)
      
      prices.push(price)
    }
    
    // Último punto es siempre el precio actual
    prices[prices.length - 1] = currentPrice
    
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
          autoSkipPadding: timeframe === '1d' ? 10 : 
                          timeframe === '1h' ? 15 : 
                          timeframe === '15m' ? 8 : 
                          timeframe === '5m' ? 6 : 5,
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

  // Timeframe labels
  const timeframeLabels: Record<string, string> = {
    '1m': 'Last 60 minutes',
    '5m': 'Last 6 hours',
    '15m': 'Last 24 hours',
    '1h': 'Last 7 days',
    '1d': 'Last 90 days',
  }

  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
      {/* Header */}
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
          <div className="text-gray-400">
            High: ${Math.max(...chartData.datasets[0].data).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className="text-gray-400">
            Low: ${Math.min(...chartData.datasets[0].data).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-gray-400 text-xs">
          Simulated data • Updates every {timeframe === '1m' ? '2s' : timeframe === '5m' ? '5s' : '10s'}
        </div>
      </div>
    </div>
  )
}
