"use client"

import { useRef, useCallback, useState, useEffect } from "react"

const BASELINE_FRAMES = 10
const DROP_RATIO = 0.75
const MIN_CONSECUTIVE_LOW = 2
const LIVENESS_TIMEOUT = 12000

export function useLiveness() {
  const [status, setStatus] = useState<"idle" | "watching" | "detected" | "failed" | "timeout">("idle")
  const [blinkCount, setBlinkCount] = useState(0)
  const statusRef = useRef(status)
  const baselineSumRef = useRef(0)
  const baselineCountRef = useRef(0)
  const baselineReadyRef = useRef(false)
  const baselineRef = useRef(0.3)
  const lowEarFramesRef = useRef(0)
  const totalBlinksRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const reset = useCallback(() => {
    setStatus("idle")
    setBlinkCount(0)
    statusRef.current = "idle"
    baselineSumRef.current = 0
    baselineCountRef.current = 0
    baselineReadyRef.current = false
    lowEarFramesRef.current = 0
    totalBlinksRef.current = 0
    clearTimeout(timerRef.current)
  }, [])

  const start = useCallback(() => {
    reset()
    setStatus("watching")

    timerRef.current = setTimeout(() => {
      if (totalBlinksRef.current < 1) {
        setStatus("timeout")
        statusRef.current = "timeout"
      }
    }, LIVENESS_TIMEOUT)
  }, [reset])

  const processFrame = useCallback((ear: number | null) => {
    if (ear === null || ear === 0) return

    if (!baselineReadyRef.current) {
      baselineSumRef.current += ear
      baselineCountRef.current++
      if (baselineCountRef.current >= BASELINE_FRAMES) {
        baselineRef.current = baselineSumRef.current / baselineCountRef.current
        baselineReadyRef.current = true
      }
      return
    }

    const threshold = baselineRef.current * DROP_RATIO

    if (ear < threshold) {
      lowEarFramesRef.current++
    } else {
      if (lowEarFramesRef.current >= MIN_CONSECUTIVE_LOW) {
        totalBlinksRef.current++
        setBlinkCount(totalBlinksRef.current)

        if (totalBlinksRef.current >= 1) {
          clearTimeout(timerRef.current)
          setStatus("detected")
          statusRef.current = "detected"
        }
      }
      lowEarFramesRef.current = 0
    }
  }, [])

  const getScore = useCallback(() => {
    if (totalBlinksRef.current >= 1) return Math.min(1, totalBlinksRef.current / 3)
    return 0
  }, [])

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return {
    status,
    blinkCount,
    statusRef,
    start,
    reset,
    processFrame,
    getScore,
    isLive: status === "detected",
  }
}
