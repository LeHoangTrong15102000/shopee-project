import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Popover from '../Popover'

vi.mock('@floating-ui/react', () => ({
  useFloating: () => ({
    x: 0,
    y: 0,
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
      reference: { current: null },
    },
    strategy: 'absolute',
    middlewareData: { arrow: { x: 0 } },
  }),
  FloatingPortal: ({ children }: any) => <div data-testid="portal">{children}</div>,
  arrow: vi.fn(),
  shift: vi.fn(),
  offset: vi.fn(),
  flip: vi.fn(),
  autoUpdate: vi.fn(),
  useMergeRefs: (refs: any[]) => refs[0],
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}))

describe('Popover', () => {
  it('renders children', () => {
    render(
      <Popover renderPopover={<span>Popup content</span>}>
        <button>Trigger</button>
      </Popover>,
    )
    expect(screen.getByText('Trigger')).toBeInTheDocument()
  })

  it('shows popover on mouse enter', () => {
    const { container } = render(
      <Popover renderPopover={<span>Popup content</span>}>
        <button>Trigger</button>
      </Popover>,
    )
    fireEvent.mouseEnter(container.firstChild!)
    expect(screen.getByText('Popup content')).toBeInTheDocument()
  })

  it('sets aria-expanded to true when open', () => {
    const { container } = render(
      <Popover renderPopover={<span>Content</span>}>
        <button>Trigger</button>
      </Popover>,
    )
    fireEvent.mouseEnter(container.firstChild!)
    expect(container.firstChild).toHaveAttribute('aria-expanded', 'true')
  })

  it('sets aria-haspopup to dialog', () => {
    const { container } = render(
      <Popover renderPopover={<span>Content</span>}>
        <button>Trigger</button>
      </Popover>,
    )
    expect(container.firstChild).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('renders popover with role dialog', () => {
    const { container } = render(
      <Popover renderPopover={<span>Content</span>}>
        <button>Trigger</button>
      </Popover>,
    )
    fireEvent.mouseEnter(container.firstChild!)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Popover renderPopover={<span>Content</span>} className="custom-class">
        <button>Trigger</button>
      </Popover>,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders as custom element', () => {
    const { container } = render(
      <Popover renderPopover={<span>Content</span>} as="span">
        <button>Trigger</button>
      </Popover>,
    )
    expect(container.firstChild?.nodeName).toBe('SPAN')
  })

  it('opens with initialOpen', () => {
    render(
      <Popover renderPopover={<span>Initial content</span>} initialOpen>
        <button>Trigger</button>
      </Popover>,
    )
    expect(screen.getByText('Initial content')).toBeInTheDocument()
  })

  it('toggles on Enter key', () => {
    const { container } = render(
      <Popover renderPopover={<span>Keyboard content</span>}>
        <button>Trigger</button>
      </Popover>,
    )
    fireEvent.keyDown(container.firstChild!, { key: 'Enter' })
    expect(screen.getByText('Keyboard content')).toBeInTheDocument()
  })

  it('toggles on Space key', () => {
    const { container } = render(
      <Popover renderPopover={<span>Space content</span>}>
        <button>Trigger</button>
      </Popover>,
    )
    fireEvent.keyDown(container.firstChild!, { key: ' ' })
    expect(screen.getByText('Space content')).toBeInTheDocument()
  })

  it('renders arrow by default', () => {
    const { container } = render(
      <Popover renderPopover={<span>Content</span>} initialOpen>
        <button>Trigger</button>
      </Popover>,
    )
    const arrowSpans = container.querySelectorAll('[aria-hidden="true"]')
    expect(arrowSpans.length).toBeGreaterThan(0)
  })

  it('hides arrow when enableArrow is false', () => {
    render(
      <Popover renderPopover={<span>Content</span>} initialOpen enableArrow={false}>
        <button>Trigger</button>
      </Popover>,
    )
    const dialog = screen.getByRole('dialog')
    // No arrow span with border classes inside the dialog
    const arrowSpan = dialog.querySelector('span.absolute.-top-\\[9px\\]')
    expect(arrowSpan).not.toBeInTheDocument()
  })

  it('applies popoverLabel as aria-label on dialog', () => {
    render(
      <Popover renderPopover={<span>Content</span>} initialOpen popoverLabel="My popup">
        <button>Trigger</button>
      </Popover>,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'My popup')
  })

  it('applies ariaLabel to trigger', () => {
    const { container } = render(
      <Popover renderPopover={<span>Content</span>} ariaLabel="Open menu">
        <button>Trigger</button>
      </Popover>,
    )
    expect(container.firstChild).toHaveAttribute('aria-label', 'Open menu')
  })
})
