export interface SimulationNode {
  id: string
  baseInfluenceScore: number
}

export interface SimulationEdge {
  fromNodeId: string
  toNodeId: string
  strength: number // 0.0 to 1.0
  relationType: string
}

export interface SimulationParameters {
  decayFactor: number // How much influence decays per hop (0.0 to 1.0)
  maxIterations: number // Maximum number of propagation steps
  activationThreshold: number // Minimum influence needed to activate a node (0.0 to 1.0)
  allowReactivation: boolean // Can already-activated nodes accumulate more influence?
}

export interface NodeState {
  nodeId: string
  isActive: boolean
  influenceLevel: number // Current accumulated influence
  activatedAtIteration: number | null // When this node first became active
}

export interface IterationState {
  iteration: number
  activeNodes: string[] // IDs of nodes active in this iteration
  nodeStates: Map<string, NodeState>
  newlyActivatedNodes: string[] // Nodes that became active this iteration
  totalActiveCount: number
}

export interface PropagationResult {
  iterations: IterationState[]
  finalActiveNodes: string[]
  totalIterations: number
  convergenceReason: 'max_iterations' | 'no_new_activations' | 'all_nodes_active'
}
