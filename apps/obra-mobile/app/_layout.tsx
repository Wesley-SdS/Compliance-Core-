import { Tabs } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 2 } },
});

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#F59E0B',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: { height: 88, paddingBottom: 24, paddingTop: 8 },
          headerStyle: { backgroundColor: '#1E293B' },
          headerTintColor: '#F59E0B',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Obras',
            headerTitle: 'ObraMaster',
            tabBarIcon: ({ color, size }) => <Ionicons name="construct" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="nota-fiscal"
          options={{
            title: 'Nota Fiscal',
            tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Foto',
            tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="checklist"
          options={{
            title: 'Checklist',
            tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="alertas"
          options={{
            title: 'Alertas',
            tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
          }}
        />
      </Tabs>
    </QueryClientProvider>
  );
}
