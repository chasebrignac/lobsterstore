'use client'

import React, { useMemo } from 'react'

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
  const steps = useMemo(
    () =>
      (stories.length > 0 ? stories : undefined) ??
      Array.from({ length: totalSteps || 10 }).map((_, i) => ({
        id: `STEP-${i + 1}`,
        title: `Step ${i + 1}`,
        description: '',
      })),
    [stories, totalSteps]
  )

  const nodes = steps.map((s, idx) => ({
    id: s.id ?? `STEP-${idx + 1}`,
    title: s.title || s.id || `Step ${idx + 1}`,
    description: s.description || '',
    status:
      idx + 1 < currentStep
        ? 'done'
        : idx + 1 === currentStep
        ? 'active'
        : 'pending',
  }))

  const width = Math.max(320, nodes.length * 180)
  const height = 160
  const nodeY = 70
  const nodeSpacing = Math.max(140, width / Math.max(nodes.length, 1))

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height}
        className="bg-gray-900 border border-gray-800 rounded-lg"
      >
        {/* Edges */}
        {nodes.map((_, idx) => {
          if (idx === 0) return null
          const x1 = nodeSpacing * (idx - 1) + 60
          const x2 = nodeSpacing * idx + 20
          const status = nodes[idx - 1].status === 'done' ? 'done' : 'pending'
          return (
            <line
              key={`edge-${idx}`}
              x1={x1}
              y1={nodeY}
              x2={x2}
              y2={nodeY}
              stroke={status === 'done' ? '#22c55e' : '#4b5563'}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node, idx) => {
          const x = nodeSpacing * idx + 20
          const isActive = node.status === 'active'
          const isDone = node.status === 'done'
          const fill = isActive
            ? '#1d4ed8'
            : isDone
            ? '#16a34a'
            : '#111827'
          const stroke = isActive ? '#60a5fa' : isDone ? '#22c55e' : '#4b5563'

          return (
            <g key={node.id} transform={`translate(${x},${nodeY})`}>
              <circle r={22} fill={fill} stroke={stroke} strokeWidth={2} />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fontSize="14"
                fill={isActive || isDone ? '#ffffff' : '#d1d5db'}
                fontWeight="700"
              >
                {idx + 1}
              </text>
              <text
                x="0"
                y="42"
                textAnchor="middle"
                fontSize="12"
                fill="#e5e7eb"
              >
                {node.title}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
