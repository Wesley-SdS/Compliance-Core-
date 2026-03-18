import React from 'react';
import { Tabs } from 'expo-router';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../src/stores/app-store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
});

function TabBarIcon(name: keyof typeof Ionicons.glyphMap, color: string, size: number) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function RootLayout() {
  const darkMode = useAppStore((s) => s.darkMode);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0EA5E9',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
            borderTopColor: darkMode ? '#334155' : '#E2E8F0',
            height: 88,
            paddingBottom: 24,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerStyle: { backgroundColor: '#075985' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'FrotaLeve', tabBarIcon: ({ color, size }) => TabBarIcon('home', color, size) }} />
        <Tabs.Screen name="viagem" options={{ title: 'Viagem', headerTitle: 'Viagens', tabBarIcon: ({ color, size }) => TabBarIcon('navigate', color, size) }} />
        <Tabs.Screen name="abastecer" options={{ title: 'Abastecer', headerTitle: 'Abastecimento', tabBarIcon: ({ color, size }) => TabBarIcon('camera', color, size) }} />
        <Tabs.Screen name="checklist" options={{ title: 'Checklist', headerTitle: 'Checklist Pre-Viagem', tabBarIcon: ({ color, size }) => TabBarIcon('clipboard', color, size) }} />
        <Tabs.Screen name="config" options={{ title: 'Config', headerTitle: 'Configuracoes', tabBarIcon: ({ color, size }) => TabBarIcon('settings-sharp', color, size) }} />
        <Tabs.Screen name="login" options={{ href: null }} />
      </Tabs>
    </QueryClientProvider>
  );
}
