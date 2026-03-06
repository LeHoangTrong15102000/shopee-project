import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/utils/testUtils'
import Popover from './Popover'

describe('Popover', () => {
  it('renders children', () => {
    renderWithProviders(
      <Popover renderPopover={<div>Popover content</div>}>
        <button>Trigger</button>
      </Popover>
    )

    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument()
  })

  it('shows popover on mouse enter', async () => {
    const { user } = renderWithProviders(
      <Popover renderPopover={<div>Popover content</div>}>
        <button>Trigger</button>
      </Popover>
    )

    const trigger = screen.getByRole('button', { name: 'Trigger' })
    await user.hover(trigger)

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument()
    })
  })

  it('hides popover on mouse leave', async () => {
    const { user } = renderWithProviders(
      <Popover renderPopover={<div>Popover content</div>}>
        <button>Trigger</button>
      </Popover>
    )

    const trigger = screen.getByRole('button', { name: 'Trigger' })
    await user.hover(trigger)

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument()
    })

    await user.unhover(trigger)

    await waitFor(() => {
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument()
    })
  })

  it('renders with initialOpen=true', () => {
    renderWithProviders(
      <Popover renderPopover={<div>Popover content</div>} initialOpen={true}>
        <button>Trigger</button>
      </Popover>
    )

    expect(screen.getByText('Popover content')).toBeInTheDocument()
  })

  it('renders with custom element using as prop', () => {
    renderWithProviders(
      <Popover renderPopover={<div>Popover content</div>} as='span'>
        <button>Trigger</button>
      </Popover>
    )

    expect(screen.getByRole('button', { name: 'Trigger' }).parentElement?.tagName).toBe('SPAN')
  })
})
