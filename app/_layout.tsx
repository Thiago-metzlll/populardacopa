import React from 'react';
import { Stack } from 'expo-router';
import { UserProvider } from '../src/shared/presentation/contexts/UserContext';

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="grupos" options={{ title: 'Grupos', presentation: 'modal' }} />
        <Stack.Screen 
          name="mercado" 
          options={{ 
            title: 'Mercado de Figurinhas', 
            presentation: 'modal',
            headerTintColor: '#FFFFFF',
            headerStyle: { backgroundColor: '#1A1A1E' },
            headerTitleStyle: { fontWeight: 'bold' }
          }} 
        />
        <Stack.Screen name="apostas" options={{ title: 'Apostas', presentation: 'modal' }} />
        <Stack.Screen 
          name="palpite/[matchId]" 
          options={{ 
            title: 'Fazer Palpite', 
            presentation: 'modal',
            headerTintColor: '#FFFFFF',
            headerStyle: { backgroundColor: '#1A1A1E' },
            headerTitleStyle: { fontWeight: 'bold' }
          }} 
        />
        <Stack.Screen 
          name="times/[teamId]" 
          options={{ 
            title: 'Detalhes do Time', 
            headerTintColor: '#FFFFFF', 
            headerStyle: { backgroundColor: '#1A1A1E' },
            headerTitleStyle: { fontWeight: 'bold' } 
          }} 
        />
      </Stack>
    </UserProvider>
  );
}
