import { test, expect } from '@playwright/test'

test.describe('LobsterLoop End-to-End Test', () => {
  test.setTimeout(600000) // 10 minutes for full loop execution

  test('should complete full loop execution flow', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const testApiKey = process.env.ANTHROPIC_API_KEY

    if (!testApiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for E2E tests')
    }

    // Step 1: Navigate to home page
    console.log('Step 1: Navigating to homepage...')
    await page.goto(baseUrl)
    await expect(page).toHaveTitle(/LobsterLoop/)

    // Step 2: Click "Get started for free" or "Sign in"
    console.log('Step 2: Clicking sign in...')
    const signInButton = page.locator('a[href*="/login"], a[href*="/api/auth/signin"]').first()
    await signInButton.click()

    // Step 3: Wait for GitHub OAuth redirect
    console.log('Step 3: Waiting for GitHub OAuth...')
    await page.waitForURL('**/github.com/**', { timeout: 10000 }).catch(() => {
      console.log('Not redirected to GitHub, might already be authenticated')
    })

    // If on GitHub OAuth page, handle authorization
    if (page.url().includes('github.com')) {
      // Click "Authorize" if needed
      const authorizeButton = page.locator('button:has-text("Authorize")').first()
      if (await authorizeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await authorizeButton.click()
      }
    }

    // Step 4: Wait for dashboard
    console.log('Step 4: Waiting for dashboard...')
    await page.waitForURL('**/dashboard', { timeout: 30000 })
    await expect(page.locator('h1, h2').filter({ hasText: /Dashboard|Welcome/ })).toBeVisible()

    // Step 5: Navigate to API Keys
    console.log('Step 5: Adding API key...')
    const apiKeysLink = page.locator('a[href*="/api-keys"], a:has-text("API Keys")').first()
    await apiKeysLink.click()
    await page.waitForURL('**/api-keys', { timeout: 10000 })

    // Check if we already have an API key
    const existingKey = page.locator('text=/Test.*Key|Default/i').first()
    const hasExistingKey = await existingKey.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasExistingKey) {
      // Step 6: Add API key
      console.log('Step 6: Creating new API key...')
      const addKeyButton = page.locator('button:has-text("Add"), button:has-text("New")').first()
      await addKeyButton.click()

      // Fill in API key form
      await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill('E2E Test Key')

      // Select provider (Anthropic)
      const providerSelect = page.locator('select[name="provider"], select').first()
      await providerSelect.selectOption('anthropic')

      // Enter API key
      await page.locator('input[name="apiKey"], input[type="password"], textarea').first().fill(testApiKey)

      // Check "Set as default" if available
      const defaultCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /default/i }).first()
      if (await defaultCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await defaultCheckbox.check()
      }

      // Save
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Add")').first()
      await saveButton.click()

      // Wait for success message or redirect
      await page.waitForTimeout(2000)
    }

    // Step 7: Navigate to My Loops
    console.log('Step 7: Creating test loop...')
    const myLoopsLink = page.locator('a[href*="/loops"], a:has-text("My Loops")').first()
    await myLoopsLink.click()
    await page.waitForURL('**/loops', { timeout: 10000 })

    // Step 8: Create a new loop
    console.log('Step 8: Creating new loop...')
    const createLoopButton = page.locator('button:has-text("Create"), a:has-text("New Loop")').first()
    await createLoopButton.click()

    // Fill in loop details
    await page.locator('input[name="name"]').first().fill('E2E Test Loop')
    await page.locator('input[name="description"], textarea[name="description"]').first().fill('Automated test loop')

    // Set simple PRD JSON
    const prdTextarea = page.locator('textarea[name="prd"], textarea').filter({ hasText: /projectName|userStories/ }).first()
    const simplePRD = JSON.stringify({
      projectName: 'E2E Test Project',
      userStories: [
        {
          id: 'US-001',
          description: 'Create a README.md file with project name',
          acceptanceCriteria: [
            'README.md exists',
            'Contains project name "E2E Test Project"'
          ],
          passes: false
        }
      ]
    }, null, 2)

    if (await prdTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await prdTextarea.fill(simplePRD)
    }

    // Save loop
    const saveLoopButton = page.locator('button:has-text("Create"), button:has-text("Save")').first()
    await saveLoopButton.click()

    // Wait for loop to be created
    await page.waitForTimeout(2000)

    // Step 9: Execute the loop
    console.log('Step 9: Executing loop...')
    const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run")').first()
    await executeButton.click()

    // Select API key if prompted
    const apiKeySelect = page.locator('select').filter({ hasText: /key|api/i }).first()
    if (await apiKeySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await apiKeySelect.selectOption({ index: 0 })
    }

    // Confirm execution
    const confirmButton = page.locator('button:has-text("Start"), button:has-text("Execute"), button:has-text("Confirm")').first()
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click()
    }

    // Step 10: Monitor execution progress
    console.log('Step 10: Monitoring execution (this may take 5-10 minutes)...')

    // Wait for status to change to "running" or "queued"
    const statusElement = page.locator('text=/running|queued|executing/i').first()
    await expect(statusElement).toBeVisible({ timeout: 30000 })
    console.log('✓ Execution started')

    // Poll for completion (max 10 minutes)
    const startTime = Date.now()
    const maxWaitTime = 600000 // 10 minutes
    let completed = false

    while (Date.now() - startTime < maxWaitTime && !completed) {
      await page.waitForTimeout(10000) // Check every 10 seconds

      // Check if completed
      const completedElement = page.locator('text=/completed|success|done/i').first()
      completed = await completedElement.isVisible({ timeout: 1000 }).catch(() => false)

      if (!completed) {
        // Check if failed
        const failedElement = page.locator('text=/failed|error/i').first()
        const failed = await failedElement.isVisible({ timeout: 1000 }).catch(() => false)

        if (failed) {
          throw new Error('Loop execution failed')
        }

        // Log progress if available
        const progressElement = page.locator('[data-testid="progress"], .progress, pre').first()
        if (await progressElement.isVisible({ timeout: 1000 }).catch(() => false)) {
          const progressText = await progressElement.textContent()
          console.log(`Progress: ${progressText?.substring(0, 100)}...`)
        }
      }
    }

    if (!completed) {
      throw new Error('Execution did not complete within 10 minutes')
    }

    console.log('✓ Execution completed successfully!')

    // Step 11: Verify results
    console.log('Step 11: Verifying results...')

    // Check that the loop shows as completed
    await expect(page.locator('text=/completed|success/i').first()).toBeVisible()

    // Check for success indicators
    const successIndicators = [
      page.locator('text=/passes.*true/i'),
      page.locator('[data-testid="success"]'),
      page.locator('.success, .completed')
    ]

    let foundSuccess = false
    for (const indicator of successIndicators) {
      if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundSuccess = true
        break
      }
    }

    expect(foundSuccess).toBe(true)
    console.log('✅ E2E test passed! Loop executed successfully.')
  })

  test('should handle API key errors gracefully', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

    await page.goto(baseUrl)

    // Try to create loop without API key
    // This should show an error message

    // TODO: Implement negative test cases
  })

  test('should show warm instance availability', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

    // Check that instances are pre-warmed
    // Execution should start quickly (under 30 seconds vs 2+ minutes cold start)

    console.log('Testing warm instance pool...')

    // TODO: Add test to verify warm pool reduces startup time
  })
})
