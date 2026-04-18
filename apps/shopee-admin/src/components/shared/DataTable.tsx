import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Skeleton } from 'src/components/ui/skeleton'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  isLoading?: boolean
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPaginationChange?: (page: number, pageSize: number) => void
  enableRowSelection?: boolean
  onRowSelectionChange?: (rows: TData[]) => void
  bulkActions?: React.ReactNode
  manualPagination?: boolean
  totalRows?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  isLoading,
  pageCount: controlledPageCount,
  pageIndex: controlledPageIndex,
  pageSize: controlledPageSize = 10,
  onPaginationChange,
  enableRowSelection = false,
  onRowSelectionChange,
  bulkActions,
  manualPagination = false,
  totalRows,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const { t } = useTranslation('common')

  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  const table = useReactTable({
    data,
    columns,
    pageCount: controlledPageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      ...(manualPagination && {
        pagination: { pageIndex: controlledPageIndex ?? 0, pageSize: controlledPageSize },
      }),
    },
    enableRowSelection,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater)
      if (onRowSelectionChange) {
        const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key as keyof typeof newSelection])
          .map((key) => data[parseInt(key)])
          .filter(Boolean)
        onRowSelectionChange(selectedRows)
      }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination,
  })

  const selectedCount = Object.keys(rowSelection).filter(
    (k) => rowSelection[k as keyof typeof rowSelection],
  ).length

  const rows = table.getRowModel().rows
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: isLoading ? controlledPageSize : rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 5,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {searchKey && (
          <div className="relative max-w-sm flex-1">
            <Input
              placeholder={searchPlaceholder ?? t('search.placeholder')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pr-8"
            />
            {searchValue && (
              <button
                onClick={() => {
                  setSearchValue('')
                  setGlobalFilter('')
                }}
                aria-label={t('search.clearSearch')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="ml-auto" />}>
            <SlidersHorizontal className="mr-2 size-4" /> {t('buttons.columns')}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                >
                  {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedCount > 0 && bulkActions && (
        <div className="flex items-center gap-2 rounded-md bg-muted p-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount} {t('pagination.rowsSelected')}
          </span>
          {bulkActions}
        </div>
      )}

      <div
        ref={tableContainerRef}
        tabIndex={0}
        role="region"
        aria-label={t('table.region', { defaultValue: 'Data table' })}
        aria-busy={isLoading}
        className="overflow-auto rounded-md border"
        style={{ maxHeight: 'min(600px, 70vh)' }}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: controlledPageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              <>
                <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px` }} />
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <TableRow
                      key={row.id}
                      data-index={virtualRow.index}
                      data-state={row.getIsSelected() && 'selected'}
                      ref={(node) => rowVirtualizer.measureElement(node)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
                <tr
                  style={{
                    height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end ?? 0)}px`,
                  }}
                />
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t('states.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {totalRows !== undefined
            ? `${totalRows} ${t('pagination.totalRows')}`
            : `${table.getFilteredRowModel().rows.length} ${t('pagination.rows')}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label={t('pagination.firstPage')}
            onClick={() =>
              manualPagination ? onPaginationChange?.(0, controlledPageSize) : table.setPageIndex(0)
            }
            disabled={
              manualPagination ? (controlledPageIndex ?? 0) === 0 : !table.getCanPreviousPage()
            }
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label={t('pagination.previousPage')}
            onClick={() =>
              manualPagination
                ? onPaginationChange?.((controlledPageIndex ?? 0) - 1, controlledPageSize)
                : table.previousPage()
            }
            disabled={
              manualPagination ? (controlledPageIndex ?? 0) === 0 : !table.getCanPreviousPage()
            }
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm">
            {t('pagination.page')}{' '}
            {(manualPagination
              ? (controlledPageIndex ?? 0)
              : table.getState().pagination.pageIndex) + 1}{' '}
            {t('pagination.of')}{' '}
            {manualPagination ? (controlledPageCount ?? 1) : table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label={t('pagination.nextPage')}
            onClick={() =>
              manualPagination
                ? onPaginationChange?.((controlledPageIndex ?? 0) + 1, controlledPageSize)
                : table.nextPage()
            }
            disabled={
              manualPagination
                ? (controlledPageIndex ?? 0) >= (controlledPageCount ?? 1) - 1
                : !table.getCanNextPage()
            }
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label={t('pagination.lastPage')}
            onClick={() =>
              manualPagination
                ? onPaginationChange?.((controlledPageCount ?? 1) - 1, controlledPageSize)
                : table.setPageIndex(table.getPageCount() - 1)
            }
            disabled={
              manualPagination
                ? (controlledPageIndex ?? 0) >= (controlledPageCount ?? 1) - 1
                : !table.getCanNextPage()
            }
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
