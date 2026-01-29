'use client'

import React from 'react'

type RalphPrd = {
  userStories?: {
    id?: string
    title?: string
    description?: string
  }[]
}

type Props = {
  prd: RalphPrd
  currentStep: number
  totalSteps: number
}

export function RalphFlowchart({ prd, currentStep, totalSteps }: Props) {
  const stories = prd?.userStories ?? []
  const steps =
    stories.length > 0
      ? stories
      : Array.from({ length: totalSteps || 10 }).map((_, i) => ({
          id: `STEP-${i + 1}`,
          title: `Step ${i + 1}`,
          description: '',
        }))

  return (
    <div className="space-y-3">
      {steps.map((story, idx) => {
        const stepNumber = idx + 1
        const isCompleted = stepNumber < currentStep
        const isActive = stepNumber === currentStep
        return (
          <div key={story.id ?? stepNumber} className="relative pl-4">
            {idx > 0 && (
              <div
                className={`absolute left-3 top-0 h-full w-0.5 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
            <div
              className={`relative border rounded-lg p-3 transition-colors ${
                isActive
                  ? 'border-blue-500 bg-blue-50'
                  : isCompleted
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {stepNumber}
                  </span>
                  <div className="font-semibold text-gray-900">
                    {story.title || story.id || `Step ${stepNumber}`}
                  </div>
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  {isActive ? 'Running' : isCompleted ? 'Done' : 'Pending'}
                </div>
              </div>
              {story.description && (
                <p className="mt-2 text-sm text-gray-700">{story.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
