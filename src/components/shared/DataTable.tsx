"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingState } from "./LoadingState"
import { EmptyState } from "./EmptyState"
import { SearchInput } from "./SearchInput"
import { type LucideIcon } from "lucide-react"

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  loading,
  searchable = true,
  searchPlaceholder,
  onSearch,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  getKey,
}: {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; onClick: () => void }
  getKey: (item: T) => string
}) {
  if (loading) return <LoadingState />

  return (
    <div className="space-y-4">
      {searchable && onSearch && (
        <SearchInput placeholder={searchPlaceholder} onSearch={onSearch} />
      )}

      {data.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle || "Tidak ada data"}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={getKey(item)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
