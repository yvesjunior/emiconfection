/**
 * Run all test scripts in the tests directory
 * Usage: npx tsx scripts/tests/run-all.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

async function runAllTests() {
  const testsDir = __dirname;
  const testFiles = fs
    .readdirSync(testsDir)
    .filter((file) => (file.startsWith('test-') || file.endsWith('.test.ts')) && file !== 'run-all.ts')
    .sort();

  console.log('🧪 Running all test scripts...\n');
  console.log(`Found ${testFiles.length} test files\n`);

  const results: Array<{ file: string; success: boolean; error?: string }> = [];

  for (const file of testFiles) {
    const filePath = path.join(testsDir, file);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Running: ${file}`);
    console.log('='.repeat(60));

    try {
      // Change to system-pos root directory to ensure correct paths
      const rootDir = path.join(__dirname, '../../../');
      const { stdout, stderr } = await execAsync(`npx tsx "${filePath}"`, {
        cwd: rootDir,
      });

      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.error(stderr);
      }

      results.push({ file, success: true });
      console.log(`✅ ${file} - PASSED`);
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      results.push({ file, success: false, error: errorMessage });
      console.error(`❌ ${file} - FAILED`);
      console.error(`Error: ${errorMessage}`);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Total: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log(`\nFailed tests:`);
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.file}`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

