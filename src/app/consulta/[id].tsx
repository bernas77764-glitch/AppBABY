import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, Linking, Platform, Text } from 'react-native';

import { DocumentCard } from '@/components/DocumentCard';
import { Body, Button, Card, MemberAvatar, Row, Screen, SectionTitle } from '@/components/ui';
import { deleteAppointment, getAppointment, getMember, listDocuments } from '@/db/repo';
import { formatDateTime, formatWeekday } from '@/lib/format';
import { cancelReminders, reminderOptions } from '@/lib/notifications';
import { useColors } from '@/lib/theme';
import { useData } from '@/lib/useData';

const statusLabel = { scheduled: 'Marcada', done: 'Realizada', cancelled: 'Cancelada' } as const;

function openMaps(query: string) {
  const q = encodeURIComponent(query);
  Linking.openURL(Platform.OS === 'ios' ? `maps:0,0?q=${q}` : `geo:0,0?q=${q}`);
}

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const c = useColors();
  const { data } = useData(async (db) => {
    const appointment = await getAppointment(db, id);
    const member = appointment ? await getMember(db, appointment.memberId) : null;
    return { appointment, member };
  }, [id]);
  const { data: docs } = useData((db) => listDocuments(db, { appointmentId: id }), [id]);

  const a = data?.appointment;
  if (!a) return <Screen>{null}</Screen>;
  const member = data.member;

  const remove = () =>
    Alert.alert('Apagar consulta?', 'Os documentos ligados a esta consulta ficam guardados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await cancelReminders(a.notificationIds);
          await deleteAppointment(db, a.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <Card>
        <Row>
          {member ? <MemberAvatar member={member} /> : null}
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700', flex: 1 }}>{a.title}</Text>
        </Row>
        <Body>
          {formatWeekday(a.startsAt)}, {formatDateTime(a.startsAt)}
        </Body>
        <Body muted>{[member?.name, a.professional, statusLabel[a.status]].filter(Boolean).join(' · ')}</Body>
        {a.location ? (
          <Text style={{ color: c.primary, fontSize: 15 }} onPress={() => openMaps(a.location!)}>
            {a.location} (abrir no mapa)
          </Text>
        ) : null}
        {a.reminderMinutes.length && a.status === 'scheduled' ? (
          <Body muted>
            Lembretes:{' '}
            {a.reminderMinutes.map((m) => reminderOptions.find((r) => r.minutes === m)?.label ?? `${m} min antes`).join(', ')}
          </Body>
        ) : null}
      </Card>
      {a.notes ? (
        <Card>
          <SectionTitle>Notas</SectionTitle>
          <Body>{a.notes}</Body>
        </Card>
      ) : null}
      {a.outcome ? (
        <Card>
          <SectionTitle>O que foi dito</SectionTitle>
          <Body>{a.outcome}</Body>
        </Card>
      ) : null}

      <Row style={{ flexWrap: 'wrap' }}>
        <Button
          label="Editar"
          icon="create-outline"
          onPress={() => router.push({ pathname: '/consulta/editar', params: { id: a.id } })}
        />
        <Button
          label="Juntar documento"
          icon="attach-outline"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/documento/editar', params: { memberId: a.memberId, appointmentId: a.id } })
          }
        />
      </Row>

      <SectionTitle>Documentos desta consulta</SectionTitle>
      {docs?.length === 0 ? <Body muted>Nenhum documento ligado.</Body> : null}
      {docs?.map((d) => <DocumentCard key={d.id} document={d} />)}

      <Button label="Apagar consulta" icon="trash-outline" variant="danger" onPress={remove} />
    </Screen>
  );
}
