import React, { useState } from 'react'
import { DOMAIN_KEYS, DomainKey, isMockEnabled, toggle, reset } from './mockControl'

export default function MockTogglePanel() {
  // Force re-render on toggle so switches reflect current state
  const [, forceUpdate] = useState(0)

  function handleToggle(feature: DomainKey) {
    toggle(feature)
    forceUpdate((n) => n + 1)
  }

  function handleReset() {
    reset()
    forceUpdate((n) => n + 1)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        background: 'rgba(20, 20, 20, 0.92)',
        color: '#fff',
        borderRadius: 8,
        padding: '12px 16px',
        fontSize: 12,
        fontFamily: 'monospace',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        minWidth: 200,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Mock Controls</div>
      {DOMAIN_KEYS.map((key) => {
        const enabled = isMockEnabled(key)
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
              gap: 12,
            }}
          >
            <span>{key}</span>
            <button
              onClick={() => handleToggle(key)}
              aria-pressed={enabled}
              style={{
                cursor: 'pointer',
                padding: '2px 10px',
                borderRadius: 4,
                border: 'none',
                background: enabled ? '#22c55e' : '#6b7280',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: 11,
              }}
            >
              {enabled ? 'ON' : 'OFF'}
            </button>
          </div>
        )
      })}
      <button
        onClick={handleReset}
        style={{
          marginTop: 8,
          width: '100%',
          padding: '4px 0',
          borderRadius: 4,
          border: 'none',
          background: '#ef4444',
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: 11,
        }}
      >
        reset all
      </button>
    </div>
  )
}
