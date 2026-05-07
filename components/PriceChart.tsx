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

interface PricePoint {
  price: number
  timestamp: number
}

export function PriceChart({ marketName, currentPrice }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('5m')
  const [chartData, setChartData] = useState<any>(null)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const isInitialized = useRef(false)
  const storageKey = `chart_${marketName}_history`

  // Cargar historia del localStorage o inicializar
  useEffect(() => {
    if (!isInitialized.current) {
      const saved = localStorage.getItem(storageKey)
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Limpiar datos muy viejos (más de 7 días)
          const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
          const filtered = parsed.filter((p: PricePoint) => p.timestamp > weekAgo)
          setPriceHistory(filtered.length > 0 ? filtered : [])
        } catch (e) {
          console.error('Error loading history:', e)
        }
      }
      
      if (priceHistory.length === 0) {
        initializePriceHistory()
      }
      
      isInitialized.current = true
    }
  }, [])

  // Guardar historia en localStorage
  useEffect(() => {
    if (priceHistory.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(priceHistory.slice(-1000)))
    }
  }, [priceHistory])

  // Actualizar gráfico cuando cambia
  useEffect(() => {
    if (priceHistory.length > 0) {
      updateChart()
    }
  }, [priceHistory, timeframe])

  // Agregar nuevo punto cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceHistory(prev => {
        if (prev.length === 0) return prev
        
        const lastPoint = prev[prev.length - 1]
        const timeSinceLastPoint = Date.now() - lastPoint.timestamp
        
        // Solo agregar si han pasado al menos 10 segundos
        if (timeSinceLastPoint < 10000) return prev
        
        // Pequeña variación aleatoria (+/- 0.5%)
        const variation = (Math.random() - 0.5) * currentPrice * 0.01
        const newPrice = currentPrice + variation
        
        const newPoint: PricePoint = {
          price: newPrice,
          timestamp: Date.now()
        }
        
        // Mantener últimos 1000 puntos
        return [...prev.slice(-999), newPoint]
      })
    }, 10000) // Cada 10 segundos

    return () => clearInterval(interval)
  }, [currentPrice])

  const initializePriceHistory = () => {
    const now = Date.now()
    const history: PricePoint[] = []
    
    // Generar últimas 24 horas de datos (un punto cada 2 minutos = 720 puntos)
    let price = currentPrice
    
    for (let i = 720; i >= 0; i--) {
      const timestamp = now - (i * 2 * 60 * 1000) // Cada 2 minutos
      const noise = (Math.random() - 0.5) * currentPrice * 0.005
      price = Math.max(price + noise, currentPrice * 0.8)
      
      history.push({ price, timestamp })
    }
    
    setPriceHistory(history)
  }

  const updateChart = () => {
    const config: Record<string, { intervalMs: number; label: string }> = {
      '1m': { intervalMs: 60 * 1000, label: 'Last hour' },
      '5m': { intervalMs: 5 * 60 * 1000, label: 'Last 6 hours' },
      '15m': { intervalMs: 15 * 60 * 1000, label: 'Last 24 hours' },
      '1h': { intervalMs: 60 * 60 * 1000, label: 'Last week' },
      '1d': { intervalMs: 24 * 60 * 60 * 1000, label: 'Last 90 days' },
    }

    const { intervalMs } = config[timeframe]
    const now = Date.now()
    
    // Filtrar puntos del timeframe seleccionado
    let rangeMs: number
    switch(timeframe) {
      case '1m': rangeMs = 60 * 60 * 1000; break // 1 hora
      case '5m': rangeMs = 6 * 60 * 60 * 1000; break // 6 horas
      case '15m': rangeMs = 24 * 60 * 60 * 1000; break // 24 horas
      case '1h': rangeMs = 7 * 24 * 60 * 60 * 1000; break // 7 días
      case '1d': rangeMs = 90 * 24 * 60 * 60 * 1000; break // 90 días
      default: rangeMs = 6 * 60 * 60 * 1000;
    }
    
    const cutoff = now - rangeMs
    const filteredData = priceHistory.filter(p => p.timestamp >= cutoff)
    
    // Agrupar por intervalos
    const buckets: Map<number, number[]> = new Map()
    
    filteredData.forEach(point => {
      const bucketTime = Math.floor(point.timestamp / intervalMs) * intervalMs
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, [])
      }
      buckets.get(bucketTime)!.push(point.price)
    })
    
    // Convertir a arrays para el gráfico
    const labels: string[] = []
    const prices: number[] = []
    
    const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0])
    
    sortedBuckets.forEach(([timestamp, priceArray]) => {
      const date = new Date(timestamp)
      
      if (timeframe === '1d') {
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      } else if (timeframe === '1h') {
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }))
      } else {
        labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      }
      
      // Usar promedio del bucket
      const avg = priceArray.reduce((a, b) => a + b, 0) / priceArray.length
      prices.push(avg)
    })

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
      legend: { display: false },
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
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: {
          color: '#9ca3af',
          maxRotation: 0,
          autoSkipPadding: 20,
        },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return '$' + value.toLocaleString()
          }
        },
      },
    },
  }

  if (!chartData || chartData.datasets[0].data.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 h-[500px] flex items-center justify-center">
        <div className="text-white">Generating chart data...</div>
      </div>
    )
  }

  const firstPrice = chartData.datasets[0].data[0]
  const lastPrice = chartData.datasets[0].data[chartData.datasets[0].data.length - 1]
  const priceChange = lastPrice - firstPrice
  const priceChangePercent = (priceChange / firstPrice) * 100

  const timeframeLabels: Record<string, string> = {
    '1m': 'Last hour',
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
            <span className="text-gray-400">Base: ${currentPrice.toLocaleString()}</span>
          </div>
          {chartData.datasets[0].data.length > 0 && (
            <>
              <div className="text-gray-400">
                High: ${Math.max(...chartData.datasets[0].data).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-gray-400">
                Low: ${Math.min(...chartData.datasets[0].data).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </>
          )}
        </div>
        <div className="text-gray-400 text-xs">
          Updates every 10s • {priceHistory.length} data points
        </div>
      </div>
    </div>
  )
}
