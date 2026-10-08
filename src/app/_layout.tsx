import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ErrorScreen, RootErrorBoundary } from '@/components/ErrorScreen';
import { LockGate } from '@/components/LockGate';
import { applyKey, DATABASE_NAME, prepareDatabase } from '@/db/open';
import { configureNotifications } from '@/lib/notifications';
import { getDatabaseKey } from '@/lib/security';
import { useColors } from '@/lib/theme';

configureNotifications();

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <LockGate>
        <App />
      </LockGate>
    </RootErrorBoundary>
  );
}

function App() {
  const c = useColors();
  const [dbKey, setDbKey] = useState<string>();
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    getDatabaseKey()
      .then(async (key) => {
        await prepareDatabase(key);
        setDbKey(key);
      })
      .catch(setError);
  }, [attempt]);

  const onInit = useCallback(async (db: SQLiteDatabase) => applyKey(db, dbKey!), [dbKey]);
  const retry = () => {
    setError(null);
    setAttempt((n) => n + 1);
  };

  if (error != null) return <ErrorScreen error={error} onRetry={retry} />;

  if (!dbKey) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={onInit} onError={setError}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.card },
          headerTintColor: c.primary,
          headerTitleStyle: { color: c.text },
          contentStyle: { backgroundColor: c.background },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="membro/editar" options={{ title: 'Membro', presentation: 'modal' }} />
        <Stack.Screen name="membro/[id]" options={{ title: '' }} />
        <Stack.Screen name="consulta/editar" options={{ title: 'Consulta', presentation: 'modal' }} />
        <Stack.Screen name="consulta/[id]" options={{ title: 'Consulta' }} />
        <Stack.Screen name="documento/editar" options={{ title: 'Documento', presentation: 'modal' }} />
        <Stack.Screen name="documento/[id]" options={{ title: 'Documento' }} />
        <Stack.Screen name="calendario" options={{ title: 'Google Calendário' }} />
      </Stack>
    </SQLiteProvider>
  );
}
