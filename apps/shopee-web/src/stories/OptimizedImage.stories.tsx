import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import OptimizedImage from 'src/components/OptimizedImage'

const meta: Meta<typeof OptimizedImage> = {
  title: 'Components/OptimizedImage',
  component: OptimizedImage,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    aspectRatio: {
      control: 'select',
      options: ['1:1', '16:9', '4:3', '3:2', 'auto']
    },
    objectFit: {
      control: 'select',
      options: ['cover', 'contain', 'fill', 'none']
    },
    loading: {
      control: 'select',
      options: ['lazy', 'eager']
    },
    showSkeleton: { control: 'boolean' },
    blurPlaceholder: { control: 'boolean' }
  },
  args: {
    onLoad: fn(),
    onError: fn()
  }
}

export default meta
type Story = StoryObj<typeof OptimizedImage>

export const Default: Story = {
  args: {
    src: 'https://picsum.photos/400/400',
    alt: 'Sample image',
    width: 400,
    height: 400
  }
}

export const WithAspectRatio: Story = {
  args: {
    src: 'https://picsum.photos/400/400',
    alt: 'Aspect ratio demo'
  },
  render: () => (
    <div className='flex flex-col gap-8'>
      <div className='w-[300px]'>
        <p className='mb-2 text-sm font-medium'>Aspect Ratio 1:1</p>
        <OptimizedImage src='https://picsum.photos/400/400' alt='1:1 aspect ratio' aspectRatio='1:1' />
      </div>
      <div className='w-[300px]'>
        <p className='mb-2 text-sm font-medium'>Aspect Ratio 16:9</p>
        <OptimizedImage src='https://picsum.photos/400/225' alt='16:9 aspect ratio' aspectRatio='16:9' />
      </div>
      <div className='w-[300px]'>
        <p className='mb-2 text-sm font-medium'>Aspect Ratio 4:3</p>
        <OptimizedImage src='https://picsum.photos/400/300' alt='4:3 aspect ratio' aspectRatio='4:3' />
      </div>
    </div>
  )
}

export const WithSkeleton: Story = {
  args: {
    src: 'https://picsum.photos/400/400?random=1',
    alt: 'Image with skeleton loading',
    showSkeleton: true,
    aspectRatio: '1:1',
    containerClassName: 'w-[300px]'
  }
}

export const WithFallback: Story = {
  args: {
    src: 'https://invalid-url-test.com/image.jpg',
    alt: 'Image with fallback',
    fallbackSrc: 'https://picsum.photos/200/200?grayscale',
    width: 200,
    height: 200
  }
}

export const LazyLoading: Story = {
  args: {
    src: 'https://picsum.photos/300/200',
    alt: 'Lazy loading demo'
  },
  render: () => (
    <div className='flex flex-col gap-4'>
      <p className='text-sm text-gray-600'>Scroll down to see lazy loading in action</p>
      <div className='h-[200px] overflow-y-auto border border-gray-300 p-4'>
        <div className='flex flex-col gap-4'>
          {Array.from({ length: 10 }, (_, i) => (
            <OptimizedImage
              key={i}
              src={`https://picsum.photos/300/200?random=${i}`}
              alt={`Lazy loaded image ${i + 1}`}
              loading='lazy'
              aspectRatio='16:9'
              containerClassName='w-[280px]'
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export const ObjectFitVariants: Story = {
  args: {
    src: 'https://picsum.photos/400/300',
    alt: 'Object fit demo'
  },
  render: () => (
    <div className='flex flex-col gap-8'>
      <div className='w-[200px]'>
        <p className='mb-2 text-sm font-medium'>Object Fit: cover</p>
        <OptimizedImage src='https://picsum.photos/400/300' alt='Cover fit' objectFit='cover' aspectRatio='1:1' />
      </div>
      <div className='w-[200px]'>
        <p className='mb-2 text-sm font-medium'>Object Fit: contain</p>
        <OptimizedImage
          src='https://picsum.photos/400/300'
          alt='Contain fit'
          objectFit='contain'
          aspectRatio='1:1'
          containerClassName='bg-gray-100'
        />
      </div>
      <div className='w-[200px]'>
        <p className='mb-2 text-sm font-medium'>Object Fit: fill</p>
        <OptimizedImage src='https://picsum.photos/400/300' alt='Fill fit' objectFit='fill' aspectRatio='1:1' />
      </div>
      <div className='w-[200px]'>
        <p className='mb-2 text-sm font-medium'>Object Fit: none</p>
        <OptimizedImage
          src='https://picsum.photos/400/300'
          alt='None fit'
          objectFit='none'
          aspectRatio='1:1'
          containerClassName='bg-gray-100'
        />
      </div>
    </div>
  )
}
