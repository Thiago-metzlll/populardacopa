import React from 'react';
import { Stack } from 'expo-router';
import { UserProvider } from '../src/shared/presentation/contexts/UserContext';

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="grupos" options={{ title: 'Grupos', presentation: 'modal' }} />
        <Stack.Screen name="apostas" options={{ title: 'Apostas', presentation: 'modal' }} />
      </Stack>
    </UserProvider>
  );
}
