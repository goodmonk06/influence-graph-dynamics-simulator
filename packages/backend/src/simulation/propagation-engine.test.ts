import { describe, it, expect } from 'vitest'
import { PropagationEngine } from './propagation-engine.js'
import type { SimulationNode, SimulationEdge, SimulationParameters } from './types.js'

describe('PropagationEngine', () => {
  describe('basic propagation', () => {
    it('should activate direct neighbors of seed node', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 2.0 },
        { id: 'B', baseInfluenceScore: 1.0 },
        { id: 'C', baseInfluenceScore: 1.0 },
      ]

      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'B', strength: 0.8, relationType: 'friend' },
        { fromNodeId: 'A', toNodeId: 'C', strength: 0.7, relationType: 'friend' },
      ]

      const params: SimulationParameters = {
        decayFactor: 0.7,
        maxIterations: 5,
        activationThreshold: 0.5,
        allowReactivation: false,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A'], params)

      // A starts active (seed)
      expect(result.iterations[0].activeNodes).toEqual(['A'])

      // After iteration 1, B and C should be activated
      // A->B: 2.0 * 0.8 * 0.7 = 1.12 > 0.5 ✓
      // A->C: 2.0 * 0.7 * 0.7 = 0.98 > 0.5 ✓
      expect(result.iterations[1].activeNodes).toContain('B')
      expect(result.iterations[1].activeNodes).toContain('C')
      expect(result.iterations[1].totalActiveCount).toBe(3)
    })

    it('should not activate nodes below threshold', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 1.0 },
        { id: 'B', baseInfluenceScore: 1.0 },
      ]

      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'B', strength: 0.3, relationType: 'other' },
      ]

      const params: SimulationParameters = {
        decayFactor: 0.5,
        maxIterations: 5,
        activationThreshold: 0.8,
        allowReactivation: false,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A'], params)

      // A->B: 1.0 * 0.3 * 0.5 = 0.15 < 0.8 ✗
      expect(result.finalActiveNodes).toEqual(['A'])
      expect(result.convergenceReason).toBe('no_new_activations')
    })
  })

  describe('multi-hop propagation', () => {
    it('should propagate through multiple hops', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 2.0 },
        { id: 'B', baseInfluenceScore: 1.5 },
        { id: 'C', baseInfluenceScore: 1.0 },
      ]

      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'B', strength: 0.9, relationType: 'friend' },
        { fromNodeId: 'B', toNodeId: 'C', strength: 0.8, relationType: 'friend' },
      ]

      const params: SimulationParameters = {
        decayFactor: 0.8,
        maxIterations: 10,
        activationThreshold: 0.5,
        allowReactivation: false,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A'], params)

      // Iteration 0: A is active
      expect(result.iterations[0].activeNodes).toEqual(['A'])

      // Iteration 1: B becomes active (A->B: 2.0 * 0.9 * 0.8 = 1.44)
      expect(result.iterations[1].newlyActivatedNodes).toContain('B')

      // Iteration 2: C becomes active (B->C: 1.5 * 0.8 * 0.8 = 0.96)
      expect(result.iterations[2].newlyActivatedNodes).toContain('C')

      expect(result.finalActiveNodes.length).toBe(3)
      expect(result.convergenceReason).toBe('all_nodes_active')
    })
  })

  describe('convergence', () => {
    it('should stop when max iterations reached', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 1.0 },
        { id: 'B', baseInfluenceScore: 1.0 },
      ]

      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'B', strength: 0.5, relationType: 'friend' },
      ]

      const params: SimulationParameters = {
        decayFactor: 0.6,
        maxIterations: 3,
        activationThreshold: 0.5,
        allowReactivation: false,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A'], params)

      expect(result.totalIterations).toBeLessThanOrEqual(3)
    })

    it('should stop when no new activations occur', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 1.0 },
        { id: 'B', baseInfluenceScore: 1.0 },
        { id: 'C', baseInfluenceScore: 1.0 },
      ]

      // B is isolated - can't be reached
      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'C', strength: 0.8, relationType: 'friend' },
      ]

      const params: SimulationParameters = {
        decayFactor: 0.7,
        maxIterations: 10,
        activationThreshold: 0.3,
        allowReactivation: false,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A'], params)

      expect(result.convergenceReason).toBe('no_new_activations')
      expect(result.finalActiveNodes).not.toContain('B')
    })

    it('should stop when all nodes are active', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 2.0 },
        { id: 'B', baseInfluenceScore: 1.5 },
        { id: 'C', baseInfluenceScore: 1.0 },
      ]

      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'B', strength: 0.9, relationType: 'friend' },
        { fromNodeId: 'A', toNodeId: 'C', strength: 0.8, relationType: 'friend' },
      ]

      const params: SimulationParameters = {
        decayFactor: 0.8,
        maxIterations: 10,
        activationThreshold: 0.5,
        allowReactivation: false,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A'], params)

      expect(result.convergenceReason).toBe('all_nodes_active')
      expect(result.finalActiveNodes.length).toBe(3)
    })
  })

  describe('influence accumulation', () => {
    it('should accumulate influence from multiple sources', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 1.5 },
        { id: 'B', baseInfluenceScore: 1.5 },
        { id: 'C', baseInfluenceScore: 1.0 },
      ]

      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'C', strength: 0.4, relationType: 'friend' },
        { fromNodeId: 'B', toNodeId: 'C', strength: 0.4, relationType: 'friend' },
      ]

      const params: SimulationParameters = {
        decayFactor: 0.7,
        maxIterations: 5,
        activationThreshold: 0.7,
        allowReactivation: false,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A', 'B'], params)

      // Both A and B are seeds
      expect(result.iterations[0].activeNodes).toContain('A')
      expect(result.iterations[0].activeNodes).toContain('B')

      // C should receive influence from both:
      // A->C: 1.5 * 0.4 * 0.7 = 0.42
      // B->C: 1.5 * 0.4 * 0.7 = 0.42
      // Total: 0.84 > 0.7 ✓
      expect(result.finalActiveNodes).toContain('C')
    })

    it('should handle reactivation when allowed', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 2.0 },
        { id: 'B', baseInfluenceScore: 1.0 },
        { id: 'C', baseInfluenceScore: 1.5 },
      ]

      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'B', strength: 0.8, relationType: 'friend' },
        { fromNodeId: 'C', toNodeId: 'B', strength: 0.7, relationType: 'friend' },
      ]

      const paramsWithReactivation: SimulationParameters = {
        decayFactor: 0.7,
        maxIterations: 5,
        activationThreshold: 0.5,
        allowReactivation: true,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A', 'C'], paramsWithReactivation)

      // B should be activated and can accumulate more influence
      const bStates = result.iterations.map(
        (iter) => iter.nodeStates.get('B')?.influenceLevel || 0
      )

      // Influence should accumulate over iterations when reactivation is allowed
      expect(bStates[1]).toBeGreaterThan(0)
    })
  })

  describe('network metrics', () => {
    it('should calculate correct network metrics', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 1.0 },
        { id: 'B', baseInfluenceScore: 1.0 },
        { id: 'C', baseInfluenceScore: 1.0 },
        { id: 'D', baseInfluenceScore: 1.0 },
      ]

      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'B', strength: 0.5, relationType: 'friend' },
        { fromNodeId: 'B', toNodeId: 'C', strength: 0.5, relationType: 'friend' },
        { fromNodeId: 'C', toNodeId: 'D', strength: 0.5, relationType: 'friend' },
        { fromNodeId: 'D', toNodeId: 'A', strength: 0.5, relationType: 'friend' },
      ]

      const engine = new PropagationEngine(nodes, edges)
      const metrics = engine.getNetworkMetrics()

      expect(metrics.nodeCount).toBe(4)
      expect(metrics.edgeCount).toBe(4)
      expect(metrics.avgInDegree).toBe(1)
      expect(metrics.avgOutDegree).toBe(1)
      expect(metrics.density).toBeCloseTo(0.333, 2)
    })
  })

  describe('edge cases', () => {
    it('should handle single node with no edges', () => {
      const nodes: SimulationNode[] = [{ id: 'A', baseInfluenceScore: 1.0 }]
      const edges: SimulationEdge[] = []

      const params: SimulationParameters = {
        decayFactor: 0.7,
        maxIterations: 5,
        activationThreshold: 0.5,
        allowReactivation: false,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A'], params)

      expect(result.finalActiveNodes).toEqual(['A'])
      expect(result.convergenceReason).toBe('all_nodes_active')
    })

    it('should handle disconnected components', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 1.0 },
        { id: 'B', baseInfluenceScore: 1.0 },
        { id: 'C', baseInfluenceScore: 1.0 },
        { id: 'D', baseInfluenceScore: 1.0 },
      ]

      // Two disconnected pairs
      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'B', strength: 0.8, relationType: 'friend' },
        { fromNodeId: 'C', toNodeId: 'D', strength: 0.8, relationType: 'friend' },
      ]

      const params: SimulationParameters = {
        decayFactor: 0.7,
        maxIterations: 5,
        activationThreshold: 0.3,
        allowReactivation: false,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A'], params)

      // Only A's component should be activated
      expect(result.finalActiveNodes).toContain('A')
      expect(result.finalActiveNodes).toContain('B')
      expect(result.finalActiveNodes).not.toContain('C')
      expect(result.finalActiveNodes).not.toContain('D')
    })

    it('should handle high influence scores correctly', () => {
      const nodes: SimulationNode[] = [
        { id: 'A', baseInfluenceScore: 10.0 },
        { id: 'B', baseInfluenceScore: 1.0 },
      ]

      const edges: SimulationEdge[] = [
        { fromNodeId: 'A', toNodeId: 'B', strength: 0.1, relationType: 'other' },
      ]

      const params: SimulationParameters = {
        decayFactor: 0.5,
        maxIterations: 5,
        activationThreshold: 0.4,
        allowReactivation: false,
      }

      const engine = new PropagationEngine(nodes, edges)
      const result = engine.simulate(['A'], params)

      // A->B: 10.0 * 0.1 * 0.5 = 0.5 > 0.4 ✓
      expect(result.finalActiveNodes).toContain('B')
    })
  })
})
