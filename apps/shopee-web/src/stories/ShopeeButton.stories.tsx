import type { Meta, StoryObj } from '@storybook/react'
import { BrowserRouter } from 'react-router'
import Button from 'src/components/Button'

const meta: Meta<typeof Button> = {
  title: 'Shopee/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Show loading spinner'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button'
    },
    className: {
      control: 'text',
      description: 'Tailwind CSS classes'
    },
    children: {
      control: 'text',
      description: 'Button content'
    },
    as: {
      control: 'select',
      options: ['button', 'link'],
      description: 'Render as button or link'
    }
  }
}

export default meta
type Story = StoryObj<typeof Button>

const primaryClassName = 'bg-[#ee4d2d] text-white px-4 py-2 rounded-sm hover:bg-[#d73211] flex items-center'
const secondaryClassName = 'bg-gray-200 text-gray-800 px-4 py-2 rounded-sm hover:bg-gray-300 flex items-center'

export const Default: Story = {
  args: {
    children: 'Button',
    className: primaryClassName
  }
}

export const Loading: Story = {
  args: {
    children: 'Loading...',
    className: primaryClassName,
    isLoading: true
  }
}

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    className: `${primaryClassName} opacity-50`,
    disabled: true
  }
}

export const AsLink: Story = {
  args: {
    children: 'Go to Home',
    className: primaryClassName,
    as: 'link',
    to: '/'
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    )
  ]
}

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    className: primaryClassName
  }
}

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    className: secondaryClassName
  }
}

export const WithIcon: Story = {
  args: {
    className: primaryClassName,
    children: (
      <>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='mr-2 h-5 w-5'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z'
          />
        </svg>
        Add to Cart
      </>
    )
  }
}
