import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db.js'
import { createNodeSchema, updateNodeSchema } from '../lib/schemas.js'

export async function nodeRoutes(fastify: FastifyInstance) {
  // Create node
  fastify.post('/nodes', async (request, reply) => {
    const data = createNodeSchema.parse(request.body)

    const node = await db.influenceNode.create({
      data,
    })

    return reply.code(201).send(node)
  })

  // List nodes by community
  fastify.get('/nodes', async (request, reply) => {
    const { communityId } = request.query as { communityId?: string }

    const nodes = await db.influenceNode.findMany({
      where: communityId ? { communityId } : undefined,
      orderBy: { createdAt: 'desc' },
    })

    return nodes
  })

  // Get single node
  fastify.get('/nodes/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const node = await db.influenceNode.findUnique({
      where: { id },
      include: {
        outgoingEdges: true,
        incomingEdges: true,
      },
    })

    if (!node) {
      return reply.code(404).send({ error: 'Node not found' })
    }

    return node
  })

  // Update node
  fastify.patch('/nodes/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = updateNodeSchema.parse(request.body)

    const node = await db.influenceNode.update({
      where: { id },
      data,
    })

    return node
  })

  // Delete node
  fastify.delete('/nodes/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    await db.influenceNode.delete({
      where: { id },
    })

    return reply.code(204).send()
  })
}
