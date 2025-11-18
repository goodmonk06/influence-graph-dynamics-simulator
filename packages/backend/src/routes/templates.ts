import type { FastifyInstance } from 'fastify'
import { TemplateService } from '../services/template.service.js'
import { z } from 'zod'

const templateService = new TemplateService()

const createTemplateSchema = z.object({
  communityId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  isPublic: z.boolean().optional(),
  parametersJson: z.record(z.any()),
  seedSelectionStrategy: z.string(),
  tags: z.array(z.string()).optional(),
})

export async function templateRoutes(fastify: FastifyInstance) {
  fastify.post('/templates', async (request, reply) => {
    const data = createTemplateSchema.parse(request.body)
    const template = await templateService.create(data)
    return reply.code(201).send(template)
  })

  fastify.get('/templates', async (request) => {
    const { communityId, category, isPublic } = request.query as any
    return templateService.list({ communityId, category, isPublic })
  })

  fastify.get('/templates/:id', async (request) => {
    const { id } = request.params as { id: string }
    return templateService.getById(id)
  })
}
