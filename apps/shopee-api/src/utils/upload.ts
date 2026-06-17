import { Request } from 'express'
import * as formidable from 'formidable'
import shelljs from 'shelljs'
import mv from 'mv'
import { ErrorHandler } from './response'
import { STATUS } from '@constants/status'
import { ERROR_CODES } from '@constants/messages'
import { isEmpty } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { FOLDER_UPLOAD } from '@constants/config'

interface UploadError {
  image?: string
  images?: string
  [key: string]: unknown
}

const getExtension = (filename: string): string => {
  const match = /(?:\.([^.]+))?$/.exec(filename)
  return match?.[1] ?? ''
}

/**
 * Move a single parsed formidable file from the temp staging dir into its final destination.
 *
 * The caller is responsible for ensuring both `FOLDER_UPLOAD/.tmp` and the destination
 * `FOLDER_UPLOAD/<folder>` already exist before calling this function. Because the temp
 * file is staged inside `FOLDER_UPLOAD/.tmp` (same bind mount as the destination), the
 * `mv()` call resolves to an atomic `fs.rename` (same-device) and never falls back to
 * a cross-device copy that would fail with EACCES on Docker bind mounts owned by a
 * different UID.
 */
const upload = (image: formidable.File, folder: string) => {
  return new Promise<string>((resolve, reject) => {
    const dir = `${FOLDER_UPLOAD}${folder ? '/' + folder : ''}`
    const tmpPath = image.filepath
    const newName = uuidv4() + '.' + getExtension(image.originalFilename ?? '')
    const newPath = dir + '/' + newName
    mv(tmpPath, newPath, function (err: Error | null) {
      if (err) {
        // Include errno/code in the detail only outside production — consistent with the
        // existing responseError / isProduction() pattern in response.ts.
        const isNonProd = process.env.NODE_ENV !== 'production'
        const detail = isNonProd
          ? `Lỗi đổi tên file: ${(err as NodeJS.ErrnoException).message} (errno=${(err as NodeJS.ErrnoException).errno}, code=${(err as NodeJS.ErrnoException).code})`
          : 'Lỗi đổi tên file'
        return reject(
          new ErrorHandler(
            STATUS.INTERNAL_SERVER_ERROR,
            detail,
            true,
            ERROR_CODES.UPLOAD_MOVE_FAILED,
          ),
        )
      }
      resolve(newName)
    })
  })
}

export const uploadFile = (req: Request, folder = '') => {
  return new Promise<string>((resolve, reject) => {
    // Stage temp files inside FOLDER_UPLOAD/.tmp so the move into FOLDER_UPLOAD/<folder>
    // is a same-device rename, not a cross-device copy.
    const tmpDir = `${FOLDER_UPLOAD}/.tmp`
    const destDir = `${FOLDER_UPLOAD}${folder ? '/' + folder : ''}`

    const mkTmp = shelljs.mkdir('-p', tmpDir)
    if (mkTmp.code !== 0) {
      return reject(
        new ErrorHandler(
          STATUS.INTERNAL_SERVER_ERROR,
          `Lỗi tạo thư mục tạm: ${mkTmp.stderr || 'unknown error'}`,
          true,
          ERROR_CODES.UPLOAD_MOVE_FAILED,
        ),
      )
    }
    const mkDest = shelljs.mkdir('-p', destDir)
    if (mkDest.code !== 0) {
      return reject(
        new ErrorHandler(
          STATUS.INTERNAL_SERVER_ERROR,
          `Lỗi tạo thư mục upload: ${mkDest.stderr || 'unknown error'}`,
          true,
          ERROR_CODES.UPLOAD_MOVE_FAILED,
        ),
      )
    }

    const form = new formidable.IncomingForm({ uploadDir: tmpDir })
    form.parse(req, function (error, fields, files) {
      if (error) {
        return reject(
          new ErrorHandler(
            STATUS.BAD_REQUEST,
            'Lỗi phân tích dữ liệu upload: dữ liệu form không hợp lệ',
          ),
        )
      }
      try {
        const imageFiles = files.image
        const image = Array.isArray(imageFiles) ? imageFiles[0] : imageFiles
        const errorEntity: UploadError = {}
        if (!image) {
          errorEntity.image = 'Không tìm thấy image'
        } else if (!image.mimetype?.includes('image')) {
          errorEntity.image = 'image không đúng định dạng'
        } else if (image.size > 1000000) {
          errorEntity.image = 'Kích thước image phải <= 1MB'
        }
        if (!isEmpty(errorEntity)) {
          return reject(new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, errorEntity))
        }
        if (!image) {
          return reject(
            new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, { image: 'Không tìm thấy image' }),
          )
        }
        upload(image, folder)
          .then((res: string) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      } catch (err) {
        reject(err)
      }
    })
  })
}

export const uploadManyFile = (req: Request, folder = '') => {
  return new Promise<string[]>((resolve, reject) => {
    // Same same-device staging as uploadFile — temp files land in FOLDER_UPLOAD/.tmp.
    const tmpDir = `${FOLDER_UPLOAD}/.tmp`
    const destDir = `${FOLDER_UPLOAD}${folder ? '/' + folder : ''}`

    const mkTmp = shelljs.mkdir('-p', tmpDir)
    if (mkTmp.code !== 0) {
      return reject(
        new ErrorHandler(
          STATUS.INTERNAL_SERVER_ERROR,
          `Lỗi tạo thư mục tạm: ${mkTmp.stderr || 'unknown error'}`,
          true,
          ERROR_CODES.UPLOAD_MOVE_FAILED,
        ),
      )
    }
    const mkDest = shelljs.mkdir('-p', destDir)
    if (mkDest.code !== 0) {
      return reject(
        new ErrorHandler(
          STATUS.INTERNAL_SERVER_ERROR,
          `Lỗi tạo thư mục upload: ${mkDest.stderr || 'unknown error'}`,
          true,
          ERROR_CODES.UPLOAD_MOVE_FAILED,
        ),
      )
    }

    const form = new formidable.IncomingForm({ uploadDir: tmpDir, multiples: true })
    form.parse(req, function (error, fields, files) {
      if (error) {
        return reject(
          new ErrorHandler(
            STATUS.BAD_REQUEST,
            'Lỗi phân tích dữ liệu upload: dữ liệu form không hợp lệ',
          ),
        )
      }
      try {
        const imagesFiles = files.images
        const images = Array.isArray(imagesFiles)
          ? imagesFiles
          : imagesFiles
            ? [imagesFiles]
            : undefined
        const errorEntity: UploadError = {}
        if (!images) {
          errorEntity.images = 'Không tìm thấy images'
        } else if (images.some((image) => !image.mimetype?.includes('image'))) {
          errorEntity.image = 'image không đúng định dạng'
        }
        if (!isEmpty(errorEntity)) {
          return reject(new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, errorEntity))
        }
        if (!images) {
          return reject(
            new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, { images: 'Không tìm thấy images' }),
          )
        }
        const chainUpload = images.map((image) => {
          return upload(image, folder)
        })
        Promise.all(chainUpload)
          .then((res: string[]) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      } catch (err) {
        reject(err)
      }
    })
  })
}
