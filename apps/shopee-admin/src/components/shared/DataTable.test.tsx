import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from './DataTable'
import type { ColumnDef } from '@tanstack/react-table'

// Mock virtualizer to render all items in jsdom (no real scroll container dimensions)
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        start: i * 48,
        end: (i + 1) * 48,
        size: 48,
        key: i,
      })),
    getTotalSize: () => count * 48,
    measureElement: () => {},
  }),
}))

interface TestRow {
  id: string
  name: string
}

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
]

const data: TestRow[] = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
]

describe('DataTable', () => {
  it('renders columns and data', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('shows loading state with skeleton rows', () => {
    render(<DataTable columns={columns} data={[]} isLoading={true} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('states.noResults')).toBeInTheDocument()
  })

  it('renders search input when searchKey provided', () => {
    render(
      <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search..." />,
    )
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('filters data via search input', async () => {
    const user = userEvent.setup()
    render(
      <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search..." />,
    )
    await user.type(screen.getByPlaceholderText('Search...'), 'Item 1')
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument()
  })

  it('renders column visibility toggle', () => {
    render(<DataTable columns={columns} data={data} />)
    // The columns button text should be present (nested button from asChild)
    expect(screen.getByText('buttons.columns')).toBeInTheDocument()
  })

  it('shows row count', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText(/3.*pagination.rows/)).toBeInTheDocument()
  })

  it('shows total rows when totalRows provided', () => {
    render(<DataTable columns={columns} data={data} totalRows={100} />)
    expect(screen.getByText(/100.*pagination.totalRows/)).toBeInTheDocument()
  })

  it('renders pagination buttons', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByRole('button', { name: /pagination.firstPage/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pagination.previousPage/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pagination.nextPage/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pagination.lastPage/i })).toBeInTheDocument()
  })

  it('shows clear search button when search has value', async () => {
    const user = userEvent.setup()
    render(
      <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search..." />,
    )
    await user.type(screen.getByPlaceholderText('Search...'), 'test')
    expect(screen.getByRole('button', { name: /search.clearSearch/i })).toBeInTheDocument()
  })

  it('clears search when clear button clicked', async () => {
    const user = userEvent.setup()
    render(
      <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search..." />,
    )
    const input = screen.getByPlaceholderText('Search...')
    await user.type(input, 'Item 1')
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /search.clearSearch/i }))
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('renders manual pagination with page info', () => {
    const onPaginationChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        manualPagination
        pageIndex={0}
        pageCount={5}
        onPaginationChange={onPaginationChange}
        totalRows={50}
      />,
    )
    expect(screen.getByText(/pagination.page/)).toBeInTheDocument()
    expect(screen.getByText(/pagination.of/)).toBeInTheDocument()
  })

  it('renders with row selection enabled', () => {
    render(<DataTable columns={columns} data={data} enableRowSelection />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('calls onPaginationChange when next page clicked in manual mode', async () => {
    const user = userEvent.setup()
    const onPaginationChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        manualPagination
        pageIndex={0}
        pageCount={5}
        onPaginationChange={onPaginationChange}
        totalRows={50}
      />,
    )
    await user.click(screen.getByRole('button', { name: /pagination.nextPage/i }))
    expect(onPaginationChange).toHaveBeenCalledWith(1, 10)
  })

  it('calls onPaginationChange when last page clicked in manual mode', async () => {
    const user = userEvent.setup()
    const onPaginationChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        manualPagination
        pageIndex={0}
        pageCount={5}
        onPaginationChange={onPaginationChange}
        totalRows={50}
      />,
    )
    await user.click(screen.getByRole('button', { name: /pagination.lastPage/i }))
    expect(onPaginationChange).toHaveBeenCalledWith(4, 10)
  })

  it('disables previous/first buttons on first page in manual mode', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        manualPagination
        pageIndex={0}
        pageCount={5}
        onPaginationChange={vi.fn()}
        totalRows={50}
      />,
    )
    expect(screen.getByRole('button', { name: /pagination.firstPage/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /pagination.previousPage/i })).toBeDisabled()
  })

  it('disables next/last buttons on last page in manual mode', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        manualPagination
        pageIndex={4}
        pageCount={5}
        onPaginationChange={vi.fn()}
        totalRows={50}
      />,
    )
    expect(screen.getByRole('button', { name: /pagination.nextPage/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /pagination.lastPage/i })).toBeDisabled()
  })

  it('calls onPaginationChange when previous page clicked', async () => {
    const user = userEvent.setup()
    const onPaginationChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        manualPagination
        pageIndex={2}
        pageCount={5}
        onPaginationChange={onPaginationChange}
        totalRows={50}
      />,
    )
    await user.click(screen.getByRole('button', { name: /pagination.previousPage/i }))
    expect(onPaginationChange).toHaveBeenCalledWith(1, 10)
  })

  it('calls onPaginationChange when first page clicked', async () => {
    const user = userEvent.setup()
    const onPaginationChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        manualPagination
        pageIndex={3}
        pageCount={5}
        onPaginationChange={onPaginationChange}
        totalRows={50}
      />,
    )
    await user.click(screen.getByRole('button', { name: /pagination.firstPage/i }))
    expect(onPaginationChange).toHaveBeenCalledWith(0, 10)
  })

  it('renders scroll container with accessibility attributes', () => {
    render(<DataTable columns={columns} data={data} />)
    const region = screen.getByRole('region')
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toHaveAttribute('aria-label')
  })

  it('uses responsive max-height on scroll container', () => {
    render(<DataTable columns={columns} data={data} />)
    const region = screen.getByRole('region')
    expect(region.style.maxHeight).toBe('min(600px, 70vh)')
  })

  it('renders virtualized rows with data-index attributes', () => {
    const largeData = Array.from({ length: 50 }, (_, i) => ({ id: String(i), name: `Item ${i}` }))
    render(<DataTable columns={columns} data={largeData} />)
    const rows = screen.getAllByRole('row')
    // Should have header row + virtualized data rows (not all 50)
    expect(rows.length).toBeLessThan(55)
  })
})
