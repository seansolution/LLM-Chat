/**
 * Safety Gates Runner
 * 
 * Runs safety gate checks and fails the build if thresholds are not met.
 * 
 * Usage:
 *   npx ts-node --esm scripts/run-safety-gates.ts
 *   OR
 *   pnpm run test:safety-gates
 * 
 * Exit codes:
 *   0 - All gates passed
 *   1 - One or more gates failed
 */

import { runSafetyGates } from '../app/api/chat/safety-gates.js'
import { exampleChatLogs } from '../app/api/chat/dashboard.test-data.js'

function main() {
  console.log('Running safety gates...\n')

  // Use example chat logs for now
  // In production, load from database/API
  const logs = exampleChatLogs

  if (logs.length === 0) {
    console.error('❌ No chat logs found. Cannot run safety gates.')
    process.exit(1)
  }

  console.log(`Analyzing ${logs.length} chat log entries...\n`)

  // Run safety gates (exits with code 1 if failed)
  runSafetyGates(logs)
}

if (require.main === module) {
  main()
}
