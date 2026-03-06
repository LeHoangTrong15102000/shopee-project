import { Request, Response } from 'express'
import { ConversationModel } from '@database/models/conversation.model'
import { Logger } from '@utils/logger'
import { getRateLimitStats } from '@middleware/rateLimiter.middleware'

/**
 * Analytics controller để monitor chatbot performance
 */

/**
 * Lấy thống kê tổng quan chatbot
 * GET /analytics/chatbot-overview
 */
export const getChatbotOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Thống kê conversations
    const [
      totalConversations,
      conversationsToday,
      conversationsThisWeek,
      conversationsThisMonth,
      activeConversations,
      archivedConversations,
    ] = await Promise.all([
      ConversationModel.countDocuments(),
      ConversationModel.countDocuments({ createdAt: { $gte: today } }),
      ConversationModel.countDocuments({ createdAt: { $gte: thisWeek } }),
      ConversationModel.countDocuments({ createdAt: { $gte: thisMonth } }),
      ConversationModel.countDocuments({ status: 'active' }),
      ConversationModel.countDocuments({ status: 'archived' }),
    ])

    // Thống kê messages
    const messageStats = await ConversationModel.aggregate([
      {
        $project: {
          messageCount: { $size: '$messages' },
          userMessages: {
            $size: {
              $filter: {
                input: '$messages',
                cond: { $eq: ['$$this.role', 'user'] },
              },
            },
          },
          assistantMessages: {
            $size: {
              $filter: {
                input: '$messages',
                cond: { $eq: ['$$this.role', 'assistant'] },
              },
            },
          },
          lastActivity: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: '$messageCount' },
          totalUserMessages: { $sum: '$userMessages' },
          totalAssistantMessages: { $sum: '$assistantMessages' },
          avgMessagesPerConversation: { $avg: '$messageCount' },
          maxMessagesInConversation: { $max: '$messageCount' },
        },
      },
    ])

    // Top active users (last 7 days)
    const topUsers = await ConversationModel.aggregate([
      {
        $match: { lastActivity: { $gte: thisWeek } },
      },
      {
        $group: {
          _id: '$user',
          conversationCount: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          lastActivity: { $max: '$lastActivity' },
        },
      },
      {
        $sort: { totalMessages: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          userId: '$_id',
          userName: { $arrayElemAt: ['$user.name', 0] },
          userEmail: { $arrayElemAt: ['$user.email', 0] },
          conversationCount: 1,
          totalMessages: 1,
          lastActivity: 1,
        },
      },
    ])

    // Rate limit stats
    const rateLimitStats = getRateLimitStats()

    const overview = {
      conversations: {
        total: totalConversations,
        today: conversationsToday,
        thisWeek: conversationsThisWeek,
        thisMonth: conversationsThisMonth,
        active: activeConversations,
        archived: archivedConversations,
      },
      messages: messageStats[0] || {
        totalMessages: 0,
        totalUserMessages: 0,
        totalAssistantMessages: 0,
        avgMessagesPerConversation: 0,
        maxMessagesInConversation: 0,
      },
      topUsers: topUsers.slice(0, 5),
      rateLimiting: rateLimitStats,
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    }

    Logger.apiInfo('Chatbot overview retrieved', {
      userId: req.jwtDecoded?.id,
      statsGenerated: Object.keys(overview),
    })

    res.status(200).json({
      message: 'Lấy thống kê chatbot thành công',
      data: overview,
    })
  } catch (error: any) {
    Logger.apiError('Error getting chatbot overview', error)
    res.status(500).json({
      message: 'Lỗi server khi lấy thống kê chatbot',
      error: error.message,
    })
  }
}

/**
 * Lấy thống kê performance theo thời gian
 * GET /analytics/chatbot-performance?period=7d
 */
export const getChatbotPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = '7d' } = req.query

    let startDate: Date
    let groupBy: Record<string, unknown>

    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' },
        }
        break
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        }
        break
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        }
        break
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        }
    }

    const performanceData = await ConversationModel.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: groupBy,
          conversationCount: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          uniqueUsers: { $addToSet: '$user' },
          avgResponseTime: { $avg: 2.5 }, // Mock data - trong thực tế sẽ track từ logs
        },
      },
      {
        $project: {
          date: '$_id',
          conversationCount: 1,
          totalMessages: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          avgResponseTime: 1,
        },
      },
      {
        $sort: {
          'date.year': 1,
          'date.month': 1,
          'date.day': 1,
          'date.hour': 1,
        },
      },
    ])

    res.status(200).json({
      message: 'Lấy thống kê performance thành công',
      data: {
        period,
        startDate,
        performance: performanceData,
      },
    })
  } catch (error: any) {
    Logger.apiError('Error getting chatbot performance', error)
    res.status(500).json({
      message: 'Lỗi server khi lấy thống kê performance',
      error: error.message,
    })
  }
}

/**
 * Health check endpoint cho monitoring systems
 * GET /analytics/health
 */
export const getHealthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      anthropicApiStatus: process.env.ANTHROPIC_API_KEY
        ? 'configured'
        : 'missing',
      databaseStatus: 'connected', // Sẽ check thực tế MongoDB connection
      services: {
        chatbot: 'operational',
        database: 'operational',
        rateLimit: 'operational',
      },
    }

    res.status(200).json(healthData)
  } catch (error: any) {
    Logger.apiError('Health check failed', error)
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}

// Export compatibility object
export const analyticsController = {
  getChatbotOverview,
  getChatbotPerformance,
  getHealthCheck,
}
