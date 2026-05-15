import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AddressBook from '../AddressBook'

vi.mock('src/components/SEO', () => ({ default: () => null }))
vi.mock('src/i18n/i18n', () => ({
  default: {
    t: (k: string) => {
      const map: Record<string, string> = {
        'address:type.home': 'Nhà riêng',
        'address:type.office': 'Văn phòng',
        'address:type.other': 'Khác',
      }
      return map[k] || k
    },
  },
}))
vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ariaLabel, ...rest } = props
    return (
      <button onClick={onClick} className={className} {...rest}>
        {children}
      </button>
    )
  },
}))

vi.mock('src/components/AddressSelector/AddressForm', () => ({
  default: ({ address, onClose, onSuccess }: any) => (
    <div data-testid="address-form">
      <span>{address ? 'editing' : 'new'}</span>
      <button onClick={onClose}>close-form</button>
    </div>
  ),
}))

vi.mock('../components/AddressCard', () => ({
  default: ({ address, isDefault, onEdit, onDelete, onSetDefault }: any) => (
    <div data-testid={`address-card-${address._id}`}>
      <span>{address.name}</span>
      {isDefault && <span>default</span>}
      <button onClick={() => onEdit(address)}>edit</button>
      <button onClick={() => onDelete(address._id)}>delete</button>
      <button onClick={() => onSetDefault(address._id)}>set-default</button>
    </div>
  ),
}))

vi.mock('../components/AddressBookToolbar', () => ({
  default: (props: any) => <div data-testid="toolbar">toolbar</div>,
}))

vi.mock('../components/DeleteConfirmModal', () => ({
  default: ({ onConfirm, onCancel, title }: any) => (
    <div data-testid="delete-modal">
      {title && <span>{title}</span>}
      <button onClick={onConfirm}>confirm</button>
      <button onClick={onCancel}>cancel</button>
    </div>
  ),
}))

vi.mock('../components/EmptyState', () => ({
  default: ({ onAddNew }: any) => (
    <div data-testid="empty-state">
      <button onClick={onAddNew}>add</button>
    </div>
  ),
}))

vi.mock('../components/NoResultsState', () => ({
  default: ({ searchQuery, onClear }: any) => (
    <div data-testid="no-results">
      <button onClick={onClear}>clear</button>
    </div>
  ),
}))

vi.mock('../components/SortableAddressCard', () => ({
  default: ({ address, isDragging }: any) => (
    <div data-testid={`sortable-card-${address._id}`}>
      {address.name}
      {isDragging && ' dragging'}
    </div>
  ),
}))

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  MeasuringStrategy: { Always: 'always' },
}))
vi.mock('@dnd-kit/modifiers', () => ({ restrictToWindowEdges: {} }))
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <>{children}</>,
  rectSortingStrategy: {},
}))

const mockAddr = (
  id: string,
  name: string,
  isDefault = false,
  type: 'home' | 'office' | 'other' = 'home',
) => ({
  _id: id,
  name,
  phone: '0123456789',
  street: '123 Main St',
  ward: 'Ward 1',
  district: 'District 1',
  province: 'HCMC',
  isDefault,
  type,
})

const defaultHook = {
  showForm: false,
  editingAddress: null,
  deletingAddressId: null,
  searchQuery: '',
  filterType: 'all' as const,
  selectedIds: new Set<string>(),
  isSelectionMode: false,
  showBulkDeleteConfirm: false,
  activeId: null,
  rawAddresses: [mockAddr('1', 'Home', true), mockAddr('2', 'Office', false, 'office')],
  filteredAddresses: [mockAddr('1', 'Home', true), mockAddr('2', 'Office', false, 'office')],
  defaultAddress: mockAddr('1', 'Home', true),
  otherAddresses: [mockAddr('2', 'Office', false, 'office')],
  activeAddress: null,
  addressCounts: { all: 2, home: 1, office: 1, other: 0 },
  isLoading: false,
  deleteMutation: { isPending: false },
  handleAddNew: vi.fn(),
  handleEdit: vi.fn(),
  handleFormClose: vi.fn(),
  handleFormSuccess: vi.fn(),
  handleDelete: vi.fn(),
  confirmDelete: vi.fn(),
  handleSetDefault: vi.fn(),
  handleToggleSelect: vi.fn(),
  handleSelectAll: vi.fn(),
  handleBulkDelete: vi.fn(),
  confirmBulkDelete: vi.fn(),
  toggleSelectionMode: vi.fn(),
  setSearchQuery: vi.fn(),
  setFilterType: vi.fn(),
  setDeletingAddressId: vi.fn(),
  setShowBulkDeleteConfirm: vi.fn(),
  sensors: [],
  swapOnlyCollision: vi.fn(),
  handleDragStart: vi.fn(),
  handleDragEnd: vi.fn(),
  handleDragCancel: vi.fn(),
}

let hookReturn = { ...defaultHook }

vi.mock('../useAddressBook', () => ({
  useAddressBook: () => hookReturn,
}))

