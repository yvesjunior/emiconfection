/**
 * Run all mobile app test scripts
 * Usage: npx tsx tests/run-all.ts
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
    .filter((file) => 
      (file.startsWith('test-') || file.endsWith('.test.ts')) && 
      file !== 'run-all.ts' &&
      file !== 'run-detox-tests.ts' &&
      !file.endsWith('.md')
    )
    .sort();

  console.log('🧪 Running all mobile app test scripts...\n');
  console.log(`Found ${testFiles.length} integration test files\n`);

  const results: Array<{ file: string; success: boolean; error?: string }> = [];

  for (const file of testFiles) {
    const filePath = path.join(testsDir, file);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📱 Running: ${file}`);
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

  // Optionally run Detox E2E tests
  const includeE2E = process.argv.includes('--e2e') || process.argv.includes('--detox');
  const skipBuild = process.argv.includes('--skip-build') || process.argv.includes('--no-build');
  
  if (includeE2E) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📱 Running Detox E2E Tests');
    console.log('='.repeat(60));
    if (skipBuild) {
      console.log('⏭️  Build will be skipped (using existing build)');
    } else {
      console.log('⚠️  Note: E2E tests require emulator/simulator and native app build');
    }
    console.log('');
    
    try {
      const { runDetoxTests } = await import('./run-detox-tests');
      const e2eResult = await runDetoxTests('ios', 'debug', skipBuild);
      results.push({
        file: 'Detox E2E Tests',
        success: e2eResult.success,
        error: e2eResult.error,
      });
      
      if (e2eResult.success) {
        console.log(`✅ Detox E2E Tests - PASSED`);
      } else {
        console.error(`❌ Detox E2E Tests - FAILED`);
        if (e2eResult.error) {
          console.error(`Error: ${e2eResult.error}`);
        }
      }
    } catch (e2eError: any) {
      console.error(`❌ Detox E2E Tests - FAILED`);
      console.error(`Error: ${e2eError.message}`);
      results.push({
        file: 'Detox E2E Tests',
        success: false,
        error: e2eError.message,
      });
    }
  } else {
    console.log(`\n💡 Tip: Add --e2e flag to include Detox E2E tests`);
    console.log(`💡 Tip: Add --skip-build flag to skip app build (faster, requires existing build)`);
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
        console.log(`  - ${r.file}${r.error ? `: ${r.error}` : ''}`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

