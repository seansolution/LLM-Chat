/**
 * Regression Test Generator Script
 * 
 * Generates Jest test files from historical chat logs
 * 
 * Usage:
 *   npx ts-node scripts/generate-regression-tests.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  convertLogsToTests,
  groupTestsByIntent,
  generateJestTests,
  generateFullRegressionTests,
} from '../app/api/chat/regression-test-generator'
import { historicalChatLogs } from '../app/api/chat/chat-logs'

function main() {
  console.log('Generating regression tests from chat logs...\n')

  // Convert logs to test cases
  const testCases = convertLogsToTests(historicalChatLogs)
  console.log(`✓ Converted ${testCases.length} chat logs to test cases`)

  // Group by intent
  const testGroups = groupTestsByIntent(testCases)
  console.log(`✓ Grouped into ${testGroups.length} intent groups`)

  // Generate intent-only tests
  const intentTests = generateJestTests(testGroups)
  const intentTestPath = path.join(
    process.cwd(),
    'app/api/chat/regression-tests.regression.test.ts'
  )
  fs.writeFileSync(intentTestPath, intentTests, 'utf-8')
  console.log(`✓ Generated: ${intentTestPath}`)

  // Generate full regression tests
  const fullTests = generateFullRegressionTests(testCases)
  const fullTestPath = path.join(
    process.cwd(),
    'app/api/chat/regression-tests.full.test.ts'
  )
  fs.writeFileSync(fullTestPath, fullTests, 'utf-8')
  console.log(`✓ Generated: ${fullTestPath}`)

  // Summary
  console.log('\n=== Test Generation Summary ===')
  console.log(`Total test cases: ${testCases.length}`)
  console.log(`Intent groups: ${testGroups.length}`)
  testGroups.forEach(group => {
    console.log(`  - ${group.intent} (${group.persona}): ${group.tests.length} tests`)
  })

  console.log('\n✓ Regression tests generated successfully!')
  console.log('\nNext steps:')
  console.log('  1. Review generated test files')
  console.log('  2. Run: npm test regression-tests')
  console.log('  3. Commit test files to version control')
}

if (require.main === module) {
  main()
}
