import mongoose, { Schema } from 'mongoose'

export type AuditLogStatus = 'success' | 'failed'

export interface IAuditLogActor {
  userId: string
  roles: string[]
}

export interface IAuditLog {
  _id?: mongoose.Types.ObjectId
  action: string
  resource: string
  resourceId?: string | null
  actor: IAuditLogActor
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  diff?: unknown[] | null
  ip: string
  userAgent: string
  status: AuditLogStatus
  errorMessage?: string | null
  timestamp: Date
}

const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true, maxlength: 100 },
    resource: { type: String, required: true, maxlength: 100 },
    resourceId: { type: String, default: null },
    actor: {
      userId: { type: String, required: true },
      roles: { type: [String], default: [] },
    },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    diff: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, maxlength: 45, default: 'unknown' },
    userAgent: { type: String, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
      default: 'success',
    },
    errorMessage: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
)

// TTL index — 90 days (7776000 seconds)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 })

// Query filter indexes
AuditLogSchema.index({ action: 1, timestamp: -1 })
AuditLogSchema.index({ resource: 1, timestamp: -1 })
AuditLogSchema.index({ 'actor.userId': 1, timestamp: -1 })
AuditLogSchema.index({ status: 1, timestamp: -1 })

export const AuditLogModel = mongoose.model<IAuditLog>('audit_logs', AuditLogSchema)
