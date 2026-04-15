import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import { STATUS } from '@constants/status'
import { responseError, ErrorHandler } from '@utils/response'

/**
 * Zod validation middleware wrapper
 * Validates request body, query, and params against a Zod schema
 * Returns 422 Unprocessable Entity on validation failure
 */
export const validate = <T extends z.ZodType>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      return next()
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = formatZodErrors(error)
        responseError(res, new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, formattedErrors))
        return
      }
      return next(error)
    }
  }
}

/**
 * Zod validation middleware wrapper for Bad Request (400)
 * Same as validate() but returns 400 instead of 422
 */
export const validateBadRequest = <T extends z.ZodType>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      return next()
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = formatZodErrors(error)
        responseError(res, new ErrorHandler(STATUS.BAD_REQUEST, formattedErrors))
        return
      }
      return next(error)
    }
  }
}

/**
 * Format Zod errors to match express-validator error format
 * Output: { fieldName: "error message" }
 */
function formatZodErrors(error: ZodError): Record<string, string> {
  return error.issues.reduce(
    (acc, err) => {
      // Remove 'body', 'query', 'params' prefix from path
      const path = err.path.length > 1 ? err.path.slice(1).join('.') : err.path[0]
      if (path) {
        acc[path as string] = err.message
      }
      return acc
    },
    {} as Record<string, string>,
  )
}
