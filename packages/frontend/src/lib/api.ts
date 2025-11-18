const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface InfluenceNode {
  id: string
  communityId: string
  memberId: string
  baseInfluenceScore: number
  metaJson?: any
  createdAt: string
  updatedAt: string
}

export interface InfluenceEdge {
  id: string
  communityId: string
  fromNodeId: string
  toNodeId: string
  strength: number
  relationType: string
  metaJson?: any
  createdAt: string
  updatedAt: string
}

export interface PropagationScenario {
  id: string
  communityId: string
  name: string
  descriptionMarkdown?: string
  initialSeedNodesJson: string[]
  parametersJson: {
    decayFactor: number
    maxIterations: number
    activationThreshold: number
    allowReactivation: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface PropagationResult {
  id: string
  scenarioId: string
  iterationCount: number
  resultJson: any
  createdAt: string
}

export const api = {
  // Nodes
  async getNodes(communityId?: string): Promise<InfluenceNode[]> {
    const url = communityId
      ? `${API_URL}/nodes?communityId=${communityId}`
      : `${API_URL}/nodes`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch nodes')
    return res.json()
  },

  // Edges
  async getEdges(communityId?: string): Promise<InfluenceEdge[]> {
    const url = communityId
      ? `${API_URL}/edges?communityId=${communityId}`
      : `${API_URL}/edges`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch edges')
    return res.json()
  },

  // Graph
  async getCommunityGraph(communityId: string): Promise<{
    nodes: InfluenceNode[]
    edges: InfluenceEdge[]
  }> {
    const res = await fetch(`${API_URL}/communities/${communityId}/graph`)
    if (!res.ok) throw new Error('Failed to fetch community graph')
    return res.json()
  },

  // Scenarios
  async getScenarios(communityId?: string): Promise<PropagationScenario[]> {
    const url = communityId
      ? `${API_URL}/scenarios?communityId=${communityId}`
      : `${API_URL}/scenarios`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch scenarios')
    return res.json()
  },

  async getScenario(id: string): Promise<PropagationScenario> {
    const res = await fetch(`${API_URL}/scenarios/${id}`)
    if (!res.ok) throw new Error('Failed to fetch scenario')
    return res.json()
  },

  async runScenario(id: string): Promise<any> {
    const res = await fetch(`${API_URL}/scenarios/${id}/run`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error('Failed to run scenario')
    return res.json()
  },

  async getLatestResult(scenarioId: string): Promise<PropagationResult> {
    const res = await fetch(`${API_URL}/scenarios/${scenarioId}/results/latest`)
    if (!res.ok) throw new Error('Failed to fetch result')
    return res.json()
  },
}
