import { Types } from 'mongoose'
import { PageModel, IPage, PageStatus } from '@database/models/page.model'

export interface CreatePageDTO {
  slug: string
  title: string
  status?: PageStatus
  blocks?: IPage['blocks']
  meta?: IPage['meta']
}

export interface UpdatePageDTO {
  slug?: string
  title?: string
  status?: PageStatus
  blocks?: IPage['blocks']
  meta?: IPage['meta']
  publishedAt?: Date | null
}

export interface PageFilter {
  status?: PageStatus
}

export interface IPageRepository {
  create(data: CreatePageDTO): Promise<IPage>
  findById(id: string | Types.ObjectId): Promise<IPage | null>
  findBySlug(slug: string): Promise<IPage | null>
  findAll(filter?: PageFilter): Promise<IPage[]>
  update(id: string | Types.ObjectId, data: UpdatePageDTO): Promise<IPage | null>
  delete(id: string | Types.ObjectId): Promise<IPage | null>
}

export class PageRepository implements IPageRepository {
  async create(data: CreatePageDTO): Promise<IPage> {
    const page = new PageModel(data)
    const saved = await page.save()
    return saved.toObject() as IPage
  }

  async findById(id: string | Types.ObjectId): Promise<IPage | null> {
    return PageModel.findById(id).lean<IPage | null>()
  }

  async findBySlug(slug: string): Promise<IPage | null> {
    return PageModel.findOne({ slug }).lean<IPage | null>()
  }

  async findAll(filter?: PageFilter): Promise<IPage[]> {
    const query: Record<string, unknown> = {}
    if (filter?.status) {
      query.status = filter.status
    }
    return PageModel.find(query).sort({ createdAt: -1 }).lean<IPage[]>()
  }

  async update(id: string | Types.ObjectId, data: UpdatePageDTO): Promise<IPage | null> {
    return PageModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean<IPage | null>()
  }

  async delete(id: string | Types.ObjectId): Promise<IPage | null> {
    return PageModel.findByIdAndDelete(id).lean<IPage | null>()
  }
}
