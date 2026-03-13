import { useState } from 'react';
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
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Skeleton } from 'src/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (page: number, pageSize: number) => void;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: TData[]) => void;
  bulkActions?: React.ReactNode;
  manualPagination?: boolean;
  totalRows?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

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
      setRowSelection(updater);
      if (onRowSelectionChange) {
        const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key as keyof typeof newSelection])
          .map((key) => data[parseInt(key)])
          .filter(Boolean);
        onRowSelectionChange(selectedRows);
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
  });

  const selectedCount = Object.keys(rowSelection).filter(
    (k) => rowSelection[k as keyof typeof rowSelection],
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {searchKey && (
          <div className="relative max-w-sm flex-1">
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pr-8"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <SlidersHorizontal className="mr-2 size-4" /> Columns
            </Button>
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
          <span className="text-sm text-muted-foreground">{selectedCount} row(s) selected</span>
          {bulkActions}
        </div>
      )}

      <div className="rounded-md border">
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
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalRows !== undefined
            ? `${totalRows} total rows`
            : `${table.getFilteredRowModel().rows.length} row(s)`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="First page"
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
            aria-label="Previous page"
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
            Page{' '}
            {(manualPagination
              ? (controlledPageIndex ?? 0)
              : table.getState().pagination.pageIndex) + 1}{' '}
            of {manualPagination ? (controlledPageCount ?? 1) : table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label="Next page"
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
            aria-label="Last page"
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
  );
}
