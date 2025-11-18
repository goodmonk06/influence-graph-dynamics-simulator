import { db } from '../lib/db.js'
import { PropagationEngine } from '../simulation/propagation-engine.js'
import type { SimulationParameters } from '../lib/schemas.js'
import type { PropagationResult } from '../simulation/types.js'

export class SimulationService {
  /**
   * Run a propagation simulation for a scenario
   */
  async runScenario(scenarioId: string): Promise<{
    result: PropagationResult
    resultId: string
  }> {
    // Fetch scenario
    const scenario = await db.propagationScenario.findUnique({
      where: { id: scenarioId },
    })

    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`)
    }

    const seedNodeIds = scenario.initialSeedNodesJson as string[]
    const parameters = scenario.parametersJson as SimulationParameters

    // Fetch all nodes and edges for the community
    const [nodes, edges] = await Promise.all([
      db.influenceNode.findMany({
        where: { communityId: scenario.communityId },
      }),
      db.influenceEdge.findMany({
        where: { communityId: scenario.communityId },
      }),
    ])

    // Validate seed nodes exist
    const nodeIds = new Set(nodes.map((n) => n.id))
    for (const seedId of seedNodeIds) {
      if (!nodeIds.has(seedId)) {
        throw new Error(`Seed node ${seedId} not found in community`)
      }
    }

    // Run simulation
    const engine = new PropagationEngine(
      nodes.map((n) => ({
        id: n.id,
        baseInfluenceScore: n.baseInfluenceScore,
      })),
      edges.map((e) => ({
        fromNodeId: e.fromNodeId,
        toNodeId: e.toNodeId,
        strength: e.strength,
        relationType: e.relationType,
      }))
    )

    const result = engine.simulate(seedNodeIds, parameters)

    // Convert NodeState maps to plain objects for JSON storage
    const resultForStorage = {
      ...result,
      iterations: result.iterations.map((iter) => ({
        ...iter,
        nodeStates: Object.fromEntries(
          Array.from(iter.nodeStates.entries()).map(([id, state]) => [
            id,
            {
              nodeId: state.nodeId,
              isActive: state.isActive,
              influenceLevel: state.influenceLevel,
              activatedAtIteration: state.activatedAtIteration,
            },
          ])
        ),
      })),
    }

    // Store result
    const savedResult = await db.propagationResult.create({
      data: {
        scenarioId,
        iterationCount: result.totalIterations,
        resultJson: resultForStorage as any,
      },
    })

    return {
      result,
      resultId: savedResult.id,
    }
  }

  /**
   * Get the latest result for a scenario
   */
  async getLatestResult(scenarioId: string) {
    const result = await db.propagationResult.findFirst({
      where: { scenarioId },
      orderBy: { createdAt: 'desc' },
      include: {
        scenario: true,
      },
    })

    return result
  }

  /**
   * Get all results for a scenario
   */
  async getScenarioResults(scenarioId: string) {
    const results = await db.propagationResult.findMany({
      where: { scenarioId },
      orderBy: { createdAt: 'desc' },
    })

    return results
  }
}
