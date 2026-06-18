"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { faceCheckIn } from "@/actions/face-attendance"
import {
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  ScanFace,
  Sun,
} from "lucide-react"

const MODEL_URL = "/models"
const STABLE_FRAMES = 5

type State = "init" | "loading_model" | "camera" | "matching" | "success" | "failed"

export default function AttendancePage() {
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)
  const faceapiRef = useRef<Awaited<typeof import("face-api.js")> | null>(null)

  const [state, setState] = useState<State>("init")
  const [faceLoaded, setFaceLoaded] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    employee: { id: string; nip: string; nama_lengkap: string; foto_registrasi_url: string }
    similarity: number
  } | null>(null)

  const loadModels = useCallback(async () => {
    setState("loading_model")
    try {
      const faceapi = await import("face-api.js")
      faceapiRef.current = faceapi
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      setFaceLoaded(true)
      setState("init")
    } catch {
      setError("Gagal memuat model pengenalan wajah.")
    }
  }, [])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      streamRef.current = stream
    } catch {
      setError("Kamera tidak dapat diakses. Izinkan akses kamera.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    cancelAnimationFrame(animRef.current)
  }, [])

  useEffect(() => {
    return stopCamera
  }, [stopCamera])

  const startCheck = useCallback(async () => {
    setError(null)
    setResult(null)
    setState("camera")
    await startCamera()
  }, [startCamera])

  useEffect(() => {
    if (state !== "camera" || !faceLoaded || !videoRef.current || !canvasRef.current) return

    const faceapi = faceapiRef.current!
    const video = videoRef.current!
    const canvas = canvasRef.current!

    let stableCount = 0
    let descriptor: Float32Array | null = null

    const detect = async () => {
      if (!streamRef.current) {
        animRef.current = requestAnimationFrame(detect)
        return
      }

      let detection: any
      try {
        detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
          .withFaceLandmarks()
          .withFaceDescriptor()
      } catch {
        animRef.current = requestAnimationFrame(detect)
        return
      }

      const ctx = canvas.getContext("2d")!
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (detection) {
        const dims = faceapi.matchDimensions(canvas, video, true)
        const resized = faceapi.resizeResults(detection, dims)
        faceapi.draw.drawDetections(canvas, resized)

        setFaceDetected(true)
        descriptor = detection.descriptor
        stableCount++

        if (stableCount >= STABLE_FRAMES) {
          setState("matching")

          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = video.videoWidth
          tempCanvas.height = video.videoHeight
          tempCanvas.getContext("2d")!.drawImage(video, 0, 0)
          const imageData = tempCanvas.toDataURL("image/jpeg", 0.9)

          if (!descriptor) return

          try {
            const res = await faceCheckIn(
              Array.from(descriptor),
              imageData,
              1,
              true
            )

            if (res.success) {
              setResult({
                employee: res.employee!,
                similarity: res.similarity!,
              })
              setState("success")
            } else {
              setError(res.error || "Wajah tidak dikenali")
              setState("failed")
            }
          } catch (e) {
            setError(String(e))
            setState("failed")
          }

          stopCamera()
          return
        }
      } else {
        setFaceDetected(false)
        stableCount = 0
      }

      animRef.current = requestAnimationFrame(detect)
    }

    detect()
    return () => cancelAnimationFrame(animRef.current)
  }, [state, faceLoaded, stopCamera])

  return (
    <div className="space-y-4">
      {state === "init" && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <ScanFace className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-center">Absensi Face Recognition</h2>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
            Posisikan wajah di tengah frame dengan pencahayaan cukup. Sistem akan mencocokkan wajah secara otomatis.
          </p>

          <Button size="lg" className="mt-8 w-full max-w-sm h-14 text-base" onClick={startCheck} disabled={!faceLoaded}>
            {faceLoaded ? (
              <>
                <Camera className="mr-2 h-5 w-5" />
                Mulai Absen
              </>
            ) : (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memuat model...
              </>
            )}
          </Button>
        </div>
      )}

      {(state === "loading_model" || state === "camera" || state === "matching") && (
        <div className="space-y-4">
          <div className="relative mx-auto aspect-[3/4] max-w-xs overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
            />

            {/* Face frame guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-60 rounded-2xl border-2 border-white/30" />
            </div>

            {/* Status overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="rounded-xl bg-black/60 backdrop-blur px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">
                    {state === "loading_model" && "Memuat model..."}
                    {state === "camera" && (faceDetected ? "Wajah terdeteksi" : "Arahkan wajah ke kamera")}
                    {state === "matching" && "Mencocokkan wajah..."}
                  </span>
                  {state === "matching" && (
                    <Loader2 className="h-4 w-4 text-white/80 animate-spin" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Sun className="h-3 w-3" />
            Pastikan pencahayaan cukup
          </div>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/50">
          <CardContent className="p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {state === "success" && result && (
        <Card className="border-emerald-200">
          <CardContent className="flex flex-col items-center py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Absen Berhasil!</h2>
            <p className="mt-1 text-lg font-semibold">{result.employee.nama_lengkap}</p>
            <p className="text-sm text-muted-foreground">NIP: {result.employee.nip}</p>
            <Badge variant="success" className="mt-3">
              Kecocokan: {Math.round(result.similarity * 100)}%
            </Badge>
            <Button size="lg" className="mt-8 w-full max-w-xs" onClick={startCheck}>
              <Camera className="mr-2 h-5 w-5" />
              Absen Lagi
            </Button>
          </CardContent>
        </Card>
      )}

      {state === "failed" && !result && (
        <Card className="border-red-200">
          <CardContent className="flex flex-col items-center py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Absen Gagal</h2>
            <p className="mt-1 text-sm text-muted-foreground text-center">{error || "Coba lagi dengan pencahayaan cukup"}</p>
            <Button size="lg" className="mt-8 w-full max-w-xs" onClick={startCheck}>
              <Camera className="mr-2 h-5 w-5" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      )}

      <TodaySummary />
    </div>
  )
}

function TodaySummary() {
  const supabase = createClient()
  const [attendances, setAttendances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    supabase
      .from("face_attendance")
      .select("*, employee:employees(nama_lengkap, nip)")
      .gte("check_in_at", today.toISOString())
      .order("check_in_at", { ascending: false })
      .then(({ data }) => {
        if (data) setAttendances(data)
        setLoading(false)
      })
  }, [supabase])

  if (loading || attendances.length === 0) return null

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">
          Absensi Hari Ini ({attendances.length})
        </h3>
        <div className="space-y-2">
          {attendances.slice(0, 5).map((a: any) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">{a.employee?.nama_lengkap}</p>
                  <p className="text-xs text-muted-foreground">{a.employee?.nip}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(a.check_in_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
