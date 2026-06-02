/**
 * Unit tests for NotificationTemplates.
 */

/// <reference types="jest" />
import { NotificationTemplates } from '@services/notification-templates'

describe('NotificationTemplates.render', () => {
  describe('order type', () => {
    it('returns the expected title', () => {
      const { title } = NotificationTemplates.render('order', {
        orderId: '123',
        status: 'confirmed',
      })
      expect(title).toBe('Cập nhật đơn hàng')
    })

    it('includes the orderId in the content', () => {
      const { content } = NotificationTemplates.render('order', {
        orderId: '123',
        status: 'confirmed',
      })
      expect(content).toContain('#123')
    })

    it('includes the status in the content', () => {
      const { content } = NotificationTemplates.render('order', {
        orderId: '123',
        status: 'SHIPPED',
      })
      expect(content).toContain('SHIPPED')
    })

    it('uses a default status when none is provided', () => {
      const { content } = NotificationTemplates.render('order', { orderId: '123' })
      expect(content).toBeTruthy()
    })
  })

  describe('promotion type', () => {
    it('returns the expected title', () => {
      const { title } = NotificationTemplates.render('promotion', { promotionName: 'Summer Sale' })
      expect(title).toBe('Khuyến mãi dành cho bạn')
    })

    it('includes the promotion name in the content', () => {
      const { content } = NotificationTemplates.render('promotion', {
        promotionName: 'Summer Sale',
      })
      expect(content).toContain('Summer Sale')
    })

    it('includes the discount when provided', () => {
      const { content } = NotificationTemplates.render('promotion', {
        promotionName: 'Flash Deal',
        description: 'Giảm 30%',
      })
      expect(content).toContain('30')
    })
  })

  describe('flash_sale type', () => {
    it('returns the expected title', () => {
      const { title } = NotificationTemplates.render('flash_sale', { saleName: 'Mega Sale' })
      expect(title).toBe('Flash Sale đang diễn ra!')
    })

    it('includes the sale name in the content', () => {
      const { content } = NotificationTemplates.render('flash_sale', { saleName: 'Mega Sale' })
      expect(content).toContain('Mega Sale')
    })

    it('includes the discount percent when provided', () => {
      const { content } = NotificationTemplates.render('flash_sale', {
        saleName: 'Mega Sale',
        discountPercent: 50,
      })
      expect(content).toContain('50')
    })
  })

  describe('price_drop type', () => {
    it('returns the expected title', () => {
      const { title } = NotificationTemplates.render('price_drop', { productName: 'iPhone 15' })
      expect(title).toBe('Giá sản phẩm giảm!')
    })

    it('includes the product name in the content', () => {
      const { content } = NotificationTemplates.render('price_drop', { productName: 'iPhone 15' })
      expect(content).toContain('iPhone 15')
    })

    it('includes old and new prices when provided', () => {
      const { content } = NotificationTemplates.render('price_drop', {
        productName: 'iPhone 15',
        oldPrice: 1000,
        newPrice: 800,
      })
      expect(content).toContain('1000')
      expect(content).toContain('800')
    })
  })

  describe('system type', () => {
    it('returns the expected title', () => {
      const { title } = NotificationTemplates.render('system', { message: 'Maintenance tonight' })
      expect(title).toBe('Thông báo hệ thống')
    })

    it('uses the provided message as content', () => {
      const { content } = NotificationTemplates.render('system', { message: 'Maintenance tonight' })
      expect(content).toBe('Maintenance tonight')
    })

    it('uses a default message when none is provided', () => {
      const { content } = NotificationTemplates.render('system', {})
      expect(content).toBeTruthy()
    })
  })

  describe('other / unknown type', () => {
    it('returns a generic title for unknown types', () => {
      const { title } = NotificationTemplates.render('other', {})
      expect(title).toBe('Thông báo')
    })

    it('returns a generic content for unknown types', () => {
      const { content } = NotificationTemplates.render('other', {})
      expect(content).toBeTruthy()
    })

    it('uses the message field when present for unknown types', () => {
      const { content } = NotificationTemplates.render('other', { message: 'Custom message' })
      expect(content).toBe('Custom message')
    })
  })

  describe('return shape', () => {
    it('always returns an object with title and content strings', () => {
      const types = ['order', 'promotion', 'flash_sale', 'price_drop', 'system', 'other']
      for (const type of types) {
        const result = NotificationTemplates.render(type, {})
        expect(typeof result.title).toBe('string')
        expect(typeof result.content).toBe('string')
        expect(result.title.length).toBeGreaterThan(0)
        expect(result.content.length).toBeGreaterThan(0)
      }
    })
  })
})
