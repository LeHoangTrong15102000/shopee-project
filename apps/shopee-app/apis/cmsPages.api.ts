import http from '@/utils/http'
import { type ApiResponse } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PageStatus = 'draft' | 'published'

export type BlockType =
  | 'hero_banner'
  | 'product_carousel'
  | 'category_grid'
  | 'text_content'
  | 'image_gallery'
  | 'countdown_timer'
  | 'video_embed'
  | 'spacer'

export interface CmsBlock {
  type: BlockType | string // string allows unknown types to pass through safely
  data: Record<string, unknown>
}

export interface CmsPageMeta {
  title?: string
  description?: string
  ogImage?: string
}

export interface CmsPage {
  _id: string
  slug: string
  title: string
  status: PageStatus
  blocks: CmsBlock[]
  meta: CmsPageMeta
  publishedAt: string | null
  createdAt?: string
  updatedAt?: string
}

// ─── CMS Pages API ────────────────────────────────────────────────────────────

/** GET pages/homepage — returns the published homepage with resolved blocks. */
export async function getHomepage(): Promise<CmsPage> {
  const res = await http.get<ApiResponse<CmsPage>>('pages/homepage')
  return res.data.data
}

/** GET pages/:slug — returns a published page by slug. */
export async function getCmsPage(slug: string): Promise<CmsPage> {
  const res = await http.get<ApiResponse<CmsPage>>(`pages/${encodeURIComponent(slug)}`)
  return res.data.data
}
