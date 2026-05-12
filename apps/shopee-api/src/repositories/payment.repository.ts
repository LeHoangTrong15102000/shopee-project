import { Types } from 'mongoose'
import { PaymentModel, IPayment, GatewayPaymentStatusType } from '@database/models/payment.model'

export class PaymentRepository {
  async create(data: Partial<IPayment>): Promise<IPayment> {
    const [payment] = await PaymentModel.create([data])
    return PaymentModel.findById(payment._id).lean<IPayment>() as Promise<IPayment>
  }

  async findById(id: string | Types.ObjectId): Promise<IPayment | null> {
    return PaymentModel.findById(id).lean<IPayment | null>()
  }

  async findByOrderId(orderId: string | Types.ObjectId): Promise<IPayment[]> {
    return PaymentModel.find({ orderId }).sort({ createdAt: -1 }).lean<IPayment[]>()
  }

  async findLatestByOrderId(orderId: string | Types.ObjectId): Promise<IPayment | null> {
    return PaymentModel.findOne({ orderId }).sort({ createdAt: -1 }).lean<IPayment | null>()
  }

  async findByTransactionId(transactionId: string): Promise<IPayment | null> {
    return PaymentModel.findOne({ transactionId }).lean<IPayment | null>()
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<IPayment | null> {
    return PaymentModel.findOne({ idempotencyKey }).lean<IPayment | null>()
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<IPayment>,
  ): Promise<IPayment | null> {
    return PaymentModel.findByIdAndUpdate(id, data, { new: true }).lean<IPayment | null>()
  }

  async findPendingByOrderId(orderId: string | Types.ObjectId): Promise<IPayment | null> {
    return PaymentModel.findOne({ orderId, status: 'PENDING' })
      .sort({ createdAt: -1 })
      .lean<IPayment | null>()
  }

  async findWithFilters(filters: {
    status?: GatewayPaymentStatusType
    provider?: string
    orderId?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }): Promise<{ data: IPayment[]; total: number }> {
    const query: Record<string, unknown> = {}

    if (filters.status) query.status = filters.status
    if (filters.provider) query.provider = filters.provider
    if (filters.orderId) query.orderId = new Types.ObjectId(filters.orderId)
    if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, Date> = {}
      if (filters.startDate) dateFilter.$gte = filters.startDate
      if (filters.endDate) dateFilter.$lte = filters.endDate
      query.createdAt = dateFilter
    }

    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      PaymentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<IPayment[]>(),
      PaymentModel.countDocuments(query),
    ])

    return { data, total }
  }
}
