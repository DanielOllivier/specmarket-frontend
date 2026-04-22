import { useEffect, useState, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { MARKETS, PROGRAM_ID } from '@/lib/constants'
import { getUserPosition } from '@/lib/trading'
import * as anchor from '@coral-xyz/anchor'

interface PositionAlert {
  type: 'liquidation' | 'profit' | 'loss' | 'price_change'
  marketName: string
  message: string
  severity: 'low' | 'medium' | 'high'
  timestamp: number
}

interface MonitoredPosition {
  marketId: string
  marketName: string
  sizeUnits: number
  isLong: boolean
  leverage: number
  entryPrice: number
  currentPrice: number
  pnlPercent: number
  liquidationPrice: number
  distanceToLiquidation: number
}

export function usePositionMonitor() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [positions, setPositions] = useState<MonitoredPosition[]>([])
  const [alerts, setAlerts] = useState<PositionAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)

  // Thresholds para alertas
  const LIQUIDATION_WARNING_PERCENT = 20 // Alerta si está a 20% de liquidación
  const PROFIT_ALERT_PERCENT = 50 // Alerta en +50% profit
  const LOSS_ALERT_PERCENT = -25 // Alerta en -25% loss

  const addAlert = useCallback((alert: Omit<PositionAlert, 'timestamp'>) => {
    const newAlert: PositionAlert = {
      ...alert,
      timestamp: Date.now()
    }
    
    setAlerts(prev => [newAlert, ...prev].slice(0, 10)) // Mantener últimas 10
    
    // Mostrar notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`SpecMarket: ${alert.marketName}`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: `${alert.type}-${alert.marketName}`
      })
    }

    // Reproducir sonido según severidad
    playAlertSound(alert.severity)
  }, [])

  const playAlertSound = (severity: string) => {
    // Crear beep simple con Web Audio API
    if (typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Frecuencias según severidad
      oscillator.frequency.value = severity === 'high' ? 800 : severity === 'medium' ? 600 : 400
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }
  }

  const calculateLiquidationPrice = (
    entryPrice: number,
    isLong: boolean,
    leverage: number
  ) => {
    // Aproximación: liquidación ocurre cuando pérdida = 100% del margen
    // Margen = notional / leverage
    // Pérdida máxima = notional / leverage
    const liquidationMovePercent = 100 / leverage

    if (isLong) {
      return entryPrice * (1 - liquidationMovePercent / 100)
    } else {
      return entryPrice * (1 + liquidationMovePercent / 100)
    }
  }

  const monitorPositions = useCallback(async () => {
    if (!publicKey) return

    try {
      const monitoredPositions: MonitoredPosition[] = []
      const previousPositions = new Map(positions.map(p => [p.marketId, p]))

      for (const market of MARKETS) {
        const marketPda = new PublicKey(market.marketPda)
        const position = await getUserPosition(connection, publicKey, marketPda)

        if (position) {
          // Fetch current price
          const marketAccount = await connection.getAccountInfo(marketPda)
          let currentPrice = market.currentPrice

          if (marketAccount) {
            const data = marketAccount.data
            const priceCents = new anchor.BN(data.slice(40, 48), 'le').toNumber()
            currentPrice = priceCents / 100
          }

          // Calculate metrics
          const priceDiff = position.isLong
            ? (currentPrice - position.entryPrice)
            : (position.entryPrice - currentPrice)

          const pnlPercent = (priceDiff / position.entryPrice) * 100 * position.leverage

          const liquidationPrice = calculateLiquidationPrice(
            position.entryPrice,
            position.isLong,
            position.leverage
          )

          const distanceToLiquidation = position.isLong
            ? ((currentPrice - liquidationPrice) / currentPrice) * 100
            : ((liquidationPrice - currentPrice) / currentPrice) * 100

          const monitoredPos: MonitoredPosition = {
            marketId: market.id,
            marketName: market.name,
            sizeUnits: position.sizeUnits,
            isLong: position.isLong,
            leverage: position.leverage,
            entryPrice: position.entryPrice,
            currentPrice,
            pnlPercent,
            liquidationPrice,
            distanceToLiquidation
          }

          monitoredPositions.push(monitoredPos)

          // Check for alerts
          const prevPos = previousPositions.get(market.id)

          // Liquidation warning
          if (distanceToLiquidation < LIQUIDATION_WARNING_PERCENT) {
            if (!prevPos || prevPos.distanceToLiquidation >= LIQUIDATION_WARNING_PERCENT) {
              addAlert({
                type: 'liquidation',
                marketName: market.name,
                message: `⚠️ Position at risk! Only ${distanceToLiquidation.toFixed(1)}% from liquidation at $${liquidationPrice.toFixed(2)}`,
                severity: 'high'
              })
            }
          }

          // Profit alert
          if (pnlPercent >= PROFIT_ALERT_PERCENT) {
            if (!prevPos || prevPos.pnlPercent < PROFIT_ALERT_PERCENT) {
              addAlert({
                type: 'profit',
                marketName: market.name,
                message: `🎉 Great profit! Position up ${pnlPercent.toFixed(1)}%`,
                severity: 'low'
              })
            }
          }

          // Loss alert
          if (pnlPercent <= LOSS_ALERT_PERCENT) {
            if (!prevPos || prevPos.pnlPercent > LOSS_ALERT_PERCENT) {
              addAlert({
                type: 'loss',
                marketName: market.name,
                message: `📉 Position down ${Math.abs(pnlPercent).toFixed(1)}%. Consider closing.`,
                severity: 'medium'
              })
            }
          }

          // Significant price change (>5% from entry)
          const priceChangePercent = Math.abs((currentPrice - position.entryPrice) / position.entryPrice * 100)
          if (priceChangePercent >= 5) {
            if (!prevPos || Math.abs((prevPos.currentPrice - position.entryPrice) / position.entryPrice * 100) < 5) {
              addAlert({
                type: 'price_change',
                marketName: market.name,
                message: `📊 Price moved ${priceChangePercent.toFixed(1)}% to $${currentPrice.toLocaleString()}`,
                severity: 'low'
              })
            }
          }
        }
      }

      setPositions(monitoredPositions)
    } catch (error) {
      console.error('Error monitoring positions:', error)
    }
  }, [publicKey, connection, positions, addAlert])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Start/stop monitoring
  useEffect(() => {
    if (!publicKey || !isMonitoring) {
      return
    }

    // Monitor every 10 seconds
    const interval = setInterval(monitorPositions, 10000)
    
    // Initial check
    monitorPositions()

    return () => clearInterval(interval)
  }, [publicKey, isMonitoring, monitorPositions])

  const clearAlerts = () => setAlerts([])

  const dismissAlert = (timestamp: number) => {
    setAlerts(prev => prev.filter(a => a.timestamp !== timestamp))
  }

  return {
    positions,
    alerts,
    isMonitoring,
    setIsMonitoring,
    clearAlerts,
    dismissAlert
  }
}
