/**
 * Run Complete Test Suite
 * Exécute tous les tests basés sur TEST_SUITE.md
 * 
 * Run: npx tsx tests/scripts/run-test-suite.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

const testSuites = [
  { name: 'Authentication', file: 'api/test-authentication.ts' },
  { name: 'Permissions', file: 'api/test-permissions.ts' },
  { name: 'Stock Transfers', file: 'api/test-transfers-workflow.ts' },
  { name: 'Alerts System', file: 'api/test-alerts-system.ts' },
  { name: 'Alerts (Unit)', file: 'api/alerts.test.ts' },
  { name: 'Transfers (Unit)', file: 'api/transfers.test.ts' },
];

async function runTestSuite() {
  const scriptsDir = __dirname;
  const rootDir = path.join(scriptsDir, '../..');
  
  console.log('🧪 Running Complete Test Suite');
  console.log('='.repeat(60));
  console.log(`Root directory: ${rootDir}\n`);
  
  const results: Array<{ name: string; success: boolean; error?: string }> = [];
  
  for (const suite of testSuites) {
    const filePath = path.join(scriptsDir, suite.file);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 ${suite.name}`);
    console.log('='.repeat(60));
    
    try {
      const { stdout, stderr } = await execAsync(`npx tsx "${filePath}"`, {
        cwd: rootDir,
      });
      
      if (stdout) {
        console.log(stdout);
      }
      if (stderr && !stderr.includes('Warning')) {
        console.error(stderr);
      }
      
      results.push({ name: suite.name, success: true });
      console.log(`\n✅ ${suite.name} - PASSED`);
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      results.push({ name: suite.name, success: false, error: errorMessage });
      console.error(`\n❌ ${suite.name} - FAILED`);
      console.error(`Error: ${errorMessage}`);
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Complete Test Suite Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\nTotal Suites: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log(`\nFailed suites:`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}`);
    });
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed');
  console.log('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

