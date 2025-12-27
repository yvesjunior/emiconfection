/**
 * E2E Test: Login Flow
 * Tests the complete login process with user interactions
 */

import { device, element, by, waitFor, expect } from 'detox';

describe('Login Flow', () => {
  beforeAll(async () => {
    // Launch app with fresh instance and disable developer menu
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
      launchArgs: {
        // Disable React Native developer menu
        'RCT_DEV_MENU': false,
        // Disable Expo developer menu
        'EXPO_DEV_MENU': false
      }
    });
    // Give app plenty of time to fully load, check auth, and navigate to login
    await new Promise(resolve => setTimeout(resolve, 20000));
  });

  beforeEach(async () => {
    // Terminate and relaunch app for each test to ensure clean state
    await device.terminateApp();
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
    // Wait for app to load and navigate to login
    await new Promise(resolve => setTimeout(resolve, 10000));
  });

  // it('should show login screen on app launch', async () => {
  //   // Wait for app to finish loading
  //   // The app starts at index, loads auth (with 2s timeout), then navigates to login
  //   await new Promise(resolve => setTimeout(resolve, 5000));
    
  //   // Try multiple approaches to find the login screen
  //   // First check for phone-input (most reliable indicator)
  //   try {
  //     await waitFor(element(by.id('phone-input')))
  //       .toBeVisible()
  //       .withTimeout(20000);
  //   } catch {
  //     // If phone-input not found, try login-screen
  //     try {
  //       await waitFor(element(by.id('login-screen')))
  //         .toBeVisible()
  //         .withTimeout(10000);
  //     } catch {
  //       // Last resort: check for index screen and wait for it to disappear
  //       try {
  //         await waitFor(element(by.id('index-screen')))
  //           .toBeVisible()
  //           .withTimeout(2000);
  //         // Index screen exists, wait for it to disappear
  //         await waitFor(element(by.id('index-screen')))
  //           .not.toBeVisible()
  //           .withTimeout(15000);
  //       } catch {
  //         // Index screen doesn't exist or already gone, continue
  //       }
  //       // After waiting, login should appear
  //       await waitFor(element(by.id('phone-input')))
  //         .toBeVisible()
  //         .withTimeout(10000);
  //     }
  //   }
  // });

  it('should login successfully with valid credentials', async () => {
    // Wait for app to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Wait for login screen
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(10000);

    // Enter phone number using TextInput
    await element(by.id('phone-input')).typeText('0611');
    
    // Wait for submit button to appear (appears when phone length >= 4)
    await waitFor(element(by.id('phone-submit-button')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Tap submit button to proceed to PIN screen
    await element(by.id('phone-submit-button')).tap();
    
    // Give the UI time to transition from phone input to PIN input screen
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Wait for PIN entry screen (phone input disappears and keypad appears)
    await waitFor(element(by.id('pin-dots-container')))
      .toBeVisible()
      .withTimeout(10000);
    
    // The keypad should be rendered at the same time as PIN dots
    // Instead of waiting for the container, wait directly for a keypad button
    // This is more reliable since buttons are what we actually need to interact with
    await waitFor(element(by.id('keypad-1')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Also verify the container exists (for debugging)
    await waitFor(element(by.id('keypad-container')))
      .toExist()
      .withTimeout(5000);
    
    // Enter PIN using keypad: 1, 2, 3, 4
    // Use tap() which simulates mouse click/touch
    await element(by.id('keypad-1')).tap();
    await new Promise(resolve => setTimeout(resolve, 500));
    await element(by.id('keypad-2')).tap();
    await new Promise(resolve => setTimeout(resolve, 500));
    await element(by.id('keypad-3')).tap();
    await new Promise(resolve => setTimeout(resolve, 500));
    await element(by.id('keypad-4')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // If warehouse selection appears, select first warehouse
    // Otherwise, login should complete automatically
    // Wait a bit for login to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if warehouse modal appears or if we're logged in
    try {
      // Try to find warehouse modal or confirm button
      const warehouseModal = element(by.id('warehouse-modal'));
      if (await warehouseModal.exists()) {
        // Select first warehouse (if available)
        // For now, just wait - warehouse selection will be handled in a separate test
        await waitFor(element(by.id('pos-screen')))
          .toBeVisible()
          .withTimeout(15000);
      } else {
        // No warehouse selection, login should complete
        await waitFor(element(by.id('pos-screen')))
          .toBeVisible()
          .withTimeout(10000);
      }
    } catch {
      // If modal check fails, just wait for POS screen
      await waitFor(element(by.id('pos-screen')))
        .toBeVisible()
        .withTimeout(10000);
    }
  });

});

