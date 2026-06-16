"use client"

import { useRef, useCallback, useState, useEffect } from "react"

const EAR_THRESHOLD = 0.18
const MIN_BLINKS = 1
const LIVENESS_TIMEOUT = 8000

export function useLiveness() {
  const [status, setStatus] = useState<"idle" | "watching" | "detected" | "failed" | "timeout">("idle")
  const [blinkCount, setBlinkCount] = useState(0)
  const earHistoryRef = useRef<number[]>([])
  const consecutiveClosedRef = useRef(0)
  const totalBlinksRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const reset = useCallback(() => {
    setStatus("idle")
    setBlinkCount(0)
    earHistoryRef.current = []
    consecutiveClosedRef.current = 0
    totalBlinksRef.current = 0
    clearTimeout(timerRef.current)
  }, [])

  const start = useCallback(() => {
    reset()
    setStatus("watching")

    timerRef.current = setTimeout(() => {
      if (totalBlinksRef.current < MIN_BLINKS) {
        setStatus("timeout")
      }
    }, LIVENESS_TIMEOUT)
  }, [reset])

  const processFrame = useCallback((ear: number | null) => {
    if (ear === null) {
      earHistoryRef.current.push(0)
      return
    }

    earHistoryRef.current.push(ear)
    if (earHistoryRef.current.length > 30) {
      earHistoryRef.current.shift()
    }

    if (ear < EAR_THRESHOLD) {
      consecutiveClosedRef.current++
    } else {
      if (consecutiveClosedRef.current >= 2 && consecutiveClosedRef.current <= 5) {
        totalBlinksRef.current++
        setBlinkCount(totalBlinksRef.current)

        if (totalBlinksRef.current >= MIN_BLINKS) {
          clearTimeout(timerRef.current)
          setStatus("detected")
        }
      }
      consecutiveClosedRef.current = 0
    }
  }, [])

  const getScore = useCallback(() => {
    if (totalBlinksRef.current >= MIN_BLINKS) return Math.min(1, totalBlinksRef.current / 3)
    return 0
  }, [])

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return {
    status,
    blinkCount,
    start,
    reset,
    processFrame,
    getScore,
    isLive: status === "detected",
  }
}
