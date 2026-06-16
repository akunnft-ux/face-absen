"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/LoadingState"
import { registerFace } from "@/actions/face-registration"
import { Camera, CheckCircle, XCircle, RefreshCw, Loader2 } from "lucide-react"
import type { Employee } from "@/lib/types"

const MODEL_URL = "/models"

export default function RegisterFacePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [faceLoaded, setFaceLoaded] = useState(false)
  const [faceLoading, setFaceLoading] = useState(true)
  const [cameraActive, setCameraActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [descriptor, setDescriptor] = useState<number[] | null>(null)
  const [quality, setQuality] = useState(0)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          router.push("/employees")
          return
        }
        setEmployee(data as Employee)
        setLoading(false)
      })
  }, [id, supabase, router])

  const loadModels = useCallback(async () => {
    try {
      const faceapi = await import("face-api.js")
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      setFaceLoaded(true)
      setFaceLoading(false)
    } catch {
      setError("Gagal memuat model pengenalan wajah. Refresh halaman.")
      setFaceLoading(false)
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
      setCameraActive(true)
      setError(null)
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
    setCameraActive(false)
    cancelAnimationFrame(animRef.current)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const detectFace = useCallback(async () => {
    if (!faceLoaded || !videoRef.current || !canvasRef.current) return

    const faceapi = await import("face-api.js")
    const video = videoRef.current!
    const canvas = canvasRef.current!

    const detect = async () => {
      if (!cameraActive) return

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
        .withFaceLandmarks()
        .withFaceDescriptor()

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
        const arr = Array.from(detection.descriptor)
        descriptorRef.current = arr
        setDescriptor(arr)
        setQuality(detection.detection.score)
      } else {
        setFaceDetected(false)
      }

      animRef.current = requestAnimationFrame(detect)
    }

    detect()
  }, [faceLoaded, cameraActive])

  useEffect(() => {
    if (cameraActive && faceLoaded) {
      detectFace()
    }
  }, [cameraActive, faceLoaded, detectFace])

  const descriptorRef = useRef<number[] | null>(null)

  const capture = useCallback(() => {
    if (!videoRef.current || !descriptorRef.current) return

    const desc = descriptorRef.current
    const video = videoRef.current
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = video.videoWidth
    tempCanvas.height = video.videoHeight
    const ctx = tempCanvas.getContext("2d")!
    ctx.drawImage(video, 0, 0)
    const imageData = tempCanvas.toDataURL("image/jpeg", 0.9)

    setCapturedImage(imageData)
    setDescriptor(desc)
    stopCamera()
  }, [stopCamera])

  const retake = useCallback(() => {
    setCapturedImage(null)
    setDescriptor(null)
    descriptorRef.current = null
    setError(null)
    setSaved(false)
    startCamera()
  }, [startCamera])

  const handleSave = async () => {
    if (!descriptor || !capturedImage || !employee) return

    setSaving(true)
    setError(null)

    try {
      await registerFace(employee.id, descriptor, capturedImage, quality)
      setSaved(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState />

  if (!employee) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Registrasi Wajah</h1>
        <p className="text-sm text-muted-foreground">
          {employee.nama_lengkap} — {employee.nip}
        </p>
      </div>

      {faceLoading && <LoadingState message="Memuat model face recognition..." />}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {!faceLoading && !saved && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kamera</CardTitle>
              <CardDescription>
                Posisikan wajah di tengah frame dengan pencahayaan cukup
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!capturedImage ? (
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
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button onClick={startCamera} variant="secondary">
                        <Camera className="mr-2 h-4 w-4" />
                        Nyalakan Kamera
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mx-auto aspect-[4/3] max-w-sm overflow-hidden rounded-lg bg-black">
                  <img src={capturedImage} alt="Capture" className="h-full w-full object-cover" />
                </div>
              )}

              {cameraActive && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Deteksi Wajah</span>
                    {faceDetected ? (
                      <Badge variant="success">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Terdeteksi
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Mencari...
                      </Badge>
                    )}
                  </div>
                  {faceDetected && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Kualitas</span>
                      <Badge variant={quality > 0.7 ? "success" : "warning"}>
                        {Math.round(quality * 100)}%
                      </Badge>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={capture}
                    disabled={!faceDetected}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Ambil Foto
                  </Button>
                </div>
              )}

              {capturedImage && (
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={retake}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Ulang
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={saving || !descriptor}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Wajah"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pegawai</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">NIP</p>
                <p className="font-mono text-sm">{employee.nip}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nama</p>
                <p className="font-medium">{employee.nama_lengkap}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jabatan</p>
                <p className="text-sm">{employee.jabatan || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit Kerja</p>
                <p className="text-sm">{employee.unit_kerja || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status Wajah</p>
                {employee.is_terdaftar_wajah ? (
                  <Badge variant="success">Sudah terdaftar</Badge>
                ) : (
                  <Badge variant="outline">Belum terdaftar</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {saved && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900">
              <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Registrasi Berhasil</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Wajah {employee.nama_lengkap} berhasil direkam
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => router.push("/employees")}>
                Kembali
              </Button>
              <Button onClick={() => router.push("/attendance")}>Absen Sekarang</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
