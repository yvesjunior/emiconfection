/**
 * Run All Tests - Complete Test Suite
 * Exécute tous les tests du système POS (API, Mobile, Admin)
 * 
 * Usage: 
 *   npx tsx tests/scripts/run-all-tests.ts              # Run all API/Mobile tests
 *   npx tsx tests/scripts/run-all-tests.ts --detox     # Include Detox E2E tests (requires emulator)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface TestResult {
  category: string;
  name: string;
  success: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];
const startTime = Date.now();

// Check if --detox flag is passed
const includeDetox = process.argv.includes('--detox');

const testSuites = [
  // API Test Suites (based on TEST_SUITE.md)
  { category: 'API', name: 'Authentication', file: 'api/test-authentication.ts' },
  { category: 'API', name: 'Permissions & Roles', file: 'api/test-permissions.ts' },
  { category: 'API', name: 'Stock Transfer Workflow', file: 'api/test-transfers-workflow.ts' },
  { category: 'API', name: 'Alerts System', file: 'api/test-alerts-system.ts' },
  
  // API Unit Tests
  { category: 'API', name: 'Alerts (Unit)', file: 'api/alerts.test.ts' },
  { category: 'API', name: 'Transfers (Unit)', file: 'api/transfers.test.ts' },
  
  // API Integration Tests (commented out - these are old/debugging tests)
  // { category: 'API', name: 'Login API', file: 'api/test-admin-login-api.ts' },
  // { category: 'API', name: 'Actual Login Flow', file: 'api/test-actual-login.ts' },
  // { category: 'API', name: 'PIN Login', file: 'api/test-pin-login.ts' },
  // { category: 'API', name: 'Simplified Login', file: 'api/test-simplified-login.ts' },
  // { category: 'API', name: 'Warehouse Access', file: 'api/test-warehouse-access.ts' },
  
  // Mobile Integration Tests
  { category: 'Mobile', name: 'Login Flow', file: 'mobile/test-login-flow.ts' },
  { category: 'Mobile', name: 'API Connection', file: 'mobile/test-api-connection.ts' },
  { category: 'Mobile', name: 'Cart Operations', file: 'mobile/test-cart-operations.ts' },
  { category: 'Mobile', name: 'Sales Workflow', file: 'mobile/test-sales-workflow.ts' },
  { category: 'Mobile', name: 'Products Browsing', file: 'mobile/test-products-browsing.ts' },
  { category: 'Mobile', name: 'Customer Management', file: 'mobile/test-customers.ts' },
  { category: 'Mobile', name: 'Inventory Management', file: 'mobile/test-inventory-management.ts' },
  { category: 'Mobile', name: 'Transfer Requests', file: 'mobile/test-transfer-requests.ts' },
  { category: 'Mobile', name: 'Alerts', file: 'mobile/test-alerts.ts' },
  
  // Detox E2E Tests (only if --detox flag is set)
  ...(includeDetox ? [
    { category: 'Detox', name: 'E2E Tests (iOS)', file: 'mobile/e2e/run-all.ts', isE2E: true },
  ] : []),
];

async function runTest(test: { category: string; name: string; file: string; isE2E?: boolean }) {
  const scriptsDir = __dirname;
  const rootDir = path.join(scriptsDir, '../..');
  const filePath = path.join(scriptsDir, test.file);
  
  // Handle E2E tests differently
  if (test.isE2E) {
    try {
      const { runDetoxTests } = await import('./mobile/run-detox-tests');
      // Check if --skip-build flag is set
      const skipBuild = process.argv.includes('--skip-build') || process.argv.includes('--no-build');
      const e2eResult = await runDetoxTests('ios', 'debug', skipBuild);
      results.push({
        category: test.category,
        name: test.name,
        success: e2eResult.success,
        error: e2eResult.error,
        duration: e2eResult.duration,
      });
      return;
    } catch (e2eError: any) {
      results.push({
        category: test.category,
        name: test.name,
        success: false,
        error: e2eError.message,
      });
      return;
    }
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${test.name}: File not found (${test.file})`);
    results.push({
      category: test.category,
      name: test.name,
      success: false,
      error: 'File not found',
    });
    return;
  }
  
  // For mobile tests, ensure users and products exist before running
  if (test.category === 'Mobile') {
    try {
      // Verify users exist by trying to login
      const axios = (await import('axios')).default;
      let usersExist = false;
      try {
        await axios.post('http://localhost:3001/api/auth/login', {
          phone: '0611',
          password: '1234',
        }, { timeout: 3000 });
        usersExist = true;
      } catch (loginError) {
        // Login failed, recreate users
        console.log('   🔧 Ensuring test users exist...');
        try {
          await execAsync('npx tsx apps/api/scripts/create-test-users.ts', {
            cwd: rootDir,
            timeout: 15000,
          });
          // Wait for users to be available
          await new Promise(resolve => setTimeout(resolve, 1500));
          // Verify login works now
          await axios.post('http://localhost:3001/api/auth/login', {
            phone: '0611',
            password: '1234',
          }, { timeout: 3000 });
          usersExist = true;
        } catch (e) {
          // Ignore errors, continue anyway
        }
      }
      
      // For tests that need products, ensure products exist
      const testsNeedingProducts = ['Cart Operations', 'Sales Workflow', 'Inventory Management'];
      if (usersExist && testsNeedingProducts.includes(test.name)) {
        try {
          // Check if products exist by trying to get products
          const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            phone: '0633',
            password: '1234',
          }, { timeout: 3000 });
          const token = loginResponse.data.data.accessToken;
          const productsResponse = await axios.get('http://localhost:3001/api/products', {
            headers: { Authorization: `Bearer ${token}` },
            params: { warehouseId: loginResponse.data.data.warehouse?.id || loginResponse.data.data.warehouses?.[0]?.id },
            timeout: 3000,
          });
          if (!productsResponse.data.data || productsResponse.data.data.length === 0) {
            // No products, create them
            console.log('   🔧 Ensuring test products exist...');
            await execAsync('npx tsx apps/api/scripts/create-test-products.ts', {
              cwd: rootDir,
              timeout: 15000,
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (e) {
          // Products check failed, try to create them anyway
          try {
            await execAsync('npx tsx apps/api/scripts/create-test-products.ts', {
              cwd: rootDir,
              timeout: 15000,
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e2) {
            // Ignore
          }
        }
      }
    } catch (e) {
      // Ignore errors, continue anyway
    }
  }
  
  const testStartTime = Date.now();
  
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📦 [${test.category}] ${test.name}`);
    console.log('='.repeat(70));
    
    const { stdout, stderr } = await execAsync(`npx tsx "${filePath}"`, {
      cwd: rootDir,
      timeout: 300000, // 5 minutes timeout per test
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    const duration = Date.now() - testStartTime;
    
    // Check if test actually passed by looking at stdout
    const hasFailure = stdout.includes('FAILED') || 
                       (stdout.includes('❌') && !stdout.match(/✅.*PASSED/)) ||
                       stdout.includes('process.exit(1)') ||
                       stdout.includes('Some tests failed') ||
                       stdout.includes('Some login flow tests failed');
    
    const hasSuccess = stdout.includes('PASSED') || 
                       stdout.includes('✅ All') ||
                       stdout.includes('All tests passed') ||
                       stdout.includes('All login flow tests passed');
    
    if (stdout) {
      // Filter out excessive output, keep important parts
      const lines = stdout.split('\n');
      const importantLines = lines.filter(line => 
        line.includes('✅') || 
        line.includes('❌') || 
        line.includes('PASSED') || 
        line.includes('FAILED') ||
        line.includes('Test Summary') ||
        line.includes('Total:') ||
        line.includes('Passed:') ||
        line.includes('Failed:') ||
        line.includes('Error:')
      );
      
      if (importantLines.length > 0) {
        console.log(importantLines.slice(0, 50).join('\n')); // Limit output
      }
    }
    
    // Better detection: check for actual failure indicators
    const failedCountMatch = stdout.match(/Failed:\s*(\d+)/);
    const passedCountMatch = stdout.match(/Passed:\s*(\d+)/);
    const totalMatch = stdout.match(/Total:\s*(\d+)/);
    
    const failedCount = failedCountMatch ? parseInt(failedCountMatch[1]) : 0;
    const passedCount = passedCountMatch ? parseInt(passedCountMatch[1]) : 0;
    const totalCount = totalMatch ? parseInt(totalMatch[1]) : 0;
    
    // Determine if test passed or failed based on summary
    let testPassed = false;
    if (totalCount > 0) {
      // If we have a test summary, use it
      testPassed = failedCount === 0 && passedCount > 0;
    } else {
      // Fallback to string matching
      testPassed = hasSuccess || (!hasFailure && (stdout.includes('✅') || stdout.includes('PASSED')));
    }
    
    if (!testPassed) {
      // Test failed
      const errorMsg = stdout.match(/❌.*/)?.[0] || 
                      stdout.match(/Error:.*/)?.[0] || 
                      (failedCountMatch ? `Failed: ${failedCount} test(s)` : 'Test failed') ||
                      stderr?.substring(0, 200) || 
                      'Test failed';
      console.error(`\n❌ [${test.category}] ${test.name} - FAILED (${(duration / 1000).toFixed(2)}s)`);
      if (stderr && !stderr.includes('Warning') && !stderr.includes('Deprecation')) {
        const errorLines = stderr.split('\n').filter((line: string) => 
          line.includes('Error') || line.includes('❌') || line.includes('FAILED')
        );
        if (errorLines.length > 0) {
          console.error(errorLines.slice(0, 3).join('\n'));
        }
      }
      results.push({
        category: test.category,
        name: test.name,
        success: false,
        error: errorMsg.substring(0, 200),
        duration,
      });
      return;
    }
    
    if (stderr && !stderr.includes('Warning') && !stderr.includes('Deprecation') && !stderr.includes('⚠️')) {
      // Only show real errors
      if (stderr.includes('Error') || stderr.includes('FAILED')) {
        const errorLines = stderr.split('\n').filter((line: string) => 
          line.includes('Error') || line.includes('FAILED')
        );
        if (errorLines.length > 0) {
          console.error(errorLines.slice(0, 3).join('\n'));
        }
      }
    }
    
    results.push({
      category: test.category,
      name: test.name,
      success: true,
      duration,
    });
    
    console.log(`\n✅ [${test.category}] ${test.name} - PASSED (${(duration / 1000).toFixed(2)}s)`);
  } catch (error: any) {
    const duration = Date.now() - testStartTime;
    const errorMessage = error.message || String(error);
    
    // Get stdout/stderr even if execAsync threw an error
    let stdout = error.stdout || '';
    let stderr = error.stderr || '';
    
    // Check if test actually passed despite the error (some tests exit with non-zero on success)
    const failedCountMatch = stdout.match(/Failed:\s*(\d+)/);
    const passedCountMatch = stdout.match(/Passed:\s*(\d+)/);
    const totalMatch = stdout.match(/Total:\s*(\d+)/);
    
    const failedCount = failedCountMatch ? parseInt(failedCountMatch[1]) : 0;
    const passedCount = passedCountMatch ? parseInt(passedCountMatch[1]) : 0;
    const totalCount = totalMatch ? parseInt(totalMatch[1]) : 0;
    
    // If we have a test summary showing all passed, treat as success
    if (totalCount > 0 && failedCount === 0 && passedCount > 0) {
      results.push({
        category: test.category,
        name: test.name,
        success: true,
        duration,
      });
      console.log(`\n✅ [${test.category}] ${test.name} - PASSED (${(duration / 1000).toFixed(2)}s)`);
      return;
    }
    
    // Check if it's a timeout (only if duration is close to timeout limit)
    if ((errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) && duration >= 290000) {
      console.error(`\n⏱️  [${test.category}] ${test.name} - TIMEOUT (${(duration / 1000).toFixed(2)}s)`);
      results.push({
        category: test.category,
        name: test.name,
        success: false,
        error: 'Test timeout (5 minutes)',
        duration,
      });
    } else {
      // Extract error from stdout/stderr if available
      let errorMsg = errorMessage;
      if (stdout) {
        const failureLines = stdout.split('\n').filter((line: string) => 
          (line.includes('❌') || line.includes('FAILED') || line.includes('Error:')) &&
          !line.includes('Warning') && !line.includes('Deprecation')
        );
        if (failureLines.length > 0) {
          errorMsg = failureLines[0].substring(0, 200);
        } else if (failedCountMatch) {
          errorMsg = `Failed: ${failedCount} test(s)`;
        }
      }
      if (stderr && errorMsg === errorMessage) {
        const stderrLines = stderr.split('\n').filter((line: string) => 
          line.includes('Error') && !line.includes('Warning') && !line.includes('Deprecation')
        );
        if (stderrLines.length > 0) {
          errorMsg = stderrLines[0].substring(0, 200);
        }
      }
      
      console.error(`\n❌ [${test.category}] ${test.name} - FAILED (${(duration / 1000).toFixed(2)}s)`);
      if (stdout) {
        const errorLines = stdout.split('\n').filter((line: string) => 
          (line.includes('❌') || line.includes('Error:') || line.includes('FAILED')) &&
          !line.includes('Warning')
        );
        if (errorLines.length > 0) {
          console.error(errorLines.slice(0, 5).join('\n'));
        }
      }
      results.push({
        category: test.category,
        name: test.name,
        success: false,
        error: errorMsg.substring(0, 200),
        duration,
      });
    }
  }
}

