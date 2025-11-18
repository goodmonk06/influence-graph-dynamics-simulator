/**
 * Adapter interface for generating insights from simulation results
 */

import type { PropagationResult } from '../simulation/types.js'

export interface GeneratedInsight {
  type: 'bottleneck' | 'influencer' | 'cluster' | 'trend' | 'anomaly' | 'recommendation'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  data?: Record<string, any>
  isActionable: boolean
}

export interface IInsightGenerator {
  /**
   * Generator identifier
   */
  readonly id: string

  /**
   * Generator name
   */
  readonly name: string

  /**
   * Analyze simulation result and generate insights
   */
  analyze(
    result: PropagationResult,
    context: {
      communityId: string
      scenarioId: string
      nodeCount: number
      edgeCount: number
    }
  ): Promise<GeneratedInsight[]> | GeneratedInsight[]

  /**
   * Check if this generator applies to the given result
   */
  appliesTo(result: PropagationResult): boolean
}

/**
 * Example: Detect influential nodes
 */
export class InfluencerDetectorGenerator implements IInsightGenerator {
  readonly id = 'influencer-detector'
  readonly name = 'Influencer Detector'

  analyze(
    result: PropagationResult,
    context: { communityId: string; scenarioId: string; nodeCount: number; edgeCount: number }
  ): GeneratedInsight[] {
    const insights: GeneratedInsight[] = []

    // Find nodes that activated early and had high impact
    const firstIteration = result.iterations[1] // Skip seed iteration
    if (firstIteration && firstIteration.newlyActivatedNodes.length > 0) {
      const topActivators = firstIteration.newlyActivatedNodes.slice(0, 5)

      if (topActivators.length > 0) {
        insights.push({
          type: 'influencer',
          severity: 'info',
          title: 'Top Early Activators Identified',
          description: `${topActivators.length} nodes were activated in the first iteration, showing high influence potential.`,
          data: { nodeIds: topActivators, iteration: 1 },
          isActionable: true,
        })
      }
    }

    // Check for low overall reach
    const reachPercentage = (result.finalActiveNodes.length / context.nodeCount) * 100
    if (reachPercentage < 30) {
      insights.push({
        type: 'recommendation',
        severity: 'warning',
        title: 'Low Message Reach Detected',
        description: `Only ${reachPercentage.toFixed(1)}% of nodes were activated. Consider increasing seed nodes or adjusting parameters.`,
        data: { reachPercentage, finalActiveCount: result.finalActiveNodes.length },
        isActionable: true,
      })
    }

    return insights
  }

  appliesTo(result: PropagationResult): boolean {
    return result.iterations.length > 1
  }
}

/**
 * Example: Detect bottlenecks
 */
export class BottleneckDetectorGenerator implements IInsightGenerator {
  readonly id = 'bottleneck-detector'
  readonly name = 'Bottleneck Detector'

  analyze(
    result: PropagationResult,
    context: { communityId: string; scenarioId: string; nodeCount: number; edgeCount: number }
  ): GeneratedInsight[] {
    const insights: GeneratedInsight[] = []

    // Check if propagation stalled (no new activations for multiple iterations)
    const iterations = result.iterations
    let stalledCount = 0

    for (let i = 1; i < iterations.length; i++) {
      if (iterations[i].newlyActivatedNodes.length === 0) {
        stalledCount++
      }
    }

    if (stalledCount > 3 && result.convergenceReason === 'no_new_activations') {
      const reachPercentage = (result.finalActiveNodes.length / context.nodeCount) * 100

      if (reachPercentage < 70) {
        insights.push({
          type: 'bottleneck',
          severity: 'warning',
          title: 'Propagation Bottleneck Detected',
          description: `Message propagation stalled before reaching majority of network (${reachPercentage.toFixed(1)}% reach). Network may have structural bottlenecks or disconnected clusters.`,
          data: {
            stalledIterations: stalledCount,
            reachPercentage,
            convergenceIteration: result.totalIterations,
          },
          isActionable: true,
        })
      }
    }

    return insights
  }

  appliesTo(result: PropagationResult): boolean {
    return result.convergenceReason === 'no_new_activations'
  }
}

/**
 * Insight generator registry
 */
class InsightGeneratorRegistry {
  private generators: Map<string, IInsightGenerator> = new Map()

  constructor() {
    // Register built-in generators
    this.register(new InfluencerDetectorGenerator())
    this.register(new BottleneckDetectorGenerator())
  }

  register(generator: IInsightGenerator): void {
    this.generators.set(generator.id, generator)
  }

  get(id: string): IInsightGenerator | undefined {
    return this.generators.get(id)
  }

  list(): IInsightGenerator[] {
    return Array.from(this.generators.values())
  }

  /**
   * Run all applicable generators on a result
   */
  async generateInsights(
    result: PropagationResult,
    context: {
      communityId: string
      scenarioId: string
      nodeCount: number
      edgeCount: number
    }
  ): Promise<GeneratedInsight[]> {
    const allInsights: GeneratedInsight[] = []

    for (const generator of this.generators.values()) {
      if (generator.appliesTo(result)) {
        try {
          const insights = await generator.analyze(result, context)
          allInsights.push(...insights)
        } catch (error) {
          console.error(`Insight generator ${generator.id} failed:`, error)
        }
      }
    }

    return allInsights
  }
}

export const insightGeneratorRegistry = new InsightGeneratorRegistry()
