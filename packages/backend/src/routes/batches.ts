import type { FastifyInstance } from 'fastify'
import { BatchService } from '../services/batch.service.js'
import { z } from 'zod'

const batchService = new BatchService()

const createBatchSchema = z.object({
  communityId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  batchType: z.string(),
  scenarioIds: z.array(z.string()).min(1),
  configJson: z.record(z.any()).optional(),
})

export async function batchRoutes(fastify: FastifyInstance) {
  fastify.post('/batches', async (request, reply) => {
    const data = createBatchSchema.parse(request.body)
    const batch = await batchService.create(data)
    return reply.code(201).send(batch)
  })

  fastify.get('/batches', async (request) => {
    const { communityId } = request.query as { communityId: string }
    return batchService.list(communityId)
  })

  fastify.get('/batches/:id', async (request) => {
    const { id } = request.params as { id: string }
    return batchService.getById(id)
  })

  fastify.post('/batches/:id/execute', async (request) => {
    const { id } = request.params as { id: string }
    return batchService.execute(id)
  })
}
