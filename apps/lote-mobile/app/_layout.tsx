import React from 'react';
import { Tabs } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

function TabBarIcon({ name, color, size }: { name: keyof typeof Ionicons.glyphMap; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function RootLayout() {
  const darkMode = useAppStore((s) => s.darkMode);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#F43F5E',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            height: 88,
            paddingBottom: 24,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: '#BE123C',
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
            title: 'Home',
            headerTitle: 'LotePro',
            tabBarIcon: ({ color, size }) => <TabBarIcon name="home" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="parcelas"
          options={{
            title: 'Parcelas',
            headerTitle: 'Parcelas',
            tabBarIcon: ({ color, size }) => <TabBarIcon name="card" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="infraestrutura"
          options={{
            title: 'Infra',
            headerTitle: 'Infraestrutura',
            tabBarIcon: ({ color, size }) => <TabBarIcon name="construct" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="documentos"
          options={{
            title: 'Docs',
            headerTitle: 'Documentos',
            tabBarIcon: ({ color, size }) => <TabBarIcon name="document-text" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="config"
          options={{
            title: 'Config',
            headerTitle: 'Configuracoes',
            tabBarIcon: ({ color, size }) => <TabBarIcon name="settings-sharp" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="login"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </QueryClientProvider>
  );
}
