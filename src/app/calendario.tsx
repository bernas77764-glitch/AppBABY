import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';

import { Body, Button, Card, Row, Screen, SectionTitle } from '@/components/ui';
import {
  disableCalendarSync,
  enableCalendarSync,
  ensureCalendarPermission,
  getSyncCalendarId,
  listWritableCalendars,
  type CalendarOption,
} from '@/lib/calendar';
import { useColors } from '@/lib/theme';
import { useData } from '@/lib/useData';

export default function CalendarSettings() {
  const db = useSQLiteContext();
  const c = useColors();
  const [busy, setBusy] = useState(false);
  const { data, reload } = useData(async (db) => {
    const selectedId = await getSyncCalendarId(db);
    const granted = await ensureCalendarPermission(false);
    const calendars = granted ? await listWritableCalendars() : [];
    return { selectedId, granted, calendars };
  }, []);

  const askPermission = async () => {
    if (await ensureCalendarPermission(true)) return reload();
    Alert.alert(
      'Sem acesso ao calendário',
      'Autoriza o acesso ao calendário nas definições do telemóvel para usar esta função.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir definições', onPress: () => Linking.openSettings() },
      ],
    );
  };

  const choose = async (calendar: CalendarOption) => {
    setBusy(true);
    try {
      const count = await enableCalendarSync(db, calendar.id);
      await reload();
      Alert.alert(
        'Sincronização ligada',
        count === 1
          ? '1 consulta marcada foi adicionada ao calendário.'
          : `${count} consultas marcadas foram adicionadas ao calendário.`,
      );
    } catch (e) {
      Alert.alert('Não foi possível sincronizar', String(e));
    } finally {
      setBusy(false);
    }
  };

  const turnOff = () =>
    Alert.alert('Desligar sincronização?', 'As consultas deixam de ser enviadas para o calendário.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Manter eventos', onPress: () => disableCalendarSync(db, false).then(reload) },
      { text: 'Apagar eventos', style: 'destructive', onPress: () => disableCalendarSync(db, true).then(reload) },
    ]);

  if (!data) return <Screen>{null}</Screen>;
  const selected = data.calendars.find((cal) => cal.id === data.selectedId);

  return (
    <Screen>
      <Card>
        <Body>
          As consultas marcadas na app passam a aparecer no calendário que escolheres. Se escolheres um calendário da
          tua conta Google, o telemóvel envia-as para o Google Calendário.
        </Body>
        <Body muted>
          Só vai o motivo, o nome do membro, o médico e o local. As notas ficam apenas na app. Alterações feitas no Google
          Calendário não voltam para a app.
        </Body>
      </Card>

      {!data.granted ? (
        <Button label="Dar acesso ao calendário" icon="calendar-outline" onPress={askPermission} />
      ) : (
        <>
          <SectionTitle>{data.selectedId ? 'A sincronizar com' : 'Escolhe o calendário'}</SectionTitle>
          {data.calendars.length === 0 ? (
            <Body muted>
              Não há calendários neste telemóvel. Adiciona a tua conta Google nas definições do telemóvel e volta aqui.
            </Body>
          ) : null}
          {data.calendars.map((cal) => {
            const on = cal.id === data.selectedId;
            return (
              <Card key={cal.id} onPress={busy || on ? undefined : () => choose(cal)}>
                <Row>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: cal.color ?? c.primary }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 16, fontWeight: on ? '700' : '400' }}>{cal.title}</Text>
                    <Body muted>{cal.isGoogle ? `Google · ${cal.account}` : cal.account}</Body>
                  </View>
                  {on ? <Ionicons name="checkmark-circle" size={22} color={c.primary} /> : null}
                </Row>
              </Card>
            );
          })}
          {data.selectedId && !selected && data.calendars.length > 0 ? (
            <Body muted>O calendário escolhido já não existe neste telemóvel. Escolhe outro.</Body>
          ) : null}
          {data.selectedId ? (
            <>
              <Button
                label={busy ? 'A sincronizar…' : 'Sincronizar agora'}
                icon="sync-outline"
                variant="secondary"
                disabled={busy}
                onPress={() => selected && choose(selected)}
              />
              <Button label="Desligar sincronização" icon="close-circle-outline" variant="danger" onPress={turnOff} />
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}
