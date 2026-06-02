import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SortableAddressCard from '../SortableAddressCard'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: { 'data-attr': 'a' },
    listeners: { onPointerDown: () => {} },
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

vi.mock('../AddressCard', () => ({
  default: ({ address }: any) => <div data-testid="address-card">{address?._id}</div>,
}))

const makeAddress = (overrides: any = {}) => ({
  _id: 'a1',
  fullName: 'Nguyen',
  phone: '0123',
  ...overrides,
})

const baseProps: any = {
  address: makeAddress(),
  onEdit: () => {},
  onDelete: () => {},
  onSetDefault: () => {},
  formatAddress: () => '',
  getAddressTypeInfo: () => ({ label: '', icon: null, color: '' }),
}

describe('SortableAddressCard', () => {
  it('renders AddressCard with props', () => {
    render(<SortableAddressCard {...baseProps} />)
    expect(screen.getByTestId('address-card')).toHaveTextContent('a1')
  })

  it('applies cursor-grab when not selection mode', () => {
    const { container } = render(<SortableAddressCard {...baseProps} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('cursor-grab')
  })

  it('does not apply cursor-grab when selection mode', () => {
    const { container } = render(<SortableAddressCard {...baseProps} isSelectionMode={true} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toContain('cursor-grab')
  })

  it('applies ring class when isDragging prop true', () => {
    const { container } = render(<SortableAddressCard {...baseProps} isDragging={true} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('ring-')
  })

  it('does not apply ring class by default', () => {
    const { container } = render(<SortableAddressCard {...baseProps} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toContain('ring-2')
  })
})
