import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db.js'
import { createScenarioSchema, updateScenarioSchema } from '../lib/schemas.js'
import { SimulationService } from '../services/simulation.service.js'

const simulationService = new SimulationService()

export async function scenarioRoutes(fastify: FastifyInstance) {
  // Create scenario
  fastify.post('/scenarios', async (request, reply) => {
    const data = createScenarioSchema.parse(request.body)

    const scenario = await db.propagationScenario.create({
      data: {
        communityId: data.communityId,
        name: data.name,
        descriptionMarkdown: data.descriptionMarkdown,
        initialSeedNodesJson: data.initialSeedNodesJson as any,
        parametersJson: data.parametersJson as any,
      },
    })

    return reply.code(201).send(scenario)
  })

  // List scenarios
  fastify.get('/scenarios', async (request, reply) => {
    const { communityId } = request.query as { communityId?: string }

    const scenarios = await db.propagationScenario.findMany({
      where: communityId ? { communityId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        results: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return scenarios
  })

  // Get single scenario
  fastify.get('/scenarios/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const scenario = await db.propagationScenario.findUnique({
      where: { id },
      include: {
        results: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!scenario) {
      return reply.code(404).send({ error: 'Scenario not found' })
    }

    return scenario
  })

  // Update scenario
  fastify.patch('/scenarios/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = updateScenarioSchema.parse(request.body)

    const scenario = await db.propagationScenario.update({
      where: { id },
      data: {
        name: data.name,
        descriptionMarkdown: data.descriptionMarkdown,
        initialSeedNodesJson: data.initialSeedNodesJson as any,
        parametersJson: data.parametersJson as any,
      },
    })

    return scenario
  })

  // Delete scenario
  fastify.delete('/scenarios/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    await db.propagationScenario.delete({
      where: { id },
    })

    return reply.code(204).send()
  })

  // Run scenario simulation
  fastify.post('/scenarios/:id/run', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const { result, resultId } = await simulationService.runScenario(id)

      return {
        resultId,
        scenarioId: id,
        summary: {
          totalIterations: result.totalIterations,
          convergenceReason: result.convergenceReason,
          finalActiveCount: result.finalActiveNodes.length,
        },
        result,
      }
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message })
      }
      throw error
    }
  })

  // Get latest result
  fastify.get('/scenarios/:id/results/latest', async (request, reply) => {
    const { id } = request.params as { id: string }

    const result = await simulationService.getLatestResult(id)

    if (!result) {
      return reply.code(404).send({ error: 'No results found for this scenario' })
    }

    return result
  })

  // Get all results for scenario
  fastify.get('/scenarios/:id/results', async (request, reply) => {
    const { id } = request.params as { id: string }

    const results = await simulationService.getScenarioResults(id)

    return results
  })

  // Get graph data for community
  fastify.get('/communities/:communityId/graph', async (request, reply) => {
    const { communityId } = request.params as { communityId: string }

    const [nodes, edges] = await Promise.all([
      db.influenceNode.findMany({
        where: { communityId },
      }),
      db.influenceEdge.findMany({
        where: { communityId },
      }),
    ])

    return {
      nodes,
      edges,
    }
  })
}
