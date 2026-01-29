'use client'

import React, { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
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
const xSpacing = 260
const yBase = 80

function makeNode(
  stepId: string,
  title: string,
  description: string,
  phase: Phase,
  status: 'pending' | 'active' | 'done',
  index: number
): Node {
  const colors = phaseColors[phase]
  const isActive = status === 'active'
  const isDone = status === 'done'

  return {
    id: stepId,
    type: 'custom',
    position: { x: index * xSpacing, y: yBase },
    data: { title, description, phase, status },
    draggable: false,
    style: {
      width: nodeSize.w,
      height: nodeSize.h,
      opacity: 1,
      background: colors.bg,
      border: `2px solid ${isActive ? '#60a5fa' : isDone ? '#22c55e' : colors.border}`,
      boxShadow: isActive
        ? '0 0 0 2px #1d4ed850, 0 10px 30px rgba(0,0,0,0.35)'
        : '0 6px 18px rgba(0,0,0,0.2)',
      transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
      transform: isActive ? 'translateY(-4px)' : 'none',
    },
  }
}

function makeEdge(
  source: string,
  target: string,
  status: 'pending' | 'active' | 'done'
): Edge {
  const color =
    status === 'done' ? '#22c55e' : status === 'active' ? '#60a5fa' : '#4b5563'
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    animated: status !== 'pending',
    style: {
      stroke: color,
      strokeWidth: 3,
      opacity: 1,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color },
  }
}

function CustomNode({
  data,
}: {
  data: { title: string; description?: string; phase: Phase; status: string }
}) {
  const colors = phaseColors[data.phase]
  const isActive = data.status === 'active'
  const isDone = data.status === 'done'
  return (
    <div
      className={styles.flowNode}
      style={{
        background: colors.bg,
        borderColor: isActive ? '#60a5fa' : isDone ? '#22c55e' : colors.border,
      }}
    >
      <div className={styles.flowNodeTitle}>{data.title}</div>
      {data.description ? (
        <div className={styles.flowNodeDesc}>{data.description}</div>
      ) : null}
      <div className={styles.flowNodePill}>
        {isDone ? 'Done' : isActive ? 'Running' : 'Pending'}
      </div>
    </div>
  )
}

const nodeTypes = { custom: CustomNode }

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

  const nodes: Node[] = steps.map((step, idx) => {
    const status =
      idx + 1 < activeIndex ? 'done' : idx + 1 === activeIndex ? 'active' : 'pending'
    return makeNode(step.id, step.title, step.description, step.phase, status, idx)
  })

  const edges: Edge[] = steps.slice(0, -1).map((step, idx) => {
    const next = steps[idx + 1]
    const status =
      idx + 1 < activeIndex ? 'done' : idx + 1 === activeIndex ? 'active' : 'pending'
    return makeEdge(step.id, next.id, status)
  })

  return (
    <div className={styles.flowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        fitView
        fitViewOptions={{ padding: 0.25 }}
        zoomOnDoubleClick={false}
        panOnDrag
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#334155" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
