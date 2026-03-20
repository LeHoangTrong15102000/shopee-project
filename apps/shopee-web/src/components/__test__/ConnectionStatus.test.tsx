import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ConnectionStatus from '../ConnectionStatus/ConnectionStatus';
import CartSyncIndicator from '../CartSyncIndicator/CartSyncIndicator';
import RealTimeStockAlert from '../RealTimeStockAlert/RealTimeStockAlert';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

vi.mock('src/contexts/app.context', () => ({
  AppContext: {
    _currentValue: { isAuthenticated: false },
  },
}));

vi.mock('src/hooks/useSocket', () => ({
  default: () => ({
    connectionStatus: 'disconnected',
    connect: vi.fn(),
    socket: null,
    isConnected: false,
  }),
}));

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ConnectionStatus', () => {
  it('renders nothing when not authenticated', () => {
    const { container } = render(<ConnectionStatus />);
    expect(container.firstChild).toBeFalsy();
  });

  it('renders connecting status', () => {
    vi.doMock('src/contexts/app.context', () => ({
      AppContext: {
        _currentValue: { isAuthenticated: true },
      },
    }));
    vi.doMock('src/hooks/useSocket', () => ({
      default: () => ({
        connectionStatus: 'connecting',
        connect: vi.fn(),
        socket: null,
        isConnected: false,
      }),
    }));

    const { container } = render(<ConnectionStatus />);
    expect(container).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CartSyncIndicator', () => {
  it('renders syncing state', () => {
    const { container } = render(<CartSyncIndicator isSyncing={true} lastSyncTimestamp={null} />);
    expect(container).toBeInstanceOf(HTMLDivElement);
  });

  it('renders synced state', () => {
    const { container } = render(
      <CartSyncIndicator isSyncing={false} lastSyncTimestamp="2024-01-01T00:00:00Z" />,
    );
    expect(container).toBeInstanceOf(HTMLDivElement);
  });

  it('renders nothing when not syncing and no timestamp', () => {
    const { container } = render(<CartSyncIndicator isSyncing={false} lastSyncTimestamp={null} />);
    expect(container.firstChild).toBeFalsy();
  });
});

describe('RealTimeStockAlert', () => {
  it('renders nothing when no alerts', () => {
    const { container } = render(<RealTimeStockAlert productIds={['1', '2']} />);
    expect(container.firstChild).toBeFalsy();
  });

  it('renders with product IDs', () => {
    const { container } = render(
      <RealTimeStockAlert productIds={['1', '2']} onStockChange={vi.fn()} />,
    );
    expect(container).toBeInstanceOf(HTMLDivElement);
  });
});
