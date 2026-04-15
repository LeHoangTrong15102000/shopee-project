import { http, HttpResponse } from 'msw'
import { mockImportStats } from './data/import.mock'
import { API_URL } from './msw-utils'

const importHandlers = [
  http.post(`${API_URL}/admin/import/products`, () => {
    return HttpResponse.json({
      message: 'Import thành công',
      data: { imported: 150, deleted: 10, locationStats: mockImportStats.locationStats },
    })
  }),

  http.get(`${API_URL}/admin/import/products/stats`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockImportStats })
  }),
]

export default importHandlers
