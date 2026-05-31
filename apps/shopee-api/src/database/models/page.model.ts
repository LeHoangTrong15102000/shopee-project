import mongoose, { Schema } from 'mongoose'

export const PAGE_STATUSES = ['draft', 'published'] as const
export type PageStatus = (typeof PAGE_STATUSES)[number]

export const BLOCK_TYPES = [
  'hero_banner',
  'product_carousel',
  'category_grid',
  'text_content',
  'image_gallery',
  'countdown_timer',
  'video_embed',
  'spacer',
] as const
export type BlockType = (typeof BLOCK_TYPES)[number]

export interface IPageBlock {
  type: BlockType
  data: Record<string, unknown>
}

export interface IPageMeta {
  title?: string
  description?: string
  ogImage?: string
}

export interface IPage {
  _id: mongoose.Types.ObjectId
  slug: string
  title: string
  status: PageStatus
  blocks: IPageBlock[]
  meta: IPageMeta
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const PageBlockSchema = new Schema<IPageBlock>(
  {
    type: { type: String, enum: BLOCK_TYPES, required: true },
    data: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { _id: false },
)

const PageMetaSchema = new Schema<IPageMeta>(
  {
    title: { type: String, maxlength: 200 },
    description: { type: String, maxlength: 500 },
    ogImage: { type: String, maxlength: 1000 },
  },
  { _id: false },
)

const PageSchema = new Schema<IPage>(
  {
    slug: { type: String, required: true, maxlength: 200 },
    title: { type: String, required: true, maxlength: 200 },
    status: { type: String, enum: PAGE_STATUSES, required: true, default: 'draft' },
    blocks: { type: [PageBlockSchema], required: true, default: [] },
    meta: { type: PageMetaSchema, required: true, default: () => ({}) },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

PageSchema.index({ slug: 1 }, { unique: true })
PageSchema.index({ status: 1 })

export const PageModel = mongoose.model<IPage>('pages', PageSchema)
