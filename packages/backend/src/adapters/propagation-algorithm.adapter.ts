/**
 * Adapter interface for custom propagation algorithms
 * Allows plugging in different simulation strategies
 */

import type {
  SimulationNode,
  SimulationEdge,
  SimulationParameters,
  PropagationResult,
} from '../simulation/types.js'

export interface IPropagationAlgorithm {
  /**
   * Unique identifier for this algorithm
   */
  readonly id: string

  /**
   * Human-readable name
   */
  readonly name: string

  /**
   * Description of the algorithm and its use cases
   */
  readonly description: string

  /**
   * Run the propagation simulation
   */
  simulate(
    nodes: SimulationNode[],
    edges: SimulationEdge[],
    initialSeedNodeIds: string[],
    parameters: SimulationParameters
  ): Promise<PropagationResult> | PropagationResult

  /**
   * Validate parameters for this algorithm
   * Return validation errors or undefined if valid
   */
  validateParameters(parameters: SimulationParameters): string[] | undefined

  /**
   * Get default parameters for this algorithm
   */
  getDefaultParameters(): Partial<SimulationParameters>
}

/**
 * Registry for propagation algorithms
 */
class PropagationAlgorithmRegistry {
  private algorithms: Map<string, IPropagationAlgorithm> = new Map()
  private defaultAlgorithmId: string | null = null

  /**
   * Register a new algorithm
   */
  register(algorithm: IPropagationAlgorithm, setAsDefault: boolean = false): void {
    this.algorithms.set(algorithm.id, algorithm)
    if (setAsDefault || this.defaultAlgorithmId === null) {
      this.defaultAlgorithmId = algorithm.id
    }
  }

  /**
   * Get an algorithm by ID
   */
  get(id: string): IPropagationAlgorithm | undefined {
    return this.algorithms.get(id)
  }

  /**
   * Get the default algorithm
   */
  getDefault(): IPropagationAlgorithm {
    if (!this.defaultAlgorithmId) {
      throw new Error('No default propagation algorithm registered')
    }
    const algorithm = this.algorithms.get(this.defaultAlgorithmId)
    if (!algorithm) {
      throw new Error(`Default algorithm '${this.defaultAlgorithmId}' not found`)
    }
    return algorithm
  }

  /**
   * List all registered algorithms
   */
  list(): IPropagationAlgorithm[] {
    return Array.from(this.algorithms.values())
  }

  /**
   * Check if an algorithm is registered
   */
  has(id: string): boolean {
    return this.algorithms.has(id)
  }

  /**
   * Unregister an algorithm
   */
  unregister(id: string): boolean {
    if (id === this.defaultAlgorithmId) {
      throw new Error('Cannot unregister the default algorithm')
    }
    return this.algorithms.delete(id)
  }

  /**
   * Clear all algorithms (for testing)
   */
  clear(): void {
    this.algorithms.clear()
    this.defaultAlgorithmId = null
  }
}

export const propagationAlgorithmRegistry = new PropagationAlgorithmRegistry()
