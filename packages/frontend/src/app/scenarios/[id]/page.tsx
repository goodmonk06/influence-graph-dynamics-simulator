'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { ForceGraph } from '@/components/ForceGraph'

export default function ScenarioPage() {
  const params = useParams()
  const scenarioId = params.id as string
  const [currentIteration, setCurrentIteration] = useState(0)
  const [simulationData, setSimulationData] = useState<any>(null)

  const { data: scenario, isLoading: scenarioLoading } = useQuery({
    queryKey: ['scenario', scenarioId],
    queryFn: () => api.getScenario(scenarioId),
  })

  const { data: graph, isLoading: graphLoading } = useQuery({
    queryKey: ['graph', scenario?.communityId],
    queryFn: () => api.getCommunityGraph(scenario!.communityId),
    enabled: !!scenario,
  })

  const handleRunSimulation = async () => {
    try {
      const result = await api.runScenario(scenarioId)
      setSimulationData(result.result)
      setCurrentIteration(0)
    } catch (error) {
      console.error('Failed to run simulation:', error)
      alert('Failed to run simulation')
    }
  }

  const currentActiveNodes = simulationData
    ? new Set(simulationData.iterations[currentIteration]?.activeNodes || [])
    : scenario
    ? new Set(scenario.initialSeedNodesJson)
    : new Set()

  const isLoading = scenarioLoading || graphLoading

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          {scenario && (
            <>
              <h1 className="text-3xl font-bold mb-2">{scenario.name}</h1>
              {scenario.descriptionMarkdown && (
                <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
                  {scenario.descriptionMarkdown}
                </div>
              )}
            </>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading scenario...</p>
          </div>
        ) : scenario && graph ? (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Parameters</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Decay Factor:</dt>
                    <dd className="font-semibold">{scenario.parametersJson.decayFactor}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Max Iterations:</dt>
                    <dd className="font-semibold">{scenario.parametersJson.maxIterations}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Activation Threshold:</dt>
                    <dd className="font-semibold">
                      {scenario.parametersJson.activationThreshold}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Allow Reactivation:</dt>
                    <dd className="font-semibold">
                      {scenario.parametersJson.allowReactivation ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Seed Nodes:</dt>
                    <dd className="font-semibold">{scenario.initialSeedNodesJson.length}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Actions</h2>
                <button
                  onClick={handleRunSimulation}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold mb-4"
                >
                  Run Simulation
                </button>
                {simulationData && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Iterations:</span>
                      <span className="font-semibold">
                        {simulationData.totalIterations}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Final Active Nodes:</span>
                      <span className="font-semibold">
                        {simulationData.finalActiveNodes.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Convergence:</span>
                      <span className="font-semibold text-xs">
                        {simulationData.convergenceReason.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {simulationData && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Iteration Control - Step {currentIteration} of {simulationData.totalIterations}
                </h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentIteration(Math.max(0, currentIteration - 1))}
                    disabled={currentIteration === 0}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                  >
                    Previous
                  </button>
                  <input
                    type="range"
                    min="0"
                    max={simulationData.totalIterations}
                    value={currentIteration}
                    onChange={(e) => setCurrentIteration(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <button
                    onClick={() =>
                      setCurrentIteration(
                        Math.min(simulationData.totalIterations, currentIteration + 1)
                      )
                    }
                    disabled={currentIteration === simulationData.totalIterations}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                  >
                    Next
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {simulationData.iterations[currentIteration]?.totalActiveCount || 0}
                    </div>
                    <div className="text-gray-600">Active Nodes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {simulationData.iterations[currentIteration]?.newlyActivatedNodes
                        ?.length || 0}
                    </div>
                    <div className="text-gray-600">Newly Activated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {(
                        ((simulationData.iterations[currentIteration]?.totalActiveCount || 0) /
                          graph.nodes.length) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-gray-600">Coverage</div>
                  </div>
                </div>
              </div>
            )}

            <ForceGraph
              nodes={graph.nodes}
              edges={graph.edges}
              activeNodes={currentActiveNodes}
              width={1200}
              height={700}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-red-500">Failed to load scenario data</p>
          </div>
        )}
      </div>
    </main>
  )
}
