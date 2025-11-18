'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function Home() {
  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => api.getScenarios('demo-community-001'),
  })

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Influence Graph Dynamics Simulator</h1>
          <p className="text-lg text-gray-600">
            Model and simulate how messages propagate through influence networks
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">📊</span>
                <span>Graph-based influence modeling with weighted edges</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🔄</span>
                <span>Discrete-time propagation simulation engine</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🎯</span>
                <span>What-if scenario testing and analysis</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📈</span>
                <span>Interactive force-directed graph visualization</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>View the demo community graph</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>Explore pre-configured scenarios</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>Run simulations and analyze results</span>
              </li>
            </ol>
          </section>
        </div>

        <section className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Demo Scenarios</h2>
            <Link
              href="/graph?communityId=demo-community-001"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Graph
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading scenarios...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {scenarios?.map((scenario) => (
                <Link
                  key={scenario.id}
                  href={`/scenarios/${scenario.id}`}
                  className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-2">{scenario.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {scenario.descriptionMarkdown?.split('\n')[0] || 'No description'}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Seeds: {scenario.initialSeedNodesJson.length}</span>
                    <span>Decay: {scenario.parametersJson.decayFactor}</span>
                    <span>Threshold: {scenario.parametersJson.activationThreshold}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
