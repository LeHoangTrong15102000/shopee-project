import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import ImageWithFallback from 'src/components/ImageWithFallback'

const meta: Meta<typeof ImageWithFallback> = {
  title: 'Components/ImageWithFallback',
  component: ImageWithFallback,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'Source URL of the image'
    },
    alt: {
      control: 'text',
      description: 'Alt text for the image'
    },
    fallbackSrc: {
      control: 'text',
      description: 'Fallback image URL when the main image fails to load'
    },
    onLoadError: {
      action: 'onLoadError',
      description: 'Callback function when image fails to load'
    }
  },
  args: {
    onLoadError: fn()
  }
}

export default meta
type Story = StoryObj<typeof ImageWithFallback>

export const Default: Story = {
  args: {
    src: 'https://picsum.photos/300/300',
    alt: 'Sample image that loads successfully',
    width: 300,
    height: 300
  }
}

export const WithFallback: Story = {
  args: {
    src: 'https://invalid-url-test.com/image.jpg',
    alt: 'Image with fallback displayed',
    width: 300,
    height: 300
  },
  parameters: {
    docs: {
      description: {
        story: 'When the image URL is invalid, the component automatically displays the default fallback image.'
      }
    }
  }
}

export const CustomFallback: Story = {
  args: {
    src: 'https://invalid-url-test.com/image.jpg',
    alt: 'Image with custom fallback',
    fallbackSrc: 'https://picsum.photos/200/200?grayscale',
    width: 300,
    height: 300
  },
  parameters: {
    docs: {
      description: {
        story: 'You can provide a custom fallback image URL using the `fallbackSrc` prop.'
      }
    }
  }
}

export const WithLoadError: Story = {
  args: {
    src: 'https://invalid-url-test.com/image.jpg',
    alt: 'Image demonstrating onLoadError callback',
    width: 300,
    height: 300,
    onLoadError: fn()
  },
  parameters: {
    docs: {
      description: {
        story:
          'The `onLoadError` callback is triggered when the image fails to load. Check the Actions panel to see the error callback being fired.'
      }
    }
  },
  render: (args) => (
    <div className='flex flex-col items-center gap-4'>
      <ImageWithFallback {...args} />
      <p className='text-sm text-gray-500'>Check the Actions panel below to see the onLoadError callback</p>
    </div>
  )
}
