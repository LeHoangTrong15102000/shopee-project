/// <reference types="jest" />
import { Request, Response } from 'express'

jest.mock('../../container', () => ({
  container: {
    services: {
      address: {
        getAddresses: jest.fn(),
        getAddressById: jest.fn(),
        createAddress: jest.fn(),
        updateAddress: jest.fn(),
        deleteAddress: jest.fn(),
        setDefaultAddress: jest.fn(),
      },
    },
  },
}))

import { container } from '../../container'
import { getAddresses, getAddressById, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../controllers/address.controller'

const mockAddressService = container.services.address as jest.Mocked<typeof container.services.address>

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  jwtDecoded: options.jwtDecoded || { id: 'user123', email: 'test@test.com', roles: ['User'], created_at: '2024-01-01' },
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Address Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockAddress = {
    _id: 'addr123',
    user: 'user123',
    full_name: 'John Doe',
    phone: '0123456789',
    province: 'Ho Chi Minh',
    district: 'District 1',
    ward: 'Ward 1',
    street: '123 Main St',
    is_default: true,
  }

  describe('getAddresses', () => {
    it('should return addresses successfully', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      mockAddressService.getAddresses.mockResolvedValue({ addresses: [mockAddress], total: 1 } as any)

      await getAddresses(req as Request, res as Response)

      expect(mockAddressService.getAddresses).toHaveBeenCalledWith('user123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách địa chỉ thành công',
        data: { addresses: [mockAddress], total: 1 },
      })
    })

    it('should propagate service errors', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      mockAddressService.getAddresses.mockRejectedValue(new Error('Service error'))

      await expect(getAddresses(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('getAddressById', () => {
    it('should return address by id successfully', async () => {
      const req = createMockRequest({ params: { id: 'addr123' } })
      const res = createMockResponse()
      mockAddressService.getAddressById.mockResolvedValue(mockAddress as any)

      await getAddressById(req as Request, res as Response)

      expect(mockAddressService.getAddressById).toHaveBeenCalledWith('user123', 'addr123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Lấy địa chỉ thành công', data: mockAddress })
    })

    it('should propagate service errors', async () => {
      const req = createMockRequest({ params: { id: 'addr123' } })
      const res = createMockResponse()
      mockAddressService.getAddressById.mockRejectedValue(new Error('Address not found'))

      await expect(getAddressById(req as Request, res as Response)).rejects.toThrow('Address not found')
    })
  })

  describe('createAddress', () => {
    it('should create address successfully', async () => {
      const addressData = { full_name: 'John Doe', phone: '0123456789', province: 'Ho Chi Minh', district: 'District 1', ward: 'Ward 1', street: '123 Main St', is_default: true }
      const req = createMockRequest({ body: addressData })
      const res = createMockResponse()
      mockAddressService.createAddress.mockResolvedValue(mockAddress as any)

      await createAddress(req as Request, res as Response)

      expect(mockAddressService.createAddress).toHaveBeenCalledWith('user123', addressData)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Tạo địa chỉ thành công', data: mockAddress })
    })

    it('should propagate service errors', async () => {
      const req = createMockRequest({ body: {} })
      const res = createMockResponse()
      mockAddressService.createAddress.mockRejectedValue(new Error('Validation error'))

      await expect(createAddress(req as Request, res as Response)).rejects.toThrow('Validation error')
    })
  })

  describe('updateAddress', () => {
    it('should update address successfully', async () => {
      const addressData = { full_name: 'Jane Doe', phone: '0987654321', province: 'Ha Noi', district: 'District 2', ward: 'Ward 2', street: '456 Other St', is_default: false }
      const req = createMockRequest({ params: { id: 'addr123' }, body: addressData })
      const res = createMockResponse()
      mockAddressService.updateAddress.mockResolvedValue({ ...mockAddress, ...addressData } as any)

      await updateAddress(req as Request, res as Response)

      expect(mockAddressService.updateAddress).toHaveBeenCalledWith('user123', 'addr123', addressData)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Cập nhật địa chỉ thành công', data: { ...mockAddress, ...addressData } })
    })

    it('should propagate service errors', async () => {
      const req = createMockRequest({ params: { id: 'addr123' }, body: {} })
      const res = createMockResponse()
      mockAddressService.updateAddress.mockRejectedValue(new Error('Update failed'))

      await expect(updateAddress(req as Request, res as Response)).rejects.toThrow('Update failed')
    })
  })

  describe('deleteAddress', () => {
    it('should delete address successfully', async () => {
      const req = createMockRequest({ params: { id: 'addr123' } })
      const res = createMockResponse()
      mockAddressService.deleteAddress.mockResolvedValue(undefined)

      await deleteAddress(req as Request, res as Response)

      expect(mockAddressService.deleteAddress).toHaveBeenCalledWith('user123', 'addr123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Xóa địa chỉ thành công' })
    })

    it('should propagate service errors', async () => {
      const req = createMockRequest({ params: { id: 'addr123' } })
      const res = createMockResponse()
      mockAddressService.deleteAddress.mockRejectedValue(new Error('Delete failed'))

      await expect(deleteAddress(req as Request, res as Response)).rejects.toThrow('Delete failed')
    })
  })

  describe('setDefaultAddress', () => {
    it('should set default address successfully', async () => {
      const req = createMockRequest({ params: { id: 'addr123' } })
      const res = createMockResponse()
      mockAddressService.setDefaultAddress.mockResolvedValue(mockAddress as any)

      await setDefaultAddress(req as Request, res as Response)

      expect(mockAddressService.setDefaultAddress).toHaveBeenCalledWith('user123', 'addr123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Đặt địa chỉ mặc định thành công', data: mockAddress })
    })

    it('should propagate service errors', async () => {
      const req = createMockRequest({ params: { id: 'addr123' } })
      const res = createMockResponse()
      mockAddressService.setDefaultAddress.mockRejectedValue(new Error('Set default failed'))

      await expect(setDefaultAddress(req as Request, res as Response)).rejects.toThrow('Set default failed')
    })
  })
})

