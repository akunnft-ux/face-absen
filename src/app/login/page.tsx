"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/actions/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Camera } from "lucide-react"

export default function LoginPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error: string } | undefined, formData: FormData) => {
      return await login(formData)
    },
    undefined
  )

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 px-6">
      <div className="flex flex-col items-center mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <Camera className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Face-Absen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Absensi dengan pengenalan wajah
        </p>
      </div>

      <Card className="w-full max-w-sm border-none shadow-lg">
        <CardContent className="p-6">
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@kantor.com"
                required
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-12 text-base"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-lg p-3">
                {state.error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={pending}
            >
              {pending ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Sistem Absensi Wajah v1.0
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
