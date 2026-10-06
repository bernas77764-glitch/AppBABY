import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import type { IconName } from '@/components/ui';
import { useColors } from '@/lib/theme';

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        headerStyle: { backgroundColor: c.card },
        headerTitleStyle: { color: c.text },
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="consultas" options={{ title: 'Consultas', tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Screen name="documentos" options={{ title: 'Documentos', tabBarIcon: icon('document-text-outline') }} />
      <Tabs.Screen name="familia" options={{ title: 'Família', tabBarIcon: icon('people-outline') }} />
    </Tabs>
  );
}