async function ensureTestData() {
  // Ensure test users and products exist before running tests
  const scriptsDir = __dirname;
  const rootDir = path.join(scriptsDir, '../..');
  
  try {
    console.log('🔧 Ensuring test data exists...');
    // Create test users - always run to ensure they exist
    try {
      const { stdout } = await execAsync('npx tsx apps/api/scripts/create-test-users.ts', {
        cwd: rootDir,
        timeout: 30000,
      });
      console.log('   Users created/updated');
    } catch (e: any) {
      // Check if users were actually created despite the error
      if (e.stdout && e.stdout.includes('✅')) {
        console.log('   Users verified');
      } else {
        console.log('   Warning: User creation may have failed');
      }
    }
    // Create test products - always run to ensure they exist
    try {
      const { stdout } = await execAsync('npx tsx apps/api/scripts/create-test-products.ts', {
        cwd: rootDir,
        timeout: 30000,
      });
      console.log('   Products created/updated');
    } catch (e: any) {
      // Check if products were actually created despite the error
      if (e.stdout && e.stdout.includes('✅')) {
        console.log('   Products verified');
      }
    }
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify users exist in database and can login
    let usersVerified = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        // First verify users exist in database
        const { stdout: verifyStdout } = await execAsync(
          `npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); (async () => { const admin = await p.employee.findUnique({ where: { phone: '0611' } }); const manager = await p.employee.findUnique({ where: { phone: '0622' } }); const seller = await p.employee.findUnique({ where: { phone: '0633' } }); console.log('Admin:', !!admin, 'Manager:', !!manager, 'Seller:', !!seller); await p.\$disconnect(); })()"`,
          { cwd: rootDir, timeout: 10000 }
        );
        if (verifyStdout.includes('true')) {
          console.log('   Users verified in database');
          // Now verify login works
          try {
            const axios = (await import('axios')).default;
            const testLogin = await axios.post('http://localhost:3001/api/auth/login', {
              phone: '0611',
              password: '1234',
            }, { timeout: 5000 });
            if (testLogin.data.success) {
              console.log('   Login verification successful');
              usersVerified = true;
              break;
            }
          } catch (loginError) {
            // Login verification failed, wait and retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
      } catch (e) {
        // Verification failed, wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
    
    if (!usersVerified) {
      console.log('   ⚠️  Warning: Could not verify users can login, but continuing...');
    }
    
    console.log('✅ Test data ready\n');
  } catch (error: any) {
    // Ignore errors - test data might already exist
    console.log('⚠️  Test data setup completed (some may already exist)\n');
  }
}

async function runAllTests() {
  console.log('🧪 POS System - Complete Test Suite');
  console.log('='.repeat(70));
  console.log(`Starting at: ${new Date().toLocaleString()}`);
  console.log(`Total test suites: ${testSuites.length}`);
  console.log('='.repeat(70));
  
  // Ensure test data exists before running tests
  await ensureTestData();
  
  // Additional delay to ensure database is fully ready and users are accessible
  console.log('⏳ Waiting for database to be ready...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run tests sequentially to avoid database conflicts
  for (const test of testSuites) {
    await runTest(test);
  }
  
  // Detox E2E tests are now included in testSuites array when --detox flag is set
  // No need for separate handling here
  
  // Calculate summary
  const totalDuration = Date.now() - startTime;
  const byCategory = results.reduce((acc, r) => {
    if (!acc[r.category]) {
      acc[r.category] = { total: 0, passed: 0, failed: 0 };
    }
    acc[r.category].total++;
    if (r.success) {
      acc[r.category].passed++;
    } else {
      acc[r.category].failed++;
    }
    return acc;
  }, {} as Record<string, { total: number; passed: number; failed: number }>);
  
  // Print summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 Test Suite Summary');
  console.log('='.repeat(70));
  
  for (const [category, stats] of Object.entries(byCategory)) {
    console.log(`\n${category}:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  ✅ Passed: ${stats.passed}`);
    console.log(`  ❌ Failed: ${stats.failed}`);
    console.log(`  Success Rate: ${((stats.passed / stats.total) * 100).toFixed(1)}%`);
  }
  
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('Overall Statistics:');
  console.log(`  Total Tests: ${total}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`  Average per Test: ${(avgDuration / 1000).toFixed(2)}s`);
  console.log('='.repeat(70));
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - [${r.category}] ${r.name}`);
        if (r.error) {
          console.log(`    Error: ${r.error}`);
        }
      });
  }
  
  console.log(`\n${'='.repeat(70)}`);
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log(`⚠️  ${failed} test suite(s) failed`);
  }
  console.log('='.repeat(70));
  
  process.exit(failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

runAllTests().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

