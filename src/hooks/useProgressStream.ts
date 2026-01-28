'use client'

import { useState, useEffect } from 'react'

interface ProgressData {
  status: string
  progress: string
  currentStep: number
  totalSteps: number
}

export function useProgressStream(loopId?: string) {
  const [data, setData] = useState<ProgressData>({
    status: 'idle',
    progress: '',
    currentStep: 1,
    totalSteps: 10,
  })
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!loopId) return

    const eventSource = new EventSource(`/api/loops/${loopId}/progress`)

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data)
        setData(parsedData)
      } catch (error) {
        console.error('Failed to parse SSE data:', error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
    }

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [loopId])

  return {
    ...data,
    isConnected,
  }
}
