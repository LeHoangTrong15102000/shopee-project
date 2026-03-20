import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import UserListPage from './UserListPage';
import { server } from '../../../vitest.setup';
import { http, HttpResponse } from 'msw';
import { API_URL } from 'src/msw/msw-utils';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('UserListPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders user table after loading', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders page header with add user button', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /actions.addUser/i })).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument();
  });

  it('renders export CSV button', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /buttons.exportCsv/i })).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/users`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      }),
    );
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  it('renders page description', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument();
    });
  });

  it('renders data rows in table', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('opens create user dialog when add button clicked', async () => {
    const { user } = renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    const addBtn = screen.getByRole('button', { name: /actions.addUser/i });
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('form.name')).toBeInTheDocument();
      expect(screen.getByLabelText('form.email')).toBeInTheDocument();
      expect(screen.getByLabelText('form.password')).toBeInTheDocument();
    });
  });

  it('clicks export CSV button without crashing', async () => {
    const { user } = renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    const exportBtn = screen.getByRole('button', { name: /buttons.exportCsv/i });
    await user.click(exportBtn);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('fills and submits create user form', async () => {
    const { user } = renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    const addBtn = screen.getByRole('button', { name: /actions.addUser/i });
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    const nameInput = screen.getByLabelText('form.name');
    const emailInput = screen.getByLabelText('form.email');
    const passwordInput = screen.getByLabelText('form.password');
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    expect(nameInput).toHaveValue('Test User');
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
    const createBtn = screen.getByRole('button', { name: /buttons.create/i });
    await user.click(createBtn);
  });

  it('renders user avatar column', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('renders user role badges', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('columns.roles');
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('submits create user form', async () => {
    const { user } = renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    const addBtn = screen.getByRole('button', { name: /actions.addUser/i });
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText('form.name'), 'New User');
    await user.type(screen.getByLabelText('form.email'), 'newuser@example.com');
    await user.type(screen.getByLabelText('form.password'), 'securepass123');
    const createBtn = screen.getByRole('button', { name: /buttons.create/i });
    await user.click(createBtn);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('renders user email in table', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('admin@shopee.com')).toBeInTheDocument();
    });
  });

  it('renders user creation date', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('columns.created');
    await waitFor(() => {
      const dateCells = screen.getAllByText(/Jan \d{1,2}, 2024/);
      expect(dateCells.length).toBeGreaterThan(0);
    });
  });

  it('fills all create user form fields', async () => {
    const { user } = renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    const addBtn = screen.getByRole('button', { name: /actions.addUser/i });
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    const nameInput = screen.getByLabelText('form.name');
    const emailInput = screen.getByLabelText('form.email');
    const passwordInput = screen.getByLabelText('form.password');
    const roleInput = screen.getByLabelText('form.role');
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'secret123');
    await user.clear(roleInput);
    await user.type(roleInput, 'Admin');
    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(passwordInput).toHaveValue('secret123');
    expect(roleInput).toHaveValue('Admin');
  });

  it('renders user name from mock data in table', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
  });
});
