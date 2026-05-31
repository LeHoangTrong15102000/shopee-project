import { JobStatsModel, IJobStats } from '@database/models/job-stats.model'

export interface UpsertJobStatsDTO {
  queue: string
  date: Date
  completed: number
  failed: number
  avgDurationMs: number
  p95DurationMs: number
}

export interface IJobStatsRepository {
  upsert(data: UpsertJobStatsDTO): Promise<IJobStats>
  findByQueueAndDate(queue: string, date: Date): Promise<IJobStats | null>
  findByDate(date: Date): Promise<IJobStats[]>
}

export class JobStatsRepository implements IJobStatsRepository {
  async upsert(data: UpsertJobStatsDTO): Promise<IJobStats> {
    const { queue, date, ...fields } = data
    const result = await JobStatsModel.findOneAndUpdate(
      { queue, date },
      { $set: fields },
      { upsert: true, new: true },
    ).lean<IJobStats>()
    return result!
  }

  async findByQueueAndDate(queue: string, date: Date): Promise<IJobStats | null> {
    return JobStatsModel.findOne({ queue, date }).lean<IJobStats | null>()
  }

  async findByDate(date: Date): Promise<IJobStats[]> {
    return JobStatsModel.find({ date }).lean<IJobStats[]>()
  }
}
