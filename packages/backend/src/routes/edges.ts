import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db.js'
import { createEdgeSchema, updateEdgeSchema } from '../lib/schemas.js'

export async function edgeRoutes(fastify: FastifyInstance) {
  // Create edge
  fastify.post('/edges', async (request, reply) => {
    const data = createEdgeSchema.parse(request.body)

    const edge = await db.influenceEdge.create({
      data,
    })

    return reply.code(201).send(edge)
  })

  // List edges by community
  fastify.get('/edges', async (request, reply) => {
    const { communityId } = request.query as { communityId?: string }

    const edges = await db.influenceEdge.findMany({
      where: communityId ? { communityId } : undefined,
      include: {
        fromNode: true,
        toNode: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return edges
  })

  // Get single edge
  fastify.get('/edges/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const edge = await db.influenceEdge.findUnique({
      where: { id },
      include: {
        fromNode: true,
        toNode: true,
      },
    })

    if (!edge) {
      return reply.code(404).send({ error: 'Edge not found' })
    }

    return edge
  })

  // Update edge
  fastify.patch('/edges/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = updateEdgeSchema.parse(request.body)

    const edge = await db.influenceEdge.update({
      where: { id },
      data,
    })

    return edge
  })

  // Delete edge
  fastify.delete('/edges/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    await db.influenceEdge.delete({
      where: { id },
    })

    return reply.code(204).send()
  })
}
