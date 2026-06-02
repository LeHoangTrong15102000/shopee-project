import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { adminPaginationQuerySchema } from './admin-common.schema'
import { BLOCK_TYPES } from '@database/models/page.model'

// ─── Block data schemas ───────────────────────────────────────────────────────

const heroBannerDataSchema = z.object({
  imageUrl: z.string().url(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  backgroundColor: z.string().optional(),
})

const productCarouselQuerySchema = z.object({
  type: z.enum(['category', 'tag', 'bestseller']),
  categoryId: z.string().optional(),
  tag: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
})

const productCarouselDataSchema = z
  .object({
    title: z.string().min(1),
    productIds: z.array(z.string()).optional(),
    query: productCarouselQuerySchema.optional(),
  })
  .refine((d) => d.productIds !== undefined || d.query !== undefined, {
    message: 'product_carousel block requires either productIds or query',
  })

const categoryGridDataSchema = z.object({
  title: z.string().min(1),
  categoryIds: z.array(z.string()).min(1),
  columns: z.number().int().min(1).max(12),
})

const textContentDataSchema = z.object({
  content: z.string().min(1),
  alignment: z.enum(['left', 'center', 'right']),
})

const imageGalleryDataSchema = z.object({
  images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })).min(1),
  layout: z.enum(['grid', 'slider']),
  columns: z.number().int().min(1).max(12).optional(),
})

const countdownTimerDataSchema = z.object({
  title: z.string().min(1),
  targetDate: z.string().datetime({ message: 'targetDate must be a valid ISO 8601 datetime' }),
  style: z.enum(['default', 'compact']).optional(),
})

const videoEmbedDataSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  autoplay: z.boolean().optional(),
})

const spacerDataSchema = z.object({
  height: z.number().int().min(1),
})

// ─── Discriminated block schema ───────────────────────────────────────────────

export const blockSchema = z
  .object({
    type: z.enum(BLOCK_TYPES),
    data: z.record(z.string(), z.unknown()),
  })
  .superRefine((block, ctx) => {
    const parseResult = (() => {
      switch (block.type) {
        case 'hero_banner':
          return heroBannerDataSchema.safeParse(block.data)
        case 'product_carousel':
          return productCarouselDataSchema.safeParse(block.data)
        case 'category_grid':
          return categoryGridDataSchema.safeParse(block.data)
        case 'text_content':
          return textContentDataSchema.safeParse(block.data)
        case 'image_gallery':
          return imageGalleryDataSchema.safeParse(block.data)
        case 'countdown_timer':
          return countdownTimerDataSchema.safeParse(block.data)
        case 'video_embed':
          return videoEmbedDataSchema.safeParse(block.data)
        case 'spacer':
          return spacerDataSchema.safeParse(block.data)
        default:
          return {
            success: false,
            error: { issues: [{ message: `Unknown block type: ${block.type}` }] },
          }
      }
    })()

    if (!parseResult.success) {
      for (const issue of parseResult.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Block type '${block.type}' data error: ${issue.message}`,
          path: ['data'],
        })
      }
    }
  })

// ─── Page meta schema ─────────────────────────────────────────────────────────

const pageMetaSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  ogImage: z.string().max(1000).optional(),
})

// ─── Route schemas ────────────────────────────────────────────────────────────

/**
 * POST /admin/pages
 */
export const createPageSchema = z.object({
  body: z.object({
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens'),
    title: z.string().min(1).max(200),
    blocks: z.array(blockSchema).optional().default([]),
    meta: pageMetaSchema.optional().default({}),
  }),
})

/**
 * PUT /admin/pages/:id
 */
export const updatePageSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens')
      .optional(),
    title: z.string().min(1).max(200).optional(),
    blocks: z.array(blockSchema).optional(),
    meta: pageMetaSchema.optional(),
  }),
})

/**
 * GET /admin/pages
 */
export const listPagesSchema = z.object({
  query: adminPaginationQuerySchema.extend({
    status: z.enum(['draft', 'published']).optional(),
  }),
})

/**
 * DELETE /admin/pages/:id and PATCH /admin/pages/:id/publish
 */
export const pageIdParamSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
})

/**
 * GET /pages/:slug
 */
export const pageSlugParamSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreatePageInput = z.infer<typeof createPageSchema>['body']
export type UpdatePageInput = z.infer<typeof updatePageSchema>['body']
export type ListPagesQuery = z.infer<typeof listPagesSchema>['query']
