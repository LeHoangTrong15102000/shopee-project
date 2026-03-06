import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ChatbotWidget from 'src/components/ChatbotWidget'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const meta: Meta<typeof ChatbotWidget> = {
  title: 'Components/ChatbotWidget',
  component: ChatbotWidget,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className='min-h-screen bg-gray-100 p-4'>
          <Story />
        </div>
      </QueryClientProvider>
    )
  ]
}

export default meta

type Story = StoryObj<typeof ChatbotWidget>

export const Default: Story = {}
