'use client'

import React, { useMemo } from 'react'
import styles from './flowchart.module.css'

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

type Phase = 'setup' | 'loop' | 'done'

const phaseColors: Record<Phase, { bg: string; border: string }> = {
  setup: { bg: '#111827', border: '#60a5fa' },
  loop: { bg: '#0f172a', border: '#a78bfa' },
  done: { bg: '#0f172a', border: '#22c55e' },
}

const nodeSize = { w: 240, h: 86 }
const xSpacing = 280
const yBase = 60

type UiNode = {
  id: string
  title: string
  description: string
  phase: Phase
  status: 'pending' | 'active' | 'done'
  position: { x: number; y: number }
}

type UiEdge = {
  id: string
  source: UiNode
  target: UiNode
  status: 'pending' | 'active' | 'done'
}

function NodeCard({
  title,
  description,
  phase,
  status,
}: {
  title: string
  description?: string
  phase: Phase
  status: 'pending' | 'active' | 'done'
}) {
  const colors = phaseColors[phase]
  const isActive = status === 'active'
  const isDone = status === 'done'
  return (
    <div
      className={styles.flowNode}
      style={{
        background: colors.bg,
        borderColor: isActive ? '#60a5fa' : isDone ? '#22c55e' : colors.border,
      }}
    >
      <div className={styles.flowNodeTitle}>{title}</div>
      {description ? <div className={styles.flowNodeDesc}>{description}</div> : null}
      <div className={styles.flowNodePill}>
        {isDone ? 'Done' : isActive ? 'Running' : 'Pending'}
      </div>
    </div>
  )
}

export function RalphFlowchart({ prd, currentStep, totalSteps }: Props) {
  const stories =
    prd?.userStories && prd.userStories.length > 0
      ? prd.userStories
      : Array.from({ length: totalSteps || 5 }).map((_, idx) => ({
          id: `STEP-${idx + 1}`,
          title: `Step ${idx + 1}`,
          description: '',
        }))

  const steps = useMemo(
    () => [
      { id: 'start', title: 'Start', description: 'Kick off loop', phase: 'setup' as Phase },
      ...stories.map((s, idx) => ({
        id: s.id || `story-${idx + 1}`,
        title: s.title || `Story ${idx + 1}`,
        description: s.description || '',
        phase: 'loop' as Phase,
      })),
      { id: 'done', title: 'Done', description: 'All stories complete', phase: 'done' as Phase },
    ],
    [stories]
  )

  const activeIndex = Math.min(Math.max(currentStep, 1), steps.length)

  const nodes: UiNode[] = steps.map((step, idx) => {
    const status =
      idx + 1 < activeIndex ? 'done' : idx + 1 === activeIndex ? 'active' : 'pending'
    const x = idx * xSpacing
    const y = yBase + (idx % 2) * 140
    return {
      id: step.id,
      title: step.title,
      description: step.description,
      phase: step.phase,
      status,
      position: { x, y },
    }
  })

  const edges: UiEdge[] = steps.slice(0, -1).map((_, idx) => {
    const source = nodes[idx]
    const target = nodes[idx + 1]
    const status =
      idx + 1 < activeIndex ? 'done' : idx + 1 === activeIndex ? 'active' : 'pending'
    return { id: `e-${source.id}-${target.id}`, source, target, status }
  })

  const canvasWidth = Math.max(steps.length * xSpacing, 900)
  const canvasHeight = 320

  return (
    <>
      <div className={styles.flowWrapper}>
        <div className={styles.scrollOuter}>
          <div
            className={styles.flowInner}
            style={{ minWidth: canvasWidth, height: canvasHeight, position: 'relative' }}
          >
            <svg className={styles.edgeLayer} width={canvasWidth} height={canvasHeight}>
              <defs>
                <marker
                  id="arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="10"
                  refY="5"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="#334155" />
                </marker>
              </defs>
              {edges.map((edge) => {
                const { source, target, status } = edge
                const color =
                  status === 'done' ? '#22c55e' : status === 'active' ? '#60a5fa' : '#4b5563'
                const x1 = source.position.x + nodeSize.w
                const y1 = source.position.y + nodeSize.h / 2
                const x2 = target.position.x
                const y2 = target.position.y + nodeSize.h / 2
                return (
                  <line
                    key={edge.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={3}
                    strokeLinecap="round"
                    markerEnd="url(#arrow)"
                  />
                )
              })}
            </svg>

            {nodes.map((n) => (
              <div
                key={n.id}
                className={styles.nodeWrapper}
                style={{
                  left: n.position.x,
                  top: n.position.y,
                  width: nodeSize.w,
                  height: nodeSize.h,
                }}
              >
                <NodeCard
                  title={n.title}
                  description={n.description}
                  phase={n.phase}
                  status={n.status}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.debugPanel}>
        <div className={styles.debugTitle}>
          Flow debug ({nodes.length} nodes / {edges.length} edges)
        </div>
        <div className={styles.debugList}>
          {nodes.map((n) => (
            <div key={n.id} className={styles.debugRow}>
              <span className={styles.debugId}>{n.id}</span>
              <span>
                x: {Math.round(n.position.x)} y: {Math.round(n.position.y)}
              </span>
              <span>Status: {n.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
