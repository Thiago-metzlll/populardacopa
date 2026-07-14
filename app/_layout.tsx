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

        {/* Fase 3 */}
        <Stack.Screen
          name="players/[playerId]"
          options={{
            title: 'Perfil do Jogador',
            headerTintColor: '#FFFFFF',
            headerStyle: { backgroundColor: '#1A1A1E' },
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="apostas/historico"
          options={{
            title: 'Histórico de Apostas',
            headerTintColor: '#FFFFFF',
            headerStyle: { backgroundColor: '#1A1A1E' },
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="abrir-pacote/[packId]"
          options={{
            title: 'Abrir Pacote',
            presentation: 'modal',
            headerTintColor: '#FFFFFF',
            headerStyle: { backgroundColor: '#1A1A1E' },
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />

        {/* Fase 4 — Alinhamento com Figma */}
        <Stack.Screen
          name="mercado/[albumId]"
          options={{
            title: 'Coleção',
            headerTintColor: '#FFFFFF',
            headerStyle: { backgroundColor: '#1A1A1E' },
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="figurinha/[stickerId]"
          options={{
            title: 'Figurinha',
            headerTintColor: '#FFFFFF',
            headerStyle: { backgroundColor: '#1A1A1E' },
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="figurinhas"
          options={{
            title: 'Todas as Figurinhas',
            headerTintColor: '#FFFFFF',
            headerStyle: { backgroundColor: '#1A1A1E' },
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
      </Stack>
    </UserProvider>
  );
}

