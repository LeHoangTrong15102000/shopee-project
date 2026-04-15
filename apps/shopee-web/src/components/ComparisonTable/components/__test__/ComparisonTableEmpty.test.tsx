import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import ComparisonTableEmpty from '../ComparisonTableEmpty'

const wrap = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>)

describe('ComparisonTableEmpty', () => {
  it('renders empty state message', () => {
    wrap(<ComparisonTableEmpty />)
    const region = screen.getByRole('region')
    expect(region).toBeInTheDocument()
  })

  it('renders link to browse products', () => {
    wrap(<ComparisonTableEmpty />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('applies custom className', () => {
    wrap(<ComparisonTableEmpty className="custom-class" />)
    const region = screen.getByRole('region')
    expect(region.className).toContain('custom-class')
  })

  it('renders SVG icon', () => {
    wrap(<ComparisonTableEmpty />)
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
