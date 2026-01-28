'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewLoopPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prdJson: JSON.stringify(
      {
        project: 'My Project',
        userStories: [
          {
            id: 'US-001',
            description: 'Create a README.md file',
            acceptanceCriteria: ['README exists', 'Contains project description'],
            passes: false,
          },
        ],
      },
      null,
      2
    ),
    isPublic: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const prd = JSON.parse(formData.prdJson)

      const response = await fetch('/api/loops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          prd,
          isPublic: formData.isPublic,
        }),
      })

      if (response.ok) {
        const loop = await response.json()
        router.push(`/loops/${loop.id}`)
      } else {
        alert('Failed to create loop')
      }
    } catch (error) {
      alert('Invalid JSON in PRD')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Loop</h1>
        <p className="text-gray-600">
          Define a Ralph workflow with user stories to implement
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loop Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Add authentication to app"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Implement user authentication with JWT tokens"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PRD JSON
              </label>
              <textarea
                value={formData.prdJson}
                onChange={(e) =>
                  setFormData({ ...formData, prdJson: e.target.value })
                }
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Define your project requirements and user stories in JSON format
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) =>
                  setFormData({ ...formData, isPublic: e.target.checked })
                }
                className="mr-2"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this loop public (others can view and fork it)
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Loop
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
