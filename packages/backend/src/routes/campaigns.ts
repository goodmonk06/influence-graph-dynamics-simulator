import type { FastifyInstance } from 'fastify'
import { CampaignService } from '../services/campaign.service.js'
import { z } from 'zod'

const campaignService = new CampaignService()

const createCampaignSchema = z.object({
  communityId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  goalJson: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
})

export async function campaignRoutes(fastify: FastifyInstance) {
  fastify.post('/campaigns', async (request, reply) => {
    const data = createCampaignSchema.parse(request.body)
    const campaign = await campaignService.create({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    })
    return reply.code(201).send(campaign)
  })

  fastify.get('/campaigns', async (request) => {
    const { communityId } = request.query as { communityId: string }
    return campaignService.list(communityId)
  })

  fastify.get('/campaigns/:id', async (request) => {
    const { id } = request.params as { id: string }
    return campaignService.getById(id)
  })

  fastify.patch('/campaigns/:id', async (request) => {
    const { id } = request.params as { id: string }
    return campaignService.update(id, request.body as any)
  })

  fastify.post('/campaigns/:id/metrics', async (request) => {
    const { id } = request.params as { id: string }
    const { actualMetrics } = request.body as any
    return campaignService.updateMetrics(id, actualMetrics)
  })
}
