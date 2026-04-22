'use client'

import { usePositionMonitor } from '@/lib/hooks/usePositionMonitor'
import { useState } from 'react'

export function PositionAlerts() {
  const { alerts, isMonitoring, setIsMonitoring, clearAlerts, dismissAlert } = usePositionMonitor()
  const [isExpanded, setIsExpanded] = useState(false)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-600/20 border-red-600/50 text-red-200'
      case 'medium': return 'bg-yellow-600/20 border-yellow-600/50 text-yellow-200'
      case 'low': return 'bg-blue-600/20 border-blue-600/50 text-blue-200'
      default: return 'bg-gray-600/20 border-gray-600/50 text-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'liquidation': return '⚠️'
      case 'profit': return '🎉'
      case 'loss': return '📉'
      case 'price_change': return '📊'
      default: return '🔔'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Toggle Button */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            isMonitoring
              ? 'bg-green-600 text-white'
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
          }`}
        >
          {isMonitoring ? '🔔 Monitoring ON' : '🔕 Monitoring OFF'}
        </button>

        {alerts.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition relative"
          >
            Alerts ({alerts.length})
            {!isExpanded && alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        )}
      </div>

      {/* Alerts List */}
      {isExpanded && alerts.length > 0 && (
        <div className="bg-black/90 backdrop-blur rounded-lg border border-white/20 overflow-hidden max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-white font-bold">Recent Alerts</h3>
            <button
              onClick={clearAlerts}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Clear All
            </button>
          </div>

          <div className="divide-y divide-white/10">
            {alerts.map((alert) => (
              <div
                key={alert.timestamp}
                className={`p-3 border-l-4 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTypeIcon(alert.type)}</span>
                      <span className="font-bold">{alert.marketName}</span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.timestamp)}
                    className="text-white/40 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
