'use client'

import { useState, useEffect } from 'react'

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    provider: 'anthropic',
    apiKey: '',
  })

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    const response = await fetch('/api/api-keys')
    const data = await response.json()
    setApiKeys(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      setFormData({ name: '', provider: 'anthropic', apiKey: '' })
      setIsAdding(false)
      fetchApiKeys()
    } else {
      alert('Failed to add API key')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    const response = await fetch(`/api/api-keys?id=${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      fetchApiKeys()
    } else {
      alert('Failed to delete API key')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
        <p className="text-gray-600">
          Manage your AI provider API keys securely stored in AWS Secrets Manager
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {isAdding ? 'Cancel' : 'Add API Key'}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-sm mb-6"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My Anthropic Key"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                value={formData.provider}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI</option>
                <option value="xai">xAI</option>
                <option value="kimi">Kimi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                placeholder="sk-ant-..."
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your API key will be securely stored in AWS Secrets Manager
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add API Key
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-500">No API keys yet</p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{key.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{key.provider}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Added {new Date(key.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => handleDelete(key.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
