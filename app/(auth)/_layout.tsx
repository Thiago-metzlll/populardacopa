import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ 
      presentation: 'modal',
      headerTintColor: '#FFFFFF',
      headerStyle: { backgroundColor: '#1A1A1E' },
      headerTitleStyle: { fontWeight: 'bold' }
    }}>
      <Stack.Screen 
        name="entrar" 
        options={{ title: 'Entrar' }} 
      />
      <Stack.Screen 
        name="cadastro" 
        options={{ title: 'Cadastro' }} 
      />
      <Stack.Screen 
        name="esqueci-senha" 
        options={{ title: 'Recuperar Senha' }} 
      />
    </Stack>
  );
}
