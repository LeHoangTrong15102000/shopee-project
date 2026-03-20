/// <reference types="jest" />
import {
  dashboardOverviewSchema, dashboardRevenueSchema, dashboardRevenueByCategorySchema,
  dashboardRevenueByProductSchema, dashboardOrderTrendSchema, dashboardUserGrowthSchema,
  dashboardTopBuyersSchema,
} from '@schemas/admin-dashboard.schema'

describe('Admin Dashboard Schemas', () => {
  it('dashboardOverviewSchema accepts empty query', () => {
    expect(dashboardOverviewSchema.safeParse({ query: {} }).success).toBe(true)
    expect(dashboardOverviewSchema.safeParse({}).success).toBe(true)
  })

  it('dashboardRevenueSchema accepts period', () => {
    expect(dashboardRevenueSchema.safeParse({ query: { period: '7d' } }).success).toBe(true)
  })

  it('dashboardRevenueSchema accepts date range', () => {
    expect(dashboardRevenueSchema.safeParse({ query: { start_date: '2024-01-01', end_date: '2024-12-31' } }).success).toBe(true)
  })

  it('dashboardRevenueSchema rejects invalid period', () => {
    expect(dashboardRevenueSchema.safeParse({ query: { period: 'invalid' } }).success).toBe(false)
  })

  it('dashboardRevenueByCategorySchema accepts period', () => {
    expect(dashboardRevenueByCategorySchema.safeParse({ query: { period: '30d' } }).success).toBe(true)
  })

  it('dashboardRevenueByProductSchema accepts limit', () => {
    expect(dashboardRevenueByProductSchema.safeParse({ query: { limit: 5 } }).success).toBe(true)
  })

  it('dashboardOrderTrendSchema accepts period', () => {
    expect(dashboardOrderTrendSchema.safeParse({ query: { period: '90d' } }).success).toBe(true)
  })

  it('dashboardUserGrowthSchema accepts period', () => {
    expect(dashboardUserGrowthSchema.safeParse({ query: { period: '1y' } }).success).toBe(true)
  })

  it('dashboardTopBuyersSchema accepts period and limit', () => {
    expect(dashboardTopBuyersSchema.safeParse({ query: { period: '7d', limit: 20 } }).success).toBe(true)
  })
})
