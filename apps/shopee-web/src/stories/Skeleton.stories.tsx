import type { Meta, StoryObj } from '@storybook/react'
import {
  SkeletonBase,
  ProductCardSkeleton,
  CartItemSkeleton,
  NotificationSkeleton,
  ProductDetailSkeleton,
  ProductListSkeleton
} from 'src/components/Skeleton'

const meta = {
  title: 'Components/Skeleton',
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className='min-h-[200px] bg-gray-100 p-4'>
        <Story />
      </div>
    )
  ]
} satisfies Meta

export default meta

export const SkeletonBaseDefault: StoryObj = {
  render: () => (
    <div className='space-y-4 rounded-sm bg-white p-4'>
      <div>
        <p className='mb-2 text-sm text-gray-500'>Small (h-4 w-20)</p>
        <SkeletonBase className='h-4 w-20' />
      </div>
      <div>
        <p className='mb-2 text-sm text-gray-500'>Medium (h-6 w-40)</p>
        <SkeletonBase className='h-6 w-40' />
      </div>
      <div>
        <p className='mb-2 text-sm text-gray-500'>Large (h-8 w-60)</p>
        <SkeletonBase className='h-8 w-60' />
      </div>
      <div>
        <p className='mb-2 text-sm text-gray-500'>Circle (h-12 w-12 rounded-full)</p>
        <SkeletonBase className='h-12 w-12 rounded-full' />
      </div>
      <div>
        <p className='mb-2 text-sm text-gray-500'>Square (h-20 w-20)</p>
        <SkeletonBase className='h-20 w-20' />
      </div>
    </div>
  )
}

export const ProductCard: StoryObj = {
  render: () => (
    <div className='w-[200px]'>
      <ProductCardSkeleton />
    </div>
  )
}

export const CartItem: StoryObj = {
  render: () => (
    <div className='max-w-4xl'>
      <CartItemSkeleton count={2} />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className='bg-gray-100 p-4'>
        <Story />
      </div>
    )
  ]
}

export const Notification: StoryObj = {
  render: () => (
    <div className='w-[350px] overflow-hidden rounded-lg bg-white shadow-lg'>
      <div className='border-b border-gray-100 px-4 py-3'>
        <p className='text-sm font-semibold text-gray-700'>Thông báo mới</p>
      </div>
      <NotificationSkeleton count={3} />
    </div>
  )
}

export const ProductDetail: StoryObj = {
  render: () => <ProductDetailSkeleton />,
  decorators: [
    (Story) => (
      <div className='min-h-screen'>
        <Story />
      </div>
    )
  ],
  parameters: {
    layout: 'fullscreen'
  }
}

export const ProductList: StoryObj = {
  render: () => (
    <div className='container mx-auto'>
      <ProductListSkeleton count={12} />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className='bg-gray-100 p-4'>
        <Story />
      </div>
    )
  ],
  parameters: {
    layout: 'fullscreen'
  }
}
