import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from 'src/utils/testUtils';
import Popover from './Popover';

// Mock framer-motion so AnimatePresence/motion.div render synchronously
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe('Popover', () => {
  it('renders children', () => {
    renderWithProviders(
      <Popover renderPopover={<div>Popover content</div>}>
        <button>Trigger</button>
      </Popover>,
    );

    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
  });

  it('shows popover on mouse enter', async () => {
    const { user } = renderWithProviders(
      <Popover renderPopover={<div>Popover content</div>}>
        <button>Trigger</button>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
  });

  it('hides popover on mouse leave', async () => {
    const { user } = renderWithProviders(
      <Popover renderPopover={<div>Popover content</div>}>
        <button>Trigger</button>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });

    await user.unhover(trigger);

    await waitFor(() => {
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });
  });

  it('renders with initialOpen=true', () => {
    renderWithProviders(
      <Popover renderPopover={<div>Popover content</div>} initialOpen={true}>
        <button>Trigger</button>
      </Popover>,
    );

    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('renders with custom element using as prop', () => {
    renderWithProviders(
      <Popover renderPopover={<div>Popover content</div>} as="span">
        <button>Trigger</button>
      </Popover>,
    );

    expect(screen.getByRole('button', { name: 'Trigger' }).parentElement?.tagName).toBe('SPAN');
  });

  it('opens popover on Enter key', async () => {
    const { user } = renderWithProviders(
      <Popover
        renderPopover={<div>Popover content</div>}
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    trigger.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
  });

  it('opens popover on Space key', async () => {
    const { user } = renderWithProviders(
      <Popover
        renderPopover={<div>Popover content</div>}
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    trigger.focus();
    await user.keyboard(' ');

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
  });

  it('toggles popover closed on second Enter', async () => {
    const { user } = renderWithProviders(
      <Popover
        renderPopover={<div>Popover content</div>}
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    trigger.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });
  });

  it('closes popover on Escape and returns focus to trigger', async () => {
    const { user } = renderWithProviders(
      <Popover
        renderPopover={<div>Popover content</div>}
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('opens popover on click (touch fallback)', async () => {
    renderWithProviders(
      <Popover
        renderPopover={<div>Popover content</div>}
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    // Use fireEvent.click to simulate touch tap without triggering mouseEnter
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
  });

  it('closes popover on click outside', async () => {
    renderWithProviders(
      <Popover
        renderPopover={<div>Popover content</div>}
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });

    // Click outside
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });
  });

  it('sets aria-expanded to true when popover opens', async () => {
    const { user } = renderWithProviders(
      <Popover
        renderPopover={<div>Popover content</div>}
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.hover(trigger);

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('has aria-haspopup="dialog" on trigger', () => {
    renderWithProviders(
      <Popover
        renderPopover={<div>Popover content</div>}
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('links aria-controls to region id when open', async () => {
    const { user } = renderWithProviders(
      <Popover
        renderPopover={<div>Popover content</div>}
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
        popoverLabel="Test dialog"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    expect(trigger).not.toHaveAttribute('aria-controls');

    await user.hover(trigger);

    await waitFor(() => {
      const region = screen.getByRole('dialog', { name: 'Test dialog' });
      expect(region).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-controls', region.id);
    });
  });

  it('keeps popover open when mouse moves from trigger to popover content', async () => {
    const { user } = renderWithProviders(
      <Popover
        renderPopover={<div>Popover content</div>}
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
        popoverLabel="Test dialog"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });

    // Move mouse into the floating popover content
    const region = screen.getByRole('dialog', { name: 'Test dialog' });
    fireEvent.mouseEnter(region);

    // Popover should remain open
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('moves focus to first focusable element inside popover when opened via keyboard', async () => {
    const { user } = renderWithProviders(
      <Popover
        renderPopover={
          <div>
            <button>Inner button</button>
          </div>
        }
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
        popoverLabel="Test dialog"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    trigger.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Inner button' })).toHaveFocus();
    });
  });

  it('focuses tabIndex={-1} fallback when no interactive children exist', async () => {
    const { user } = renderWithProviders(
      <Popover
        renderPopover={
          <div tabIndex={-1} data-testid="info-container">
            <p>Info only content</p>
          </div>
        }
        role="button"
        tabIndex={0}
        ariaLabel="Test trigger"
        popoverLabel="Test dialog"
      >
        <span>Trigger</span>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Test trigger' });
    trigger.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('info-container')).toHaveFocus();
    });
  });
});
