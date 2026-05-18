import http from 'src/utils/http'
import type { SuccessResponse, ImportResult, ImportStats } from 'src/types'

const importApi = {
  importProducts: (file: File, dryRun = false) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<SuccessResponse<ImportResult>>(
      `admin/import/products${dryRun ? '?dryRun=true' : ''}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
  },

  getImportStats: () => http.get<SuccessResponse<ImportStats>>('admin/import/products/stats'),
}

export default importApi
