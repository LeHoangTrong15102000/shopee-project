import { http, HttpResponse } from 'msw'
import {
  mockDashboardOverview,
  mockRevenueData,
  mockOrderTrends,
  mockUserGrowth,
  mockTopProducts,
  mockTopBuyers,
} from './data/dashboard.mock'
import { API_URL } from './msw-utils'

const dashboardHandlers = [
  http.get(`${API_URL}/admin/dashboard/overview`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockDashboardOverview })
  }),

  http.get(`${API_URL}/admin/dashboard/revenue`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockRevenueData })
  }),

  http.get(`${API_URL}/admin/dashboard/revenue/by-category`, () => {
    return HttpResponse.json({
      message: 'Thành công',
      data: [
        { category: 'Điện thoại', revenue: 200000000 },
        { category: 'Laptop', revenue: 150000000 },
      ],
    })
  }),

  http.get(`${API_URL}/admin/dashboard/revenue/by-product`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockTopProducts })
  }),

  http.get(`${API_URL}/admin/dashboard/orders/trend`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockOrderTrends })
  }),

  http.get(`${API_URL}/admin/dashboard/users/growth`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockUserGrowth })
  }),

  http.get(`${API_URL}/admin/dashboard/users/top-buyers`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockTopBuyers })
  }),
]

export default dashboardHandlers
