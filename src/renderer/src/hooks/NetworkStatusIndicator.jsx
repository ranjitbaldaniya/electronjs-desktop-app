// NetworkStatusIndicator.js
import React, { useState, useEffect } from 'react'
import useOnlineStatus from './useOnlineStatus'

const NetworkStatusIndicator = () => {
  const isOnline = useOnlineStatus()
  console.log('is online', isOnline)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowStatus(true)
      const timer = setTimeout(() => {
        setShowStatus(false)
      }, 3000) // Display message for 3 seconds
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  return showStatus ? (
    <div style={{ backgroundColor: 'red', color: 'white', padding: '10px', textAlign: 'center' }}>
      You are offline
    </div>
  ) : null
}

export default NetworkStatusIndicator
