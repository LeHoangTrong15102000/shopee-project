import { Router, Request, Response } from 'express'

const healthRouter = Router()

/**
 * GET /health
 * Simple liveness probe for Docker health checks.
 * Registered early in index.ts (before HTTPS redirect middleware) so that
 * in-container wget http://localhost:4000/health returns 200, not a 301.
 */
healthRouter.get('/', (req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() })
})

export default healthRouter