beforeEach(() => {
  hookReturn = { ...defaultHook, selectedIds: new Set<string>() }
  vi.clearAllMocks()
})

describe('AddressBook', () => {
  it('shows loading spinner when isLoading', () => {
    hookReturn = { ...defaultHook, isLoading: true, selectedIds: new Set() }
    const { container } = render(<AddressBook />)
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  it('renders empty state when no addresses', () => {
    hookReturn = {
      ...defaultHook,
      rawAddresses: [],
      filteredAddresses: [],
      defaultAddress: null as any,
      otherAddresses: [],
      selectedIds: new Set(),
    }
    render(<AddressBook />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('renders no results state when filtered is empty but raw has items', () => {
    hookReturn = { ...defaultHook, filteredAddresses: [], selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByTestId('no-results')).toBeInTheDocument()
  })

  it('renders toolbar when addresses exist', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByTestId('toolbar')).toBeInTheDocument()
  })

  it('does not render toolbar when no addresses', () => {
    hookReturn = {
      ...defaultHook,
      rawAddresses: [],
      filteredAddresses: [],
      defaultAddress: null as any,
      otherAddresses: [],
      selectedIds: new Set(),
    }
    render(<AddressBook />)
    expect(screen.queryByTestId('toolbar')).not.toBeInTheDocument()
  })

  it('renders default address card', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByTestId('address-card-1')).toBeInTheDocument()
    expect(screen.getByText('default')).toBeInTheDocument()
  })

  it('renders other addresses as sortable cards', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByTestId('sortable-card-2')).toBeInTheDocument()
  })

  it('renders add new button', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByText('Thêm địa chỉ mới')).toBeInTheDocument()
  })

  it('renders select multiple button when addresses exist', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByText('Chọn nhiều')).toBeInTheDocument()
  })

  it('renders cancel select when in selection mode', () => {
    hookReturn = { ...defaultHook, isSelectionMode: true, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByText('Hủy chọn')).toBeInTheDocument()
  })

  it('does not render select button when no addresses', () => {
    hookReturn = {
      ...defaultHook,
      rawAddresses: [],
      filteredAddresses: [],
      defaultAddress: null as any,
      otherAddresses: [],
      selectedIds: new Set(),
    }
    render(<AddressBook />)
    expect(screen.queryByText('Chọn nhiều')).not.toBeInTheDocument()
  })

  it('renders address form when showForm is true', () => {
    hookReturn = { ...defaultHook, showForm: true, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByTestId('address-form')).toBeInTheDocument()
    expect(screen.getByText('new')).toBeInTheDocument()
  })

  it('renders address form with editing address', () => {
    hookReturn = {
      ...defaultHook,
      showForm: true,
      editingAddress: mockAddr('1', 'Home') as any,
      selectedIds: new Set(),
    }
    render(<AddressBook />)
    expect(screen.getByText('editing')).toBeInTheDocument()
  })

  it('does not render address form when showForm is false', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
  })

  it('renders delete modal when deletingAddressId is set', () => {
    hookReturn = { ...defaultHook, deletingAddressId: '1', selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getAllByTestId('delete-modal').length).toBeGreaterThanOrEqual(1)
  })

  it('does not render delete modal when deletingAddressId is null', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
  })

  it('renders bulk delete modal when showBulkDeleteConfirm is true', () => {
    hookReturn = { ...defaultHook, showBulkDeleteConfirm: true, selectedIds: new Set(['1', '2']) }
    render(<AddressBook />)
    expect(screen.getAllByTestId('delete-modal').length).toBeGreaterThanOrEqual(1)
  })

  it('renders default address section header', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByText('Địa chỉ mặc định')).toBeInTheDocument()
  })

  it('renders other addresses section header with count', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByText(/Địa chỉ khác/)).toBeInTheDocument()
  })

  it('shows drag to reorder hint when not in selection mode', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByText('Kéo thả để sắp xếp')).toBeInTheDocument()
  })

  it('hides drag to reorder hint in selection mode', () => {
    hookReturn = { ...defaultHook, isSelectionMode: true, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.queryByText('Kéo thả để sắp xếp')).not.toBeInTheDocument()
  })

  it('does not render other addresses section when otherAddresses is empty', () => {
    hookReturn = { ...defaultHook, otherAddresses: [], selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.queryByText(/Địa chỉ khác/)).not.toBeInTheDocument()
  })

  it('does not render default address section when defaultAddress is null', () => {
    hookReturn = { ...defaultHook, defaultAddress: null as any, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.queryByText('Địa chỉ mặc định')).not.toBeInTheDocument()
  })

  it('renders drag overlay with active address', () => {
    hookReturn = {
      ...defaultHook,
      activeAddress: mockAddr('2', 'Office') as any,
      selectedIds: new Set(),
    }
    render(<AddressBook />)
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument()
  })

  it('renders subtitle with address count', () => {
    hookReturn = { ...defaultHook, selectedIds: new Set() }
    render(<AddressBook />)
    expect(screen.getByText(/Quản lý địa chỉ giao hàng/)).toBeInTheDocument()
  })
})
