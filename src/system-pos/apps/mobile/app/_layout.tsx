import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/auth';
import { useAppModeStore } from '../src/store/appMode';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const loadStoredAuth = useAuthStore((state) => state.loadStoredAuth);
  const employee = useAuthStore((state) => state.employee);
  const setCanSwitchMode = useAppModeStore((state) => state.setCanSwitchMode);
  const loadStoredMode = useAppModeStore((state) => state.loadStoredMode);
  const mode = useAppModeStore((state) => state.mode);
  const setMode = useAppModeStore((state) => state.setMode);

  useEffect(() => {
    // Load auth and mode with timeout to prevent blocking
    const loadAuth = async () => {
      try {
        await Promise.race([
          Promise.all([loadStoredAuth(), loadStoredMode()]),
          new Promise((resolve) => setTimeout(resolve, 2000)), // 2 second timeout
        ]);
      } catch (error) {
        console.error('Error loading stored auth:', error);
        // Ensure loading is set to false even on error
        const currentState = useAuthStore.getState();
        if (currentState.isLoading) {
          useAuthStore.setState({ isLoading: false });
        }
      }
    };
    loadAuth();
  }, []);

  // Update canSwitchMode when employee changes (including after reload)
  // Only Admin and Manager can switch modes, Seller (cashier) cannot
  useEffect(() => {
    if (employee) {
      const roleName = employee.role?.name;
      const canSwitch = roleName === 'admin' || roleName === 'manager';
      setCanSwitchMode(canSwitch);
      
      // If user is a seller and somehow in manage mode, force switch to sell
      if (roleName === 'cashier' && mode === 'manage') {
        setMode('sell');
      }
    }
  }, [employee, setCanSwitchMode, mode, setMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(app)" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

