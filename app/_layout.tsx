import { Stack } from 'expo-router';
import { AuthProvider, ProtectedRoute } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProtectedRoute>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="BookshelfDetails" options={{ headerShown: false }} />
          </Stack>
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  );
}