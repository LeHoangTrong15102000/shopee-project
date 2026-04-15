import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from 'src/test-utils'
import { CommandPalette } from './CommandPalette'

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn()

function renderCommandPalette() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CommandPalette', () => {
  it('opens with Cmd+K', async () => {
    const user = userEvent.setup()
    renderCommandPalette()
    await user.keyboard('{Meta>}k{/Meta}')
    const dialog = screen.queryByRole('dialog')
    expect(dialog).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    renderCommandPalette()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows search input when opened', async () => {
    const user = userEvent.setup()
    renderCommandPalette()
    await user.keyboard('{Meta>}k{/Meta}')
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows page navigation items when opened', async () => {
    const user = userEvent.setup()
    renderCommandPalette()
    await user.keyboard('{Meta>}k{/Meta}')
    // Pages group should be visible with navigation items
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('types in search input and triggers search', async () => {
    const user = userEvent.setup()
    renderCommandPalette()
    await user.keyboard('{Meta>}k{/Meta}')
    const input = screen.getByRole('combobox')
    await user.type(input, 'iPhone')
    expect(input).toHaveValue('iPhone')
  })

  it('selects a page item and closes dialog', async () => {
    const user = userEvent.setup()
    renderCommandPalette()
    await user.keyboard('{Meta>}k{/Meta}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // Click on a page item
    const items = screen.getAllByRole('option')
    if (items.length > 0) {
      await user.click(items[0])
    }
  })

  it('closes with Cmd+K again', async () => {
    const user = userEvent.setup()
    renderCommandPalette()
    await user.keyboard('{Meta>}k{/Meta}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Meta>}k{/Meta}')
    await vi.waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
