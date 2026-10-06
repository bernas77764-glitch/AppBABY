import { router } from 'expo-router';
import { Text, View } from 'react-native';

import type { Appointment, Member } from '@/db/types';
import { formatDate, formatTime, formatWeekday } from '@/lib/format';
import { useColors } from '@/lib/theme';
import { Body, Card, MemberAvatar, Row } from './ui';

const statusLabel = { scheduled: null, done: 'Realizada', cancelled: 'Cancelada' } as const;

export function AppointmentCard({ appointment, member }: { appointment: Appointment; member?: Member }) {
  const c = useColors();
  const status = statusLabel[appointment.status];
  return (
    <Card onPress={() => router.push({ pathname: '/consulta/[id]', params: { id: appointment.id } })}>
      <Row>
        {member ? <MemberAvatar member={member} size={36} /> : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{appointment.title}</Text>
          <Body muted>
            {[member?.name, appointment.professional].filter(Boolean).join(' · ')}
          </Body>
          {appointment.location ? <Body muted>{appointment.location}</Body> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: c.primary, fontWeight: '700' }}>{formatTime(appointment.startsAt)}</Text>
          <Body muted style={{ fontSize: 13 }}>{formatDate(appointment.startsAt)}</Body>
          <Body muted style={{ fontSize: 12 }}>{status ?? formatWeekday(appointment.startsAt)}</Body>
        </View>
      </Row>
    </Card>
  );
}
