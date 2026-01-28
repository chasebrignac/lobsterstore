export function pollExecutionProgress(progress: string): {
  currentStep: number
  totalSteps: number
  isComplete: boolean
} {
  const totalSteps = 10 // Ralph workflow has 10 steps
  const currentStep = parseCurrentStep(progress)
  const isComplete = isExecutionComplete(progress)

  return { currentStep, totalSteps, isComplete }
}

export function parseCurrentStep(progress: string): number {
  // Try to find user story IDs (US-001, US-002, etc.)
  const storyMatches = progress.match(/US-\d{3}/g)
  const uniqueStories = storyMatches ? new Set(storyMatches).size : 0

  // Count "passes: true" entries
  const passMatches = progress.match(/passes:\s*true/g)
  const completedStories = passMatches ? passMatches.length : 0

  // Map to Ralph's 10-step workflow
  // Steps: 1-Initialize, 2-Load PRD, 3-Pick Story, 4-Plan, 5-Implement,
  //        6-Test, 7-Commit, 8-Update PRD, 9-Check Complete, 10-Done

  if (completedStories === 0) {
    // Still in initialization phase
    if (progress.includes('Loading prd.json')) return 2
    if (progress.includes('Picking user story')) return 3
    return 1
  }

  // Map completed stories to workflow steps
  // Each story goes through: pick(3) -> plan(4) -> implement(5) -> test(6) -> commit(7) -> update(8)
  const storyPhase = completedStories * 6 // 6 steps per story roughly
  return Math.min(Math.floor(storyPhase / uniqueStories) + 2, 9)
}

export function isExecutionComplete(progress: string): boolean {
  return (
    progress.includes('<promise>COMPLETE</promise>') ||
    progress.includes('Execution complete') ||
    progress.includes('All user stories completed')
  )
}

export function extractCurrentStoryId(progress: string): string | null {
  // Extract the most recent user story being worked on
  const lines = progress.split('\n').reverse()

  for (const line of lines) {
    const match = line.match(/US-(\d{3})/)
    if (match) {
      return match[0]
    }
  }

  return null
}
