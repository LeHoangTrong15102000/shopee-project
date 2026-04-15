import http from 'src/utils/http'
import type { SuccessResponse, ImportResult, ImportStats } from 'src/types'

const importApi = {
  importProducts: () => http.post<SuccessResponse<ImportResult>>('admin/import/products'),

  getImportStats: () => http.get<SuccessResponse<ImportStats>>('admin/import/products/stats'),
}

export default importApi
