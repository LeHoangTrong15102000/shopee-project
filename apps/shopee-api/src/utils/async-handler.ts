import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Async handler wrapper để tự động catch errors trong async controllers
 * Thay thế try-catch boilerplate trong controllers
 *
 * @example
 * // Thay vì viết:
 * const getUser = async (req, res) => {
 *   try {
 *     const user = await UserModel.findById(req.params.id)
 *     res.json(user)
 *   } catch (error) {
 *     next(error)
 *   }
 * }
 *
 * // Có thể viết:
 * const getUser = asyncHandler(async (req, res) => {
 *   const user = await UserModel.findById(req.params.id)
 *   res.json(user)
 * })
 */

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>

export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Wrapper cho multiple async handlers (middleware chain)
 * Hữu ích khi cần wrap nhiều middleware cùng lúc
 *
 * @example
 * router.get('/users', asyncHandlers([
 *   validateRequest,
 *   checkPermission,
 *   getUsers
 * ]))
 */
export const asyncHandlers = (handlers: AsyncRequestHandler[]): RequestHandler[] => {
  return handlers.map((handler) => asyncHandler(handler))
}

/**
 * Async handler với timeout
 * Tự động reject nếu handler chạy quá lâu
 *
 * @param fn - Async handler function
 * @param timeoutMs - Timeout in milliseconds (default: 30000ms = 30s)
 *
 * @example
 * const slowHandler = asyncHandlerWithTimeout(async (req, res) => {
 *   const result = await someSlowOperation()
 *   res.json(result)
 * }, 10000) // 10 second timeout
 */
export const asyncHandlerWithTimeout = (
  fn: AsyncRequestHandler,
  timeoutMs: number = 30000
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    Promise.race([fn(req, res, next), timeoutPromise]).catch(next)
  }
}

/**
 * Async handler với retry logic
 * Tự động retry khi gặp lỗi
 *
 * @param fn - Async handler function
 * @param maxRetries - Số lần retry tối đa (default: 3)
 * @param delayMs - Delay giữa các lần retry (default: 1000ms)
 *
 * @example
 * const unreliableHandler = asyncHandlerWithRetry(async (req, res) => {
 *   const result = await unreliableExternalAPI()
 *   res.json(result)
 * }, 3, 1000)
 */
export const asyncHandlerWithRetry = (
  fn: AsyncRequestHandler,
  maxRetries: number = 3,
  delayMs: number = 1000
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await fn(req, res, next)
        return
      } catch (error) {
        lastError = error as Error

        // Không retry nếu response đã được gửi
        if (res.headersSent) {
          return
        }

        // Không retry nếu đây là lần cuối
        if (attempt === maxRetries) {
          break
        }

        // Delay trước khi retry
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
      }
    }

    next(lastError)
  }
}

/**
 * Tạo async handler với custom error transformer
 * Cho phép transform error trước khi pass to next()
 *
 * @param fn - Async handler function
 * @param errorTransformer - Function để transform error
 *
 * @example
 * const handler = asyncHandlerWithErrorTransform(
 *   async (req, res) => { ... },
 *   (error) => new CustomError(error.message)
 * )
 */
export const asyncHandlerWithErrorTransform = (
  fn: AsyncRequestHandler,
  errorTransformer: (error: Error) => Error
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      next(errorTransformer(error))
    })
  }
}

export default asyncHandler

