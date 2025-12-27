/**
 * Run Detox E2E Tests
 * Runs Detox tests for the mobile app (requires emulator/simulator)
 * 
 * Usage: npx tsx tests/scripts/mobile/run-detox-tests.ts [ios|android] [debug|release]
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

interface DetoxTestResult {
  platform: string;
  config: string;
  success: boolean;
  error?: string;
  duration?: number;
}

async function checkDetoxInstalled(mobileDir: string): Promise<boolean> {
  try {
    // Check if detox is installed in the mobile app's node_modules
    const detoxPath = path.join(mobileDir, 'node_modules', 'detox');
    if (fs.existsSync(detoxPath)) {
      return true;
    }
    // Also check root node_modules (workspace setup)
    const rootDir = path.join(mobileDir, '../..');
    const rootDetoxPath = path.join(rootDir, 'node_modules', 'detox');
    return fs.existsSync(rootDetoxPath);
  } catch {
    return false;
  }
}

async function checkAPI(): Promise<boolean> {
  try {
    const axios = (await import('axios')).default;
    await axios.get('http://localhost:3001/health', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function checkEmulator(platform: string): Promise<boolean> {
  if (platform === 'ios') {
    try {
      const { stdout } = await execAsync('xcrun simctl list devices available', { timeout: 5000 });
      return stdout.includes('iPhone');
    } catch {
      return false;
    }
  } else {
    try {
      await execAsync('which emulator', { timeout: 5000 });
      const { stdout } = await execAsync('adb devices', { timeout: 5000 });
      return stdout.includes('emulator') || stdout.includes('device');
    } catch {
      return false;
    }
  }
}

async function runDetoxTests(platform: string = 'ios', config: string = 'debug', skipBuild: boolean = false): Promise<DetoxTestResult> {
  const startTime = Date.now();
  const scriptsDir = __dirname;
  const mobileDir = path.join(scriptsDir, '../../../apps/mobile');
  const rootDir = path.join(scriptsDir, '../../..');
  const configName = `${platform}.${platform === 'ios' ? 'sim' : 'emu'}.${config}`;
  
  // Find Detox binary (check mobile first, then root)
  let detoxBinary = 'npx detox';
  const mobileDetoxBin = path.join(mobileDir, 'node_modules', '.bin', 'detox');
  const rootDetoxBin = path.join(rootDir, 'node_modules', '.bin', 'detox');
  if (fs.existsSync(mobileDetoxBin)) {
    detoxBinary = mobileDetoxBin;
  } else if (fs.existsSync(rootDetoxBin)) {
    detoxBinary = rootDetoxBin;
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📱 [Detox E2E] ${platform.toUpperCase()} - ${config.toUpperCase()}`);
  console.log('='.repeat(70));

  try {
    // Check prerequisites
    console.log('🔍 Checking prerequisites...');
    
    // Verify mobile directory exists
    if (!fs.existsSync(mobileDir)) {
      throw new Error(`Mobile app directory not found: ${mobileDir}`);
    }

    const detoxInstalled = await checkDetoxInstalled(mobileDir);
    if (!detoxInstalled) {
      console.log('⚠️  Detox not found in mobile app. Installing...');
      console.log(`   Installing in: ${mobileDir}`);
      console.log('   Note: Skipping postinstall scripts to avoid framework build issues');
      console.log('   Framework will be built when needed...');
      
      try {
        // Install without running postinstall scripts (framework build often fails)
        await execAsync('npm install --save-dev detox jest-circus --ignore-scripts', {
          cwd: mobileDir,
          timeout: 300000, // 5 minutes for installation
          env: { ...process.env },
        });
        console.log('✅ Detox installed successfully (without postinstall scripts)');
        console.log('   Framework will be built automatically when running tests');
      } catch (installError: any) {
        console.error('\n❌ Detox installation failed');
        console.error('   This is often due to:');
        console.error('   1. Missing Xcode command line tools');
        console.error('   2. Network issues');
        console.error('\n   Try manually installing:');
        console.error(`   cd ${mobileDir}`);
        console.error('   npm install --save-dev detox jest-circus --ignore-scripts');
        throw new Error(`Detox installation failed: ${installError.message}`);
      }
    } else {
      console.log('✅ Detox is already installed');
    }

    const apiRunning = await checkAPI();
    if (!apiRunning) {
      throw new Error('API server is not running. Please start it with: cd apps/api && npm run dev');
    }

    const emulatorReady = await checkEmulator(platform);
    if (!emulatorReady) {
      throw new Error(`${platform === 'ios' ? 'iOS Simulator' : 'Android Emulator'} is not available. Please start one.`);
    }

    console.log('✅ Prerequisites met\n');

    // Build app (unless skipped)
    if (skipBuild) {
      console.log(`⏭️  Skipping build (--skip-build flag set)`);
      console.log(`   Using existing build for ${configName}\n`);
      
      // Verify app exists
      const appPath = platform === 'ios' 
        ? path.join(mobileDir, 'ios/build/Build/Products', config === 'release' ? 'Release-iphonesimulator' : 'Debug-iphonesimulator', 'emishops.app')
        : path.join(mobileDir, 'android/app/build/outputs/apk', config, `app-${config}.apk`);
      
      if (!fs.existsSync(appPath)) {
        console.warn(`⚠️  Warning: App not found at ${appPath}`);
        console.warn(`   Building anyway...\n`);
        skipBuild = false; // Force build if app doesn't exist
      } else {
        console.log(`✅ Found existing build at: ${appPath}\n`);
      }
    }
    
    if (!skipBuild) {
      console.log(`🔨 Building app for ${configName}...`);
      console.log('   This may take several minutes (building native app)...');
      try {
        const buildCmd = detoxBinary === 'npx detox' 
          ? `npx detox build --configuration ${configName}`
          : `${detoxBinary} build --configuration ${configName}`;
        await execAsync(buildCmd, {
          cwd: mobileDir,
          timeout: 900000, // 15 minutes for build (native builds can be slow)
          maxBuffer: 100 * 1024 * 1024, // 100MB buffer for build output (Xcode builds produce lots of output)
        });
        console.log('✅ Build successful\n');
      } catch (buildError: any) {
        console.error('❌ Build failed:', buildError.message);
        if (buildError.message.includes('maxBuffer')) {
          throw new Error(`Build output too large. This usually means the build is progressing but producing lots of output. Check the build manually: cd ${mobileDir} && ${detoxBinary} build --configuration ${configName}`);
        }
        throw new Error(`Build failed: ${buildError.message}`);
      }
    }

    // List test files from tests/scripts/mobile/e2e/ (source of truth)
    const e2eScriptsDir = path.join(scriptsDir, 'e2e');
    let testFiles: string[] = [];
    
    if (fs.existsSync(e2eScriptsDir)) {
      testFiles = fs.readdirSync(e2eScriptsDir)
        .filter(file => file.endsWith('.e2e.ts'))
        .map(file => path.join(e2eScriptsDir, file).replace(mobileDir + '/', ''))
        .sort();
      
      console.log(`\n🧪 Running all Detox E2E tests...`);
      console.log(`   Test files found: ${testFiles.length}`);
      if (testFiles.length === 0) {
        console.warn(`   ⚠️  No test files found`);
        console.warn(`   Expected location: ${e2eScriptsDir}`);
      } else {
        testFiles.forEach((file, index) => {
          const fileName = path.basename(file);
          console.log(`   ${index + 1}. ${fileName}`);
        });
      }
      console.log('');
    } else {
      console.error(`\n❌ E2E test directory not found: ${e2eScriptsDir}`);
      throw new Error(`E2E test directory not found: ${e2eScriptsDir}`);
    }

    // Run all tests
    const testCmd = detoxBinary === 'npx detox'
      ? `npx detox test --configuration ${configName} --cleanup`
      : `${detoxBinary} test --configuration ${configName} --cleanup`;
    const { stdout, stderr } = await execAsync(testCmd, {
      cwd: mobileDir,
      timeout: 900000, // 15 minutes for all tests
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for test output
    });

    const duration = Date.now() - startTime;
    const output = stdout + stderr;

    // Check for test failures
    const failedMatch = output.match(/FAIL\s+(\d+)/);
    const passedMatch = output.match(/PASS\s+(\d+)/);
    const failedCount = failedMatch ? parseInt(failedMatch[1]) : 0;
    const passedCount = passedMatch ? parseInt(passedMatch[1]) : 0;

    if (failedCount > 0) {
      console.log(`\n❌ Tests failed: ${failedCount} failed, ${passedCount} passed`);
      return {
        platform,
        config,
        success: false,
        error: `${failedCount} test(s) failed`,
        duration,
      };
    }

    console.log(`\n✅ All tests passed: ${passedCount} passed`);
    return {
      platform,
      config,
      success: true,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Error running Detox tests:`, error.message);
    return {
      platform,
      config,
      success: false,
      error: error.message,
      duration,
    };
  }
}

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

  const result = await runDetoxTests(platform, config, skipBuild);

  if (result.success) {
    console.log(`\n✅ [Detox E2E] ${platform.toUpperCase()} - ${config.toUpperCase()} - PASSED (${(result.duration! / 1000).toFixed(2)}s)`);
    process.exit(0);
  } else {
    console.log(`\n❌ [Detox E2E] ${platform.toUpperCase()} - ${config.toUpperCase()} - FAILED`);
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

export { runDetoxTests };

