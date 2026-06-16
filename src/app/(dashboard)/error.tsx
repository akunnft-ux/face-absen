"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="rounded-lg bg-red-50 p-6 dark:bg-red-950">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Terjadi Kesalahan
        </h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error.message || "Silakan coba lagi"}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
