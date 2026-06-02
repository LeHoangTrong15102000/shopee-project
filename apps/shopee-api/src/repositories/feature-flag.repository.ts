import { Types } from 'mongoose'
import {
  FeatureFlagModel,
  IFeatureFlag,
  IFeatureFlagConditions,
} from '@database/models/feature-flag.model'

export interface CreateFeatureFlagDTO {
  key: string
  name: string
  description?: string
  enabled?: boolean
  rolloutPercentage?: number
  conditions?: IFeatureFlagConditions
}

export interface UpdateFeatureFlagDTO {
  name?: string
  description?: string
  enabled?: boolean
  rolloutPercentage?: number
  conditions?: IFeatureFlagConditions | null
}

export interface IFeatureFlagRepository {
  create(data: CreateFeatureFlagDTO): Promise<IFeatureFlag>
  findById(id: string | Types.ObjectId): Promise<IFeatureFlag | null>
  findByKey(key: string): Promise<IFeatureFlag | null>
  findAll(): Promise<IFeatureFlag[]>
  update(id: string | Types.ObjectId, data: UpdateFeatureFlagDTO): Promise<IFeatureFlag | null>
  delete(id: string | Types.ObjectId): Promise<IFeatureFlag | null>
  upsertByKey(key: string, data: Omit<CreateFeatureFlagDTO, 'key'>): Promise<IFeatureFlag>
}

export class FeatureFlagRepository implements IFeatureFlagRepository {
  async create(data: CreateFeatureFlagDTO): Promise<IFeatureFlag> {
    const flag = new FeatureFlagModel(data)
    const saved = await flag.save()
    return saved.toObject() as IFeatureFlag
  }

  async findById(id: string | Types.ObjectId): Promise<IFeatureFlag | null> {
    return FeatureFlagModel.findById(id).lean<IFeatureFlag | null>()
  }

  async findByKey(key: string): Promise<IFeatureFlag | null> {
    return FeatureFlagModel.findOne({ key }).lean<IFeatureFlag | null>()
  }

  async findAll(): Promise<IFeatureFlag[]> {
    return FeatureFlagModel.find().sort({ key: 1 }).lean<IFeatureFlag[]>()
  }

  async update(
    id: string | Types.ObjectId,
    data: UpdateFeatureFlagDTO,
  ): Promise<IFeatureFlag | null> {
    return FeatureFlagModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    ).lean<IFeatureFlag | null>()
  }

  async delete(id: string | Types.ObjectId): Promise<IFeatureFlag | null> {
    return FeatureFlagModel.findByIdAndDelete(id).lean<IFeatureFlag | null>()
  }

  async upsertByKey(key: string, data: Omit<CreateFeatureFlagDTO, 'key'>): Promise<IFeatureFlag> {
    const result = await FeatureFlagModel.findOneAndUpdate(
      { key },
      { $set: { key, ...data } },
      { upsert: true, new: true },
    ).lean<IFeatureFlag>()
    return result!
  }
}
