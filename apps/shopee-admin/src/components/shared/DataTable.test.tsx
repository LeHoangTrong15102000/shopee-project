import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface TestRow {
  id: string;
  name: string;
}

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];

const data: TestRow[] = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
];

describe('DataTable', () => {
  it('renders columns and data', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('shows loading state with skeleton rows', () => {
    render(<DataTable columns={columns} data={[]} isLoading={true} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('states.noResults')).toBeInTheDocument();
  });

  it('renders search input when searchKey provided', () => {
    render(
      <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search..." />,
    );
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('filters data via search input', async () => {
    const user = userEvent.setup();
    render(
      <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search..." />,
    );
    await user.type(screen.getByPlaceholderText('Search...'), 'Item 1');
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
  });

  it('renders column visibility toggle', () => {
    render(<DataTable columns={columns} data={data} />);
    // The columns button text should be present (nested button from asChild)
    expect(screen.getByText('buttons.columns')).toBeInTheDocument();
  });

  it('shows row count', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText(/3.*pagination.rows/)).toBeInTheDocument();
  });
});
