'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { ForceGraph } from '@/components/ForceGraph'

export default function GraphPage() {
  const searchParams = useSearchParams()
  const communityId = searchParams.get('communityId') || 'demo-community-001'

  const { data, isLoading } = useQuery({
    queryKey: ['graph', communityId],
    queryFn: () => api.getCommunityGraph(communityId),
  })

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Community Influence Graph</h1>
          <p className="text-gray-600">
            Visualizing influence relationships for {communityId}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading graph...</p>
          </div>
        ) : data ? (
          <>
            <div className="mb-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Network Statistics</h2>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{data.nodes.length}</div>
                  <div className="text-sm text-gray-600">Nodes</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{data.edges.length}</div>
                  <div className="text-sm text-gray-600">Edges</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-600">
                    {(data.edges.length / data.nodes.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Degree</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">
                    {(
                      (data.edges.length / (data.nodes.length * (data.nodes.length - 1))) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Density</div>
                </div>
              </div>
            </div>

            <ForceGraph nodes={data.nodes} edges={data.edges} width={1200} height={700} />

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Drag nodes to rearrange the graph. Scroll to zoom in/out.
                Node size represents influence score. Edge thickness and opacity represent
                connection strength.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-red-500">Failed to load graph data</p>
          </div>
        )}
      </div>
    </main>
  )
}
