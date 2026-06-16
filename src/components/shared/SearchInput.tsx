"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCallback, useEffect, useRef, useState } from "react"

export function SearchInput({
  placeholder = "Cari...",
  onSearch,
  defaultValue = "",
}: {
  placeholder?: string
  onSearch: (value: string) => void
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setValue(val)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onSearch(val), 300)
    },
    [onSearch]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  )
}
