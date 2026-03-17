import React from 'react';
import { Tabs } from 'expo-router';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../src/stores/app-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
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
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
            borderTopColor: darkMode ? '#334155' : '#E2E8F0',
            height: 88,
            paddingBottom: 24,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#1E40AF',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Score',
            headerTitle: 'EstetikComply',
            tabBarIcon: ({ color, size }) => TabBarIcon('shield-checkmark', color, size),
          }}
        />
        <Tabs.Screen
          name="checklists"
          options={{
            title: 'Checklists',
            headerTitle: 'Checklists de Campo',
            tabBarIcon: ({ color, size }) => TabBarIcon('clipboard', color, size),
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Câmera',
            headerTitle: 'Captura de Documentos',
            tabBarIcon: ({ color, size }) => TabBarIcon('camera', color, size),
          }}
        />
        <Tabs.Screen
          name="alertas"
          options={{
            title: 'Alertas',
            headerTitle: 'Central de Alertas',
            tabBarIcon: ({ color, size }) => TabBarIcon('notifications', color, size),
          }}
        />
        <Tabs.Screen
          name="config"
          options={{
            title: 'Config',
            headerTitle: 'Configurações',
            tabBarIcon: ({ color, size }) => TabBarIcon('settings-sharp', color, size),
          }}
        />
      </Tabs>
    </QueryClientProvider>
  );
}
