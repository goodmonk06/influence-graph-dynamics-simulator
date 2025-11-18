import type {
  SimulationNode,
  SimulationEdge,
  SimulationParameters,
  NodeState,
  IterationState,
  PropagationResult,
} from './types.js'

/**
 * Core influence propagation simulation engine
 *
 * This implements a discrete-time propagation model where:
 * 1. Initial seed nodes start with influence level equal to their base score
 * 2. At each iteration, active nodes propagate influence to their neighbors
 * 3. Influence is transmitted with decay based on edge strength and decay factor
 * 4. Nodes become active when their accumulated influence exceeds the threshold
 * 5. Simulation continues until no new activations or max iterations reached
 */
export class PropagationEngine {
  private nodes: Map<string, SimulationNode>
  private edges: SimulationEdge[]
  private outgoingEdges: Map<string, SimulationEdge[]>
  private incomingEdges: Map<string, SimulationEdge[]>

  constructor(nodes: SimulationNode[], edges: SimulationEdge[]) {
    this.nodes = new Map(nodes.map((n) => [n.id, n]))
    this.edges = edges

    // Build adjacency lists for efficient graph traversal
    this.outgoingEdges = new Map()
    this.incomingEdges = new Map()

    for (const edge of edges) {
      // Outgoing edges
      if (!this.outgoingEdges.has(edge.fromNodeId)) {
        this.outgoingEdges.set(edge.fromNodeId, [])
      }
      this.outgoingEdges.get(edge.fromNodeId)!.push(edge)

      // Incoming edges
      if (!this.incomingEdges.has(edge.toNodeId)) {
        this.incomingEdges.set(edge.toNodeId, [])
      }
      this.incomingEdges.get(edge.toNodeId)!.push(edge)
    }
  }

  /**
   * Run the propagation simulation
   */
  simulate(
    initialSeedNodeIds: string[],
    parameters: SimulationParameters
  ): PropagationResult {
    // Initialize node states
    const nodeStates = this.initializeNodeStates(initialSeedNodeIds)

    const iterations: IterationState[] = []
    let currentIteration = 0
    let hasNewActivations = true

    // Initial state (iteration 0)
    iterations.push(this.captureIterationState(0, nodeStates, initialSeedNodeIds))

    // Run propagation iterations
    while (currentIteration < parameters.maxIterations && hasNewActivations) {
      currentIteration++

      const newlyActivated = this.propagateInfluence(
        nodeStates,
        currentIteration,
        parameters
      )

      const currentActiveNodes = Array.from(nodeStates.values())
        .filter((state) => state.isActive)
        .map((state) => state.nodeId)

      iterations.push(
        this.captureIterationState(currentIteration, nodeStates, newlyActivated)
      )

      hasNewActivations = newlyActivated.length > 0

      // Check if all nodes are active
      if (currentActiveNodes.length === this.nodes.size) {
        return {
          iterations,
          finalActiveNodes: currentActiveNodes,
          totalIterations: currentIteration,
          convergenceReason: 'all_nodes_active',
        }
      }
    }

    const finalActiveNodes = Array.from(nodeStates.values())
      .filter((state) => state.isActive)
      .map((state) => state.nodeId)

    return {
      iterations,
      finalActiveNodes,
      totalIterations: currentIteration,
      convergenceReason: hasNewActivations ? 'max_iterations' : 'no_new_activations',
    }
  }

  /**
   * Initialize node states with seed nodes active
   */
  private initializeNodeStates(seedNodeIds: string[]): Map<string, NodeState> {
    const states = new Map<string, NodeState>()

    for (const [nodeId, node] of this.nodes) {
      const isSeed = seedNodeIds.includes(nodeId)
      states.set(nodeId, {
        nodeId,
        isActive: isSeed,
        influenceLevel: isSeed ? node.baseInfluenceScore : 0,
        activatedAtIteration: isSeed ? 0 : null,
      })
    }

    return states
  }

  /**
   * Propagate influence for one iteration
   */
  private propagateInfluence(
    nodeStates: Map<string, NodeState>,
    iteration: number,
    parameters: SimulationParameters
  ): string[] {
    const influenceDeltas = new Map<string, number>()

    // Calculate influence to propagate from all active nodes
    for (const [nodeId, state] of nodeStates) {
      if (!state.isActive) continue

      const outgoing = this.outgoingEdges.get(nodeId) || []

      for (const edge of outgoing) {
        const targetState = nodeStates.get(edge.toNodeId)
        if (!targetState) continue

        // Skip if target is already active and reactivation is not allowed
        if (targetState.isActive && !parameters.allowReactivation) continue

        // Calculate influence transmitted through this edge
        // Formula: influence = sourceInfluence * edgeStrength * decayFactor
        const transmittedInfluence =
          state.influenceLevel * edge.strength * parameters.decayFactor

        // Accumulate influence deltas
        const currentDelta = influenceDeltas.get(edge.toNodeId) || 0
        influenceDeltas.set(edge.toNodeId, currentDelta + transmittedInfluence)
      }
    }

    // Apply influence deltas and check for new activations
    const newlyActivated: string[] = []

    for (const [nodeId, delta] of influenceDeltas) {
      const state = nodeStates.get(nodeId)!
      state.influenceLevel += delta

      // Check if node should become active
      if (!state.isActive && state.influenceLevel >= parameters.activationThreshold) {
        state.isActive = true
        state.activatedAtIteration = iteration
        newlyActivated.push(nodeId)
      }
    }

    return newlyActivated
  }

  /**
   * Capture current iteration state for result tracking
   */
  private captureIterationState(
    iteration: number,
    nodeStates: Map<string, NodeState>,
    newlyActivated: string[]
  ): IterationState {
    const activeNodes = Array.from(nodeStates.values())
      .filter((state) => state.isActive)
      .map((state) => state.nodeId)

    return {
      iteration,
      activeNodes,
      nodeStates: new Map(nodeStates), // Clone the map
      newlyActivatedNodes: newlyActivated,
      totalActiveCount: activeNodes.length,
    }
  }

  /**
   * Calculate network metrics for analysis
   */
  getNetworkMetrics() {
    const nodeCount = this.nodes.size
    const edgeCount = this.edges.length

    // Calculate degree distribution
    const inDegrees = new Map<string, number>()
    const outDegrees = new Map<string, number>()

    for (const nodeId of this.nodes.keys()) {
      inDegrees.set(nodeId, (this.incomingEdges.get(nodeId) || []).length)
      outDegrees.set(nodeId, (this.outgoingEdges.get(nodeId) || []).length)
    }

    const avgInDegree = Array.from(inDegrees.values()).reduce((a, b) => a + b, 0) / nodeCount
    const avgOutDegree = Array.from(outDegrees.values()).reduce((a, b) => a + b, 0) / nodeCount

    return {
      nodeCount,
      edgeCount,
      avgInDegree,
      avgOutDegree,
      density: edgeCount / (nodeCount * (nodeCount - 1)),
    }
  }
}
