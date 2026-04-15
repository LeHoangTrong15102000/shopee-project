import { Request } from 'express'
import formidable from 'formidable'
import fs from 'fs'
import shelljs from 'shelljs'
import mv from 'mv'
import { ErrorHandler } from './response'
import { STATUS } from '@constants/status'
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

const upload = (image: formidable.File, folder: string) => {
  return new Promise<string>((resolve, reject) => {
    const dir = `${FOLDER_UPLOAD}${folder ? '/' + folder : ''}`
    if (!fs.existsSync(dir)) {
      shelljs.mkdir('-p', dir)
    }
    const tmpPath = image.filepath
    const newName = uuidv4() + '.' + getExtension(image.originalFilename ?? '')
    const newPath = dir + '/' + newName
    mv(tmpPath, newPath, function (err: Error | null) {
      if (err) return reject(new ErrorHandler(STATUS.INTERNAL_SERVER_ERROR, 'Lỗi đổi tên file'))
      resolve(newName)
    })
  })
}

export const uploadFile = (req: Request, folder = '') => {
  return new Promise<string>((resolve, reject) => {
    const form = new formidable.IncomingForm()
    form.parse(req, function (error, fields, files) {
      if (error) {
        return reject(error)
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
    const form = new formidable.IncomingForm({ multiples: true })
    form.parse(req, function (error, fields, files) {
      if (error) {
        return reject(error)
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
