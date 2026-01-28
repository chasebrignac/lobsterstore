'use client'

import { use, useState, useEffect } from 'react'
import { useProgressStream } from '@/hooks/useProgressStream'
import { RalphFlowchart } from '@/components/ralph-flow/RalphFlowchart'

export default function LoopPlaygroundPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [loop, setLoop] = useState<any>(null)
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [selectedApiKeyId, setSelectedApiKeyId] = useState('')
   const [selectedTool, setSelectedTool] = useState('claude-code')
  const [isExecuting, setIsExecuting] = useState(false)
  const { status, progress, currentStep, totalSteps, isConnected } =
    useProgressStream(isExecuting ? resolvedParams.id : undefined)

  useEffect(() => {
    // Fetch loop data
    fetch(`/api/loops/${resolvedParams.id}`)
      .then((res) => res.json())
      .then(setLoop)

    // Fetch API keys
    fetch('/api/api-keys')
      .then((res) => res.json())
      .then(setApiKeys)
  }, [resolvedParams.id])

  const handleExecute = async () => {
    if (!selectedApiKeyId) {
      alert('Please select an API key')
      return
    }

    setIsExecuting(true)

    try {
      const response = await fetch(`/api/loops/${resolvedParams.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeyId: selectedApiKeyId, tool: selectedTool }),
      })

      if (!response.ok) {
        throw new Error('Failed to start execution')
      }
    } catch (error) {
      console.error('Execution error:', error)
      alert('Failed to start execution')
      setIsExecuting(false)
    }
  }

  if (!loop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  const viewerUrl = `https://snarktank.github.io/ralph/#${encodeURIComponent(
    JSON.stringify(loop.prd)
  )}`

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{loop.name}</h1>
        {loop.description && (
          <p className="text-gray-600">{loop.description}</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Editor */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            PRD Configuration
          </h2>

          <div className="bg-white p-6 rounded-lg shadow-sm mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <select
                value={selectedApiKeyId}
                onChange={(e) => setSelectedApiKeyId(e.target.value)}
                disabled={isExecuting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an API key</option>
                {apiKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name} ({key.provider})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Runner
              </label>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                disabled={isExecuting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="claude-code">Claude Code</option>
                <option value="codex">Codex</option>
                <option value="opencode">OpenCode</option>
              </select>
            </div>

            <button
              onClick={handleExecute}
              disabled={isExecuting || !selectedApiKeyId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isExecuting ? 'Executing...' : 'Execute Loop'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">PRD JSON</h3>
            <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(loop.prd, null, 2)}
            </pre>
            <div className="mt-4 flex items-center justify-between gap-3">
              <a
                href={viewerUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm font-medium"
              >
                Open in Ralph viewer
              </a>
              <span className="text-xs text-gray-500">
                Diagram powered by snarktank.github.io/ralph
              </span>
            </div>
          </div>
        </div>

        {/* Right: Visualization */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Execution Progress
          </h2>

          {!isExecuting ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500 mb-4">
                Select an API key and click Execute to start
              </p>
              <RalphFlowchart
                prd={loop.prd}
                currentStep={currentStep}
                totalSteps={totalSteps}
              />
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${
                      status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : status === 'running'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-700 mb-1">
                    <span>Progress</span>
                    <span>
                      Step {currentStep} of {totalSteps}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>

                {isConnected ? (
                  <p className="text-xs text-green-600 mt-2">● Connected</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">○ Disconnected</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  Progress Log
                </h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-auto max-h-96">
                  {progress || 'Waiting for output...'}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Diagram</h3>
                  <a
                    href={viewerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Open full screen
                  </a>
                </div>
                <div className="mt-3">
                  <RalphFlowchart
                    prd={loop.prd}
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
