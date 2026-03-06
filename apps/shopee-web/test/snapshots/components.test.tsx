import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import React from 'react'
import Input from '../../src/components/Input'
import Button from '../../src/components/Button'
import Pagination from '../../src/components/Pagination'
import ProductRating from '../../src/components/ProductRating'
import Footer from '../../src/components/Footer'
import { SkeletonBase, ProductCardSkeleton, NotificationSkeleton } from '../../src/components/Skeleton'

// Wrapper component để cung cấp context cần thiết
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
  </BrowserRouter>
)

describe('Component Snapshots', () => {
  test('Input component renders correctly', () => {
    const { container } = render(
      <TestWrapper>
        <Input placeholder='Test input' name='test' />
      </TestWrapper>
    )
    expect(container.firstChild).toMatchSnapshot('Input-default')
  })

  test('Input component with error state', () => {
    const { container } = render(
      <TestWrapper>
        <Input placeholder='Test input' errorMessage='This field is required' name='test-error' />
      </TestWrapper>
    )
    expect(container.firstChild).toMatchSnapshot('Input-error')
  })

  test('Button component renders correctly', () => {
    const { container } = render(
      <TestWrapper>
        <Button>Click me</Button>
      </TestWrapper>
    )
    expect(container.firstChild).toMatchSnapshot('Button-default')
  })

  test('Button component disabled state', () => {
    const { container } = render(
      <TestWrapper>
        <Button disabled>Disabled button</Button>
      </TestWrapper>
    )
    expect(container.firstChild).toMatchSnapshot('Button-disabled')
  })

  test('Pagination component renders correctly', () => {
    const { container } = render(
      <TestWrapper>
        <Pagination pageSize={20} />
      </TestWrapper>
    )
    expect(container.firstChild).toMatchSnapshot('Pagination-default')
  })

  test('ProductRating component renders correctly', () => {
    const { container } = render(
      <TestWrapper>
        <ProductRating rating={4.5} />
      </TestWrapper>
    )
    expect(container.firstChild).toMatchSnapshot('ProductRating-default')
  })

  test('Footer component renders correctly', () => {
    const { container } = render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    )
    expect(container.firstChild).toMatchSnapshot('Footer-default')
  })

  test('SkeletonBase component renders correctly', () => {
    const { container } = render(
      <TestWrapper>
        <SkeletonBase className='h-4 w-full' />
      </TestWrapper>
    )
    expect(container.firstChild).toMatchSnapshot('SkeletonBase-default')
  })

  test('ProductCardSkeleton component renders correctly', () => {
    const { container } = render(
      <TestWrapper>
        <ProductCardSkeleton />
      </TestWrapper>
    )
    expect(container.firstChild).toMatchSnapshot('ProductCardSkeleton-default')
  })

  test('NotificationSkeleton component renders correctly', () => {
    const { container } = render(
      <TestWrapper>
        <NotificationSkeleton count={2} />
      </TestWrapper>
    )
    expect(container.firstChild).toMatchSnapshot('NotificationSkeleton-default')
  })
})
