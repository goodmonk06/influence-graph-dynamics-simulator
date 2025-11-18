import type { FastifyInstance } from 'fastify'
import { CommunityService } from '../services/community.service.js'
import { z } from 'zod'

const communityService = new CommunityService()

const createCommunitySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  settings: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
})

export async function communityRoutes(fastify: FastifyInstance) {
  // Create community
  fastify.post('/communities', async (request, reply) => {
    const data = createCommunitySchema.parse(request.body)
    const community = await communityService.create(data)
    return reply.code(201).send(community)
  })

  // List communities
  fastify.get('/communities', async (request) => {
    const { status, tags, limit, offset } = request.query as any
    return communityService.list({ status, tags, limit, offset })
  })

  // Get community
  fastify.get('/communities/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const community = await communityService.getById(id)
    return community
  })

  // Get community by slug
  fastify.get('/communities/slug/:slug', async (request) => {
    const { slug } = request.params as { slug: string }
    return communityService.getBySlug(slug)
  })

  // Update community
  fastify.patch('/communities/:id', async (request) => {
    const { id } = request.params as { id: string }
    const data = request.body as any
    return communityService.update(id, data)
  })

  // Delete community
  fastify.delete('/communities/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await communityService.delete(id)
    return reply.code(204).send()
  })

  // Get community stats
  fastify.get('/communities/:id/stats', async (request) => {
    const { id } = request.params as { id: string }
    return communityService.getStats(id)
  })
}
