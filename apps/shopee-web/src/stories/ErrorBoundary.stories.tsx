import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import EmptyState, { EmptyCart, EmptySearch, EmptyWishlist, EmptyOrders } from 'src/components/ErrorBoundary/EmptyState'
import ErrorFallback from 'src/components/ErrorBoundary/ErrorFallback'
import NetworkError from 'src/components/ErrorBoundary/NetworkError'

const emptyStateMeta: Meta<typeof EmptyState> = {
  title: 'ErrorBoundary/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title text'
    },
    description: {
      control: 'text',
      description: 'Description text'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
}

export default emptyStateMeta
type EmptyStateStory = StoryObj<typeof EmptyState>

export const EmptyStateDefault: EmptyStateStory = {
  args: {
    title: 'Không có dữ liệu',
    description: 'Hiện tại chưa có dữ liệu nào để hiển thị.',
    action: {
      label: 'Tải lại',
      onClick: fn()
    }
  }
}

export const EmptyCartState: StoryObj<typeof EmptyCart> = {
  render: () => <EmptyCart onShopNow={fn()} />
}

export const EmptySearchState: StoryObj<typeof EmptySearch> = {
  render: () => <EmptySearch searchTerm='iPhone 15 Pro Max' onClear={fn()} />
}

export const EmptyWishlistState: StoryObj<typeof EmptyWishlist> = {
  render: () => <EmptyWishlist onExplore={fn()} />
}

export const EmptyOrdersState: StoryObj<typeof EmptyOrders> = {
  render: () => <EmptyOrders onShopNow={fn()} />
}

const errorFallbackMeta: Meta<typeof ErrorFallback> = {
  title: 'ErrorBoundary/ErrorFallback',
  component: ErrorFallback,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
}

type ErrorFallbackStory = StoryObj<typeof ErrorFallback>

export const ErrorFallbackDefault: ErrorFallbackStory = {
  parameters: errorFallbackMeta.parameters,
  args: {
    error: new Error('Failed to fetch data from server'),
    resetErrorBoundary: fn(),
    title: 'Đã xảy ra lỗi',
    message: 'Không thể tải dữ liệu. Vui lòng thử lại.',
    showRetry: true,
    retryText: 'Thử lại'
  }
}

const networkErrorMeta: Meta<typeof NetworkError> = {
  title: 'ErrorBoundary/NetworkError',
  component: NetworkError,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
}

type NetworkErrorStory = StoryObj<typeof NetworkError>

export const NetworkErrorDefault: NetworkErrorStory = {
  parameters: networkErrorMeta.parameters,
  args: {
    onRetry: fn(),
    autoRetry: false
  }
}

export const NetworkErrorAutoRetry: NetworkErrorStory = {
  parameters: networkErrorMeta.parameters,
  args: {
    onRetry: fn(),
    autoRetry: true,
    autoRetryInterval: 5000,
    maxAutoRetries: 3
  }
}
