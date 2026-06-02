import { http, HttpResponse } from 'msw'
import { mockAuditLogs } from './data/audit-log.mock'
import { API_URL } from './msw-utils'

const auditLogHandlers = [
  http.get(`${API_URL}/admin/audit-logs`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    const status = url.searchParams.get('status')
    const action = url.searchParams.get('action')
    const resource = url.searchParams.get('resource')
    const actorId = url.searchParams.get('actorId')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    let filtered = mockAuditLogs

    if (status && status !== 'all') {
      filtered = filtered.filter((e) => e.status === status)
    }
    if (action) {
      filtered = filtered.filter((e) => e.action === action)
    }
    if (resource) {
      filtered = filtered.filter((e) => e.resource === resource)
    }
    if (actorId) {
      filtered = filtered.filter((e) => e.actor.userId === actorId)
    }
    if (from) {
      const fromDate = new Date(from).getTime()
      filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= fromDate)
    }
    if (to) {
      const toDate = new Date(to).getTime()
      filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= toDate)
    }

    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)

    // Return only list-shape fields (no before/after/diff)
    const items = paginated.map(
      ({ before: _b, after: _a, diff: _d, userAgent: _ua, errorMessage: _em, ...item }) => item,
    )

    return HttpResponse.json({
      message: 'Lấy danh sách nhật ký thành công',
      data: {
        items,
        pagination: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit) || 1,
        },
      },
    })
  }),

  http.get(`${API_URL}/admin/audit-logs/:id`, ({ params }) => {
    const entry = mockAuditLogs.find((e) => e._id === params.id)
    if (!entry) {
      return HttpResponse.json({ message: 'Không tìm thấy bản ghi' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Thành công', data: entry })
  }),
]

export default auditLogHandlers
