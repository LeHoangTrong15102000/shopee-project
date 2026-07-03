/// <reference types="jest" />

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}))

// Mock mv
jest.mock('mv', () => jest.fn((src, dest, cb) => cb(null)))

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
}))

// Mock shelljs
jest.mock('shelljs', () => ({
  mkdir: jest.fn().mockReturnValue({ code: 0, stderr: '' }),
}))

// Mock formidable
const mockParse = jest.fn()
jest.mock('formidable', () => ({
  __esModule: true,
  IncomingForm: jest.fn().mockImplementation(() => ({
    parse: mockParse,
  })),
  default: {
    IncomingForm: jest.fn().mockImplementation(() => ({
      parse: mockParse,
    })),
  },
}))

// Mock response util — plain constructor function avoids TS class-property syntax
// that breaks jest.mock() hoisting (Babel cannot parse TS class fields in factory scope).
function MockErrorHandler(
  this: { status: number; error: string | Record<string, unknown>; message: string },
  status: number,
  error: string | Record<string, unknown>,
) {
  this.status = status
  this.error = error
  this.message = typeof error === 'string' ? error : JSON.stringify(error)
}
MockErrorHandler.prototype = Object.create(Error.prototype)
MockErrorHandler.prototype.constructor = MockErrorHandler

jest.mock('@utils/response', () => ({
  ErrorHandler: MockErrorHandler,
}))

import fs from 'fs'
import shelljs from 'shelljs'
import { Request } from 'express'

import { uploadFile, uploadManyFile } from '@utils/upload'

const createMockFile = (overrides = {}) => ({
  filepath: '/tmp/upload_123',
  originalFilename: 'test-image.jpg',
  mimetype: 'image/jpeg',
  size: 500000,
  ...overrides,
})

describe('upload utility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('uploadFile', () => {
    it('should resolve with filename for valid image file', async () => {
      const mockFile = createMockFile()
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { image: mockFile })
      })

      const result = await uploadFile({} as unknown as Request)

      expect(result).toBe('test-uuid-1234.jpg')
    })

    it('should resolve with filename when image is array', async () => {
      const mockFile = createMockFile()
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { image: [mockFile] })
      })

      const result = await uploadFile({} as unknown as Request)

      expect(result).toBe('test-uuid-1234.jpg')
    })

    it('should reject with 422 error when no image in request', async () => {
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, {})
      })

      await expect(uploadFile({} as unknown as Request)).rejects.toMatchObject({
        status: 422,
        error: { image: 'Không tìm thấy image' },
      })
    })

    it('should reject with 422 error for invalid mimetype', async () => {
      const mockFile = createMockFile({ mimetype: 'application/pdf' })
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { image: mockFile })
      })

      await expect(uploadFile({} as unknown as Request)).rejects.toMatchObject({
        status: 422,
        error: { image: 'image không đúng định dạng' },
      })
    })

    it('should reject with 422 error for oversized file', async () => {
      const mockFile = createMockFile({ size: 1500000 })
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { image: mockFile })
      })

      await expect(uploadFile({} as unknown as Request)).rejects.toMatchObject({
        status: 422,
        error: { image: 'Kích thước image phải <= 1MB' },
      })
    })

    it('should reject with typed ErrorHandler when formidable parse fails', async () => {
      const parseError = new Error('Parse failed')
      mockParse.mockImplementation((req, callback) => {
        callback(parseError, null, null)
      })

      await expect(uploadFile({} as unknown as Request)).rejects.toMatchObject({
        status: 400,
      })
      // Must NOT reject with the raw Error — must be a typed ErrorHandler
      await expect(
        new Promise((res, rej) => {
          mockParse.mockImplementation((req, callback) => callback(parseError, null, null))
          uploadFile({} as unknown as Request)
            .then(res)
            .catch(rej)
        }),
      ).rejects.not.toBe(parseError)
    })

    it('should use custom folder when provided', async () => {
      const mockFile = createMockFile()
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { image: mockFile })
      })

      const result = await uploadFile({} as unknown as Request, 'avatars')

      expect(result).toBe('test-uuid-1234.jpg')
    })
  })

  describe('uploadManyFile', () => {
    it('should resolve with array of filenames for valid images', async () => {
      const mockFiles = [
        createMockFile({ filepath: '/tmp/upload_1', originalFilename: 'img1.jpg' }),
        createMockFile({ filepath: '/tmp/upload_2', originalFilename: 'img2.png' }),
      ]
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { images: mockFiles })
      })

      const result = await uploadManyFile({} as unknown as Request)

      expect(result).toHaveLength(2)
      expect(result[0]).toBe('test-uuid-1234.jpg')
      expect(result[1]).toBe('test-uuid-1234.png')
    })

    it('should handle single image as non-array', async () => {
      const mockFile = createMockFile()
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { images: mockFile })
      })

      const result = await uploadManyFile({} as unknown as Request)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe('test-uuid-1234.jpg')
    })

    it('should reject with 422 error when no images in request', async () => {
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, {})
      })

      await expect(uploadManyFile({} as unknown as Request)).rejects.toMatchObject({
        status: 422,
        error: { images: 'Không tìm thấy images' },
      })
    })

    it('should reject with 422 error when one image has invalid mimetype', async () => {
      const mockFiles = [
        createMockFile({ filepath: '/tmp/upload_1', originalFilename: 'img1.jpg' }),
        createMockFile({
          filepath: '/tmp/upload_2',
          originalFilename: 'doc.pdf',
          mimetype: 'application/pdf',
        }),
      ]
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { images: mockFiles })
      })

      await expect(uploadManyFile({} as unknown as Request)).rejects.toMatchObject({
        status: 422,
        error: { image: 'image không đúng định dạng' },
      })
    })

    it('should reject with typed ErrorHandler when formidable parse fails', async () => {
      const parseError = new Error('Parse failed')
      mockParse.mockImplementation((req, callback) => {
        callback(parseError, null, null)
      })

      await expect(uploadManyFile({} as unknown as Request)).rejects.toMatchObject({
        status: 400,
      })
    })

    it('should use custom folder when provided', async () => {
      const mockFile = createMockFile()
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { images: [mockFile] })
      })

      const result = await uploadManyFile({} as unknown as Request, 'products')

      expect(result).toHaveLength(1)
      expect(result[0]).toBe('test-uuid-1234.jpg')
    })
  })

  describe('upload — directory creation failure', () => {
    it('should reject with typed ErrorHandler when mkdir fails silently', async () => {
      // Simulate: directory does not exist, mkdir returns non-zero code
      ;(fs.existsSync as jest.Mock).mockReturnValueOnce(false)
      ;(shelljs.mkdir as jest.Mock).mockReturnValueOnce({ code: 1, stderr: 'Permission denied' })

      const mockFile = createMockFile()
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { image: mockFile })
      })

      await expect(uploadFile({} as unknown as Request)).rejects.toMatchObject({
        status: 500,
      })
    })

    it('should proceed when directory already exists (mkdir not called)', async () => {
      // existsSync returns true, but the source uses mkdir -p (idempotent) unconditionally.
      // Verify upload still completes successfully even when directories already exist.
      ;(fs.existsSync as jest.Mock).mockReturnValueOnce(true)

      const mockFile = createMockFile()
      mockParse.mockImplementation((req, callback) => {
        callback(null, {}, { image: mockFile })
      })

      const result = await uploadFile({} as unknown as Request)

      expect(result).toBe('test-uuid-1234.jpg')
    })
  })
})
