/**
 * Run all Detox E2E tests
 * This script runs all Detox E2E tests for the mobile app
 * 
 * Usage (via shell script - recommended):
 *   ./tests/run-detox.sh ios debug
 *   ./tests/run-detox.sh ios debug --skip-build
 * 
 * Direct usage (not recommended):
 *   npx tsx tests/scripts/mobile/e2e/run-all.ts [ios|android] [debug|release] [--skip-build]
 */

import { runDetoxTests } from '../run-detox-tests';

async function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || 'ios';
  const config = args[1] || 'debug';
  const skipBuild = args.includes('--skip-build') || args.includes('--no-build');

  if (!['ios', 'android'].includes(platform)) {
    console.error('❌ Invalid platform. Use "ios" or "android"');
    process.exit(1);
  }

  if (!['debug', 'release'].includes(config)) {
    console.error('❌ Invalid config. Use "debug" or "release"');
    process.exit(1);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📱 Detox E2E Tests - ${platform.toUpperCase()} (${config.toUpperCase()})`);
  console.log('='.repeat(70));
  if (skipBuild) {
    console.log('⏭️  Build will be skipped (using existing build)');
  } else {
    console.log('⚠️  Note: Requires emulator/simulator and native app build');
  }
  console.log('');

  const result = await runDetoxTests(platform, config, skipBuild);

  if (result.success) {
    console.log(`\n✅ All Detox E2E tests passed! (${(result.duration! / 1000).toFixed(2)}s)`);
    process.exit(0);
  } else {
    console.log(`\n❌ Detox E2E tests failed`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

