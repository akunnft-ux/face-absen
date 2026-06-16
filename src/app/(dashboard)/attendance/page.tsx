"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLiveness } from "@/hooks/useLiveness"
import { faceCheckIn } from "@/actions/face-attendance"
import {
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  User,
} from "lucide-react"

const MODEL_URL = "/models"

type State = "init" | "loading_model" | "camera" | "liveness" | "matching" | "success" | "failed"

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
  const [currentEar, setCurrentEar] = useState(0)
  const [result, setResult] = useState<{
    employee: { id: string; nip: string; nama_lengkap: string; foto_registrasi_url: string }
    similarity: number
  } | null>(null)

  const liveness = useLiveness()
  const stateRef = useRef(state)
  stateRef.current = state

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
      setState("camera")
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
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      streamRef.current = stream
    } catch (e) {
      const err = e as DOMException
      if (err.name === "NotAllowedError") setError("Izinkan akses kamera di pengaturan browser.")
      else if (err.name === "NotFoundError") setError("Kamera tidak ditemukan.")
      else if (err.name === "NotReadableError") setError("Kamera sedang digunakan aplikasi lain.")
      else setError("Kamera tidak dapat diakses.")
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
    if (state === "camera" && faceLoaded) {
      startCamera()
    }
  }, [state, faceLoaded, startCamera])

  useEffect(() => {
    return stopCamera
  }, [stopCamera])

  const calculateEAR = useCallback(
    (landmarks: any): number => {
      const faceapi = faceapiRef.current
      if (!faceapi) return 0
      const leftEye = landmarks.positions.slice(36, 42)
      const rightEye = landmarks.positions.slice(42, 48)
      const dist = (a: any, b: any) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
      const leftEAR = (dist(leftEye[1], leftEye[5]) + dist(leftEye[2], leftEye[4])) / (2 * dist(leftEye[0], leftEye[3]))
      const rightEAR = (dist(rightEye[1], rightEye[5]) + dist(rightEye[2], rightEye[4])) / (2 * dist(rightEye[0], rightEye[3]))
      return (leftEAR + rightEAR) / 2
    },
    []
  )

  const startCheck = useCallback(async () => {
    setError(null)
    setResult(null)
    setState("camera")
    liveness.reset()
    await startCamera()
  }, [liveness, startCamera])

  const detectLoopRef = useRef<() => void>(null)

  useEffect(() => {
    if (stateRef.current !== "camera" || !faceLoaded || !videoRef.current || !canvasRef.current) return

    const faceapi = faceapiRef.current!
    const video = videoRef.current!
    const canvas = canvasRef.current!

    let livenessStarted = false
    let descriptor: Float32Array | null = null

    const detect = async () => {
      if (stateRef.current !== "camera" && stateRef.current !== "liveness") {
        return
      }

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
        new faceapi.draw.DrawBox(resized.detection.box, {
          boxColor: "#22c55e",
          lineWidth: 3,
          label: (resized.detection.score * 100).toFixed(0) + "%",
          drawLabelOptions: {
            backgroundColor: "#22c55e",
            fontColor: "#fff",
            fontSize: 14,
            padding: 6,
          },
        }).draw(canvas)

        setFaceDetected(true)
        descriptor = detection.descriptor

        if (!livenessStarted) {
          liveness.start()
          livenessStarted = true
          setState("liveness")
        }

        const ear = calculateEAR(detection.landmarks)
        setCurrentEar(ear)
        liveness.processFrame(ear)

        if (liveness.statusRef.current === "timeout" || liveness.statusRef.current === "failed") {
          setError("Tidak mendeteksi kedipan alami. Coba lagi.")
          stopCamera()
          setState("failed")
          return
        }

        if (liveness.statusRef.current === "detected") {
          setState("matching")

          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = video.videoWidth
          tempCanvas.height = video.videoHeight
          tempCanvas.getContext("2d")!.drawImage(video, 0, 0)
          const imageData = tempCanvas.toDataURL("image/jpeg", 0.9)

          try {
            const res = await faceCheckIn(
              Array.from(descriptor!),
              imageData,
              liveness.getScore(),
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
        }
      } else {
        setFaceDetected(false)
        setCurrentEar(0)
      }

      if (stateRef.current === "camera" || stateRef.current === "liveness") {
        animRef.current = requestAnimationFrame(detect)
      }
    }

    detectLoopRef.current = detect
    detect()

    return () => cancelAnimationFrame(animRef.current)
  }, [faceLoaded, calculateEAR, stopCamera])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Absen Wajah</h1>
          <p className="text-sm text-muted-foreground">
            Scan wajah untuk melakukan absensi
          </p>
        </div>
      </div>

      {state === "init" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-6 text-primary">
              <Camera className="h-12 w-12" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">Absensi Face Recognition</h2>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
              Posisikan wajah di tengah frame dengan pencahayaan cukup.
              Sistem akan mendeteksi kedipan alami untuk verifikasi.
            </p>
            <Button size="lg" className="mt-8" onClick={startCheck}>
              <Camera className="mr-2 h-5 w-5" />
              Mulai Absen
            </Button>
          </CardContent>
        </Card>
      )}

      {(state === "loading_model" || state === "camera" || state === "liveness" || state === "matching") && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kamera</CardTitle>
              <CardDescription>
                {state === "loading_model"
                  ? "Memuat model face recognition..."
                  : state === "camera"
                  ? "Arahkan wajah ke kamera"
                  : state === "liveness"
                  ? "Berkedip secara alami..."
                  : "Mencocokkan wajah..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mx-auto aspect-[4/3] max-w-sm overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                  onLoadedMetadata={() => videoRef.current?.play()}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full"
                />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Status</span>
                  {state === "loading_model" && (
                    <Badge variant="outline">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Loading model...
                    </Badge>
                  )}
                  {state === "camera" && (
                    <Badge variant={faceDetected ? "success" : "outline"}>
                      {faceDetected ? "Wajah terdeteksi" : "Mencari wajah..."}
                    </Badge>
                  )}
                  {state === "liveness" && (
                    <Badge variant="warning">
                      <Eye className="mr-1 h-3 w-3" />
                      {liveness.blinkCount > 0
                        ? `${liveness.blinkCount} kedipan`
                        : "Tunggu kedipan..."}
                    </Badge>
                  )}
                  {state === "matching" && (
                    <Badge variant="default">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Mencocokkan...
                    </Badge>
                  )}
                </div>
                {(state === "camera" || state === "liveness") && faceDetected && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>EAR</span>
                    <span className={currentEar > 0.22 ? "text-emerald-500" : "text-amber-500"}>
                      {currentEar.toFixed(3)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Face Recognition</p>
                  <p className="text-xs text-muted-foreground">
                    Pembacaan wajah + anti-spoofing blink detection
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Liveness Detection</p>
                  <p className="text-xs text-muted-foreground">
                    Mendeteksi kedipan alami untuk mencegah foto palsu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {state === "success" && result && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900">
              <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Absen Berhasil!</h2>
            <p className="mt-1 text-lg font-semibold">{result.employee.nama_lengkap}</p>
            <p className="text-sm text-muted-foreground">NIP: {result.employee.nip}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="success">
                Kecocokan: {Math.round(result.similarity * 100)}%
              </Badge>
            </div>
            <Button className="mt-6" onClick={startCheck}>
              <Camera className="mr-2 h-4 w-4" />
              Absen Lagi
            </Button>
          </CardContent>
        </Card>
      )}

      {state === "failed" && !result && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-red-100 p-4 dark:bg-red-900">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Absen Gagal</h2>
            <p className="mt-1 text-sm text-muted-foreground">{error || "Coba lagi dengan pencahayaan yang cukup"}</p>
            <Button className="mt-6" onClick={startCheck}>
              <Camera className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Today's attendance summary */}
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
      <CardHeader>
        <CardTitle className="text-lg">
          Absensi Hari Ini ({attendances.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attendances.slice(0, 5).map((a: any) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-100 p-1 dark:bg-emerald-900">
                  <CheckCircle className="h-full w-full text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium">{a.employee?.nama_lengkap}</p>
                  <p className="text-xs text-muted-foreground">{a.employee?.nip}</p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {new Date(a.check_in_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
