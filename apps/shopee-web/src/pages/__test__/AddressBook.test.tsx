import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import React from 'react'
import AddressBook from '../User/pages/AddressBook/AddressBook'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}))

vi.mock('src/apis/address.api', () => ({
  default: {
    getAddresses: vi.fn(() => Promise.resolve({ data: { data: { addresses: [] } } })),
    deleteAddress: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    updateAddress: vi.fn(() => Promise.resolve({ data: { data: {} } })),
  },
}))

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  closestCenter: vi.fn(),
  MeasuringStrategy: { Always: 'always' },
}))

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToWindowEdges: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  rectSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children),
    )
}

describe('AddressBook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders address book page', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(AddressBook), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('user:address.title')).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    const Wrapper = createWrapper()
    render(React.createElement(AddressBook), { wrapper: Wrapper })

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders empty state when no addresses', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(AddressBook), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.queryByText('user:address.title')).toBeInTheDocument()
    })
  })
})
