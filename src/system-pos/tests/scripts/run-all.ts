/**
 * Run all test scripts across all applications
 * Usage: npx tsx tests/scripts/run-all.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface TestResult {
  app: string;
  file: string;
  success: boolean;
  error?: string;
}

async function runAllTests() {
  const scriptsDir = __dirname;
  const rootDir = path.join(scriptsDir, '../..');
  
  console.log('🧪 Running all POS system tests...\n');
  console.log(`Root directory: ${rootDir}\n`);

  const apps = ['api', 'mobile', 'admin'];
  const results: TestResult[] = [];

  for (const app of apps) {
    const appDir = path.join(scriptsDir, app);
    
    if (!fs.existsSync(appDir)) {
      console.log(`⚠️  ${app} directory does not exist, skipping...`);
      continue;
    }

    const testFiles = fs
      .readdirSync(appDir)
      .filter((file) => file.startsWith('test-') && file.endsWith('.ts') && file !== 'run-all.ts')
      .sort();

    if (testFiles.length === 0) {
      console.log(`📭 No test files found in ${app}/`);
      continue;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 ${app.toUpperCase()} Tests (${testFiles.length} files)`);
    console.log('='.repeat(60));

    for (const file of testFiles) {
      const filePath = path.join(appDir, file);
      console.log(`\n📝 Running: ${app}/${file}`);

      try {
        // Change to root directory to ensure correct paths
        const { stdout, stderr } = await execAsync(`npx tsx "${filePath}"`, {
          cwd: rootDir,
        });

        if (stdout) {
          console.log(stdout);
        }
        if (stderr && !stderr.includes('Warning')) {
          console.error(stderr);
        }

        results.push({ app, file, success: true });
        console.log(`✅ ${app}/${file} - PASSED`);
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        results.push({ app, file, success: false, error: errorMessage });
        console.error(`❌ ${app}/${file} - FAILED`);
        console.error(`Error: ${errorMessage}`);
      }
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const byApp = results.reduce((acc, r) => {
    if (!acc[r.app]) {
      acc[r.app] = { total: 0, passed: 0, failed: 0 };
    }
    acc[r.app].total++;
    if (r.success) {
      acc[r.app].passed++;
    } else {
      acc[r.app].failed++;
    }
    return acc;
  }, {} as Record<string, { total: number; passed: number; failed: number }>);

  for (const [app, stats] of Object.entries(byApp)) {
    console.log(`\n${app.toUpperCase()}:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  ✅ Passed: ${stats.passed}`);
    console.log(`  ❌ Failed: ${stats.failed}`);
  }

  const total = results.length;
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\nOverall:`);
  console.log(`  Total: ${total}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log(`\nFailed tests:`);
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.app}/${r.file}: ${r.error}`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

