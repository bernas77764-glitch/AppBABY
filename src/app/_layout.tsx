import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { LockGate } from '@/components/LockGate';
import { migrate } from '@/db/schema';
import { configureNotifications } from '@/lib/notifications';
import { getDatabaseKey } from '@/lib/security';
import { useColors } from '@/lib/theme';

configureNotifications();

export default function RootLayout() {
  const c = useColors();
  const [dbKey, setDbKey] = useState<string>();

  useEffect(() => {
    getDatabaseKey().then(setDbKey);
  }, []);

  if (!dbKey) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const onInit = async (db: SQLiteDatabase) => {
    // Com SQLCipher, a chave tem de ser a primeira instrução depois de abrir a base de dados.
    await db.execAsync(`PRAGMA key = "x'${dbKey}'"`);
    await migrate(db);
  };

  return (
    <LockGate>
      <SQLiteProvider databaseName="appbaby.db" onInit={onInit}>
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
        </Stack>
      </SQLiteProvider>
    </LockGate>
  );
}
