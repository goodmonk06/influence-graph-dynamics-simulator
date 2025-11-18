'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { InfluenceNode, InfluenceEdge } from '@/lib/api'

interface ForceGraphProps {
  nodes: InfluenceNode[]
  edges: InfluenceEdge[]
  activeNodes?: Set<string>
  width?: number
  height?: number
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string
  memberId: string
  baseInfluenceScore: number
  isActive?: boolean
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node
  target: string | D3Node
  strength: number
  relationType: string
}

export function ForceGraph({ nodes, edges, activeNodes, width = 800, height = 600 }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove()

    // Prepare data
    const d3Nodes: D3Node[] = nodes.map((node) => ({
      id: node.id,
      memberId: node.memberId,
      baseInfluenceScore: node.baseInfluenceScore,
      isActive: activeNodes?.has(node.id) ?? false,
    }))

    const d3Links: D3Link[] = edges.map((edge) => ({
      source: edge.fromNodeId,
      target: edge.toNodeId,
      strength: edge.strength,
      relationType: edge.relationType,
    }))

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])

    // Add zoom behavior
    const g = svg.append('g')
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on('zoom', (event) => {
          g.attr('transform', event.transform)
        }) as any
    )

    // Create force simulation
    const simulation = d3
      .forceSimulation<D3Node>(d3Nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Link>(d3Links)
          .id((d) => d.id)
          .distance(100)
          .strength((d) => d.strength * 0.5)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Add arrow markers for edges
    svg
      .append('defs')
      .selectAll('marker')
      .data(['friend', 'mentor', 'group_peer', 'other'])
      .join('marker')
      .attr('id', (d) => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', (d) => {
        const colors: Record<string, string> = {
          friend: '#10b981',
          mentor: '#f59e0b',
          group_peer: '#3b82f6',
          other: '#6b7280',
        }
        return colors[d] || '#6b7280'
      })
      .attr('d', 'M0,-5L10,0L0,5')

    // Draw edges
    const link = g
      .append('g')
      .selectAll('line')
      .data(d3Links)
      .join('line')
      .attr('stroke', (d) => {
        const colors: Record<string, string> = {
          friend: '#10b981',
          mentor: '#f59e0b',
          group_peer: '#3b82f6',
          other: '#6b7280',
        }
        return colors[d.relationType] || '#6b7280'
      })
      .attr('stroke-opacity', (d) => 0.3 + d.strength * 0.5)
      .attr('stroke-width', (d) => 1 + d.strength * 3)
      .attr('marker-end', (d) => `url(#arrow-${d.relationType})`)

    // Draw nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(d3Nodes)
      .join('g')
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }) as any
      )

    // Add circles for nodes
    node
      .append('circle')
      .attr('r', (d) => 8 + d.baseInfluenceScore * 4)
      .attr('fill', (d) => (d.isActive ? '#ef4444' : '#3b82f6'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9)

    // Add labels
    node
      .append('text')
      .text((d) => d.memberId)
      .attr('x', 0)
      .attr('y', (d) => 12 + d.baseInfluenceScore * 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#374151')

    // Add tooltips
    node.append('title').text(
      (d) =>
        `${d.memberId}\nInfluence: ${d.baseInfluenceScore.toFixed(2)}\n${
          d.isActive ? 'ACTIVE' : 'Inactive'
        }`
    )

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as D3Node).x!)
        .attr('y1', (d) => (d.source as D3Node).y!)
        .attr('x2', (d) => (d.target as D3Node).x!)
        .attr('y2', (d) => (d.target as D3Node).y!)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [nodes, edges, activeNodes, width, height])

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Inactive Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Active Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-green-500"></div>
            <span>Friend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-amber-500"></div>
            <span>Mentor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-blue-500"></div>
            <span>Group Peer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-gray-500"></div>
            <span>Other</span>
          </div>
        </div>
      </div>
    </div>
  )
}
