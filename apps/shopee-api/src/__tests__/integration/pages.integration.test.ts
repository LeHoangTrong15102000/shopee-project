/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAdminToken } from '../helpers/auth-helper'
import { PageModel } from '@database/models/page.model'
import './setup'

const app = createTestApp()

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createDraftPage(
  adminToken: string,
  overrides: Record<string, unknown> = {},
): Promise<{ _id: string; slug: string; status: string }> {
  const res = await supertest(app)
    .post('/admin/pages')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      slug: `test-page-${Date.now()}`,
      title: 'Test Page',
      blocks: [],
      ...overrides,
    })
  expect(res.status).toBe(201)
  return res.body.data
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Page CRUD + Publish Flow Integration', () => {
  let adminToken: string

  beforeEach(async () => {
    adminToken = (await getAdminToken(app)).access_token
  })

  // ─── Admin CRUD ──────────────────────────────────────────────────────────────

  describe('POST /admin/pages', () => {
    it('creates a draft page', async () => {
      const res = await supertest(app)
        .post('/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'my-page', title: 'My Page' })

      expect(res.status).toBe(201)
      expect(res.body.data.slug).toBe('my-page')
      expect(res.body.data.status).toBe('draft')
    })

    it('returns 409 when slug already exists', async () => {
      await supertest(app)
        .post('/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'duplicate-slug', title: 'First' })

      const res = await supertest(app)
        .post('/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'duplicate-slug', title: 'Second' })

      expect(res.status).toBe(409)
    })

    it('returns 401 without auth', async () => {
      const res = await supertest(app)
        .post('/admin/pages')
        .send({ slug: 'no-auth', title: 'No Auth' })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /admin/pages', () => {
    it('returns list of all pages', async () => {
      await createDraftPage(adminToken, { slug: 'page-a' })
      await createDraftPage(adminToken, { slug: 'page-b' })

      const res = await supertest(app)
        .get('/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('GET /admin/pages/:id', () => {
    it('returns page by ID', async () => {
      const page = await createDraftPage(adminToken)

      const res = await supertest(app)
        .get(`/admin/pages/${page._id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data._id).toBe(page._id)
    })

    it('returns 404 for non-existent page', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .get(`/admin/pages/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /admin/pages/:id', () => {
    it('updates page title and blocks', async () => {
      const page = await createDraftPage(adminToken)

      const res = await supertest(app)
        .put(`/admin/pages/${page._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          blocks: [
            {
              type: 'spacer',
              data: { height: 20 },
            },
          ],
        })

      if (res.status !== 200) {
        console.error('PUT /admin/pages/:id error:', JSON.stringify(res.body))
      }
      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Updated Title')
      expect(res.body.data.blocks).toHaveLength(1)
    })
  })

  describe('DELETE /admin/pages/:id', () => {
    it('deletes a page', async () => {
      const page = await createDraftPage(adminToken)

      const deleteRes = await supertest(app)
        .delete(`/admin/pages/${page._id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(deleteRes.status).toBe(200)

      // Verify it's gone
      const getRes = await supertest(app)
        .get(`/admin/pages/${page._id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(getRes.status).toBe(404)
    })
  })

  // ─── Publish / Unpublish ──────────────────────────────────────────────────────

  describe('PATCH /admin/pages/:id/publish', () => {
    it('publishes a draft page', async () => {
      const page = await createDraftPage(adminToken)

      const res = await supertest(app)
        .patch(`/admin/pages/${page._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('published')
      expect(res.body.data.publishedAt).toBeDefined()
    })
  })

  describe('PATCH /admin/pages/:id/unpublish', () => {
    it('unpublishes a published page', async () => {
      const page = await createDraftPage(adminToken)

      // Publish first
      await supertest(app)
        .patch(`/admin/pages/${page._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)

      // Then unpublish
      const res = await supertest(app)
        .patch(`/admin/pages/${page._id}/unpublish`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('draft')
    })
  })

  // ─── Public endpoint ──────────────────────────────────────────────────────────

  describe('GET /pages/:slug (public)', () => {
    it('returns 404 for a draft page', async () => {
      const page = await createDraftPage(adminToken, { slug: 'draft-page' })

      // Draft page should not be accessible publicly
      const res = await supertest(app).get(`/pages/${page.slug}`)
      expect(res.status).toBe(404)
    })

    it('returns resolved page for a published page', async () => {
      const slug = `pub-page-${Date.now()}`
      const page = await createDraftPage(adminToken, {
        slug,
        blocks: [
          {
            type: 'hero_banner',
            data: {
              imageUrl: 'https://example.com/img.jpg',
              title: 'Welcome',
            },
          },
        ],
      })

      // Publish it
      await supertest(app)
        .patch(`/admin/pages/${page._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)

      const res = await supertest(app).get(`/pages/${slug}`)

      expect(res.status).toBe(200)
      expect(res.body.data.slug).toBe(slug)
      expect(res.body.data.status).toBe('published')
      expect(Array.isArray(res.body.data.blocks)).toBe(true)
    })

    it('returns 404 after unpublishing a previously published page', async () => {
      const slug = `unpub-page-${Date.now()}`
      const page = await createDraftPage(adminToken, { slug })

      // Publish
      await supertest(app)
        .patch(`/admin/pages/${page._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)

      // Verify it's accessible
      const pubRes = await supertest(app).get(`/pages/${slug}`)
      expect(pubRes.status).toBe(200)

      // Unpublish
      await supertest(app)
        .patch(`/admin/pages/${page._id}/unpublish`)
        .set('Authorization', `Bearer ${adminToken}`)

      // Should now return 404
      const unpubRes = await supertest(app).get(`/pages/${slug}`)
      expect(unpubRes.status).toBe(404)
    })

    it('returns 404 for non-existent slug', async () => {
      const res = await supertest(app).get('/pages/this-slug-does-not-exist')
      expect(res.status).toBe(404)
    })
  })

  describe('GET /pages/homepage (public)', () => {
    it('returns 404 when homepage page does not exist', async () => {
      const res = await supertest(app).get('/pages/homepage')
      expect(res.status).toBe(404)
    })

    it('returns homepage when published page with slug "homepage" exists', async () => {
      const page = await createDraftPage(adminToken, { slug: 'homepage', title: 'Home' })

      // Publish it
      await supertest(app)
        .patch(`/admin/pages/${page._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)

      const res = await supertest(app).get('/pages/homepage')

      expect(res.status).toBe(200)
      expect(res.body.data.slug).toBe('homepage')
    })
  })
})
