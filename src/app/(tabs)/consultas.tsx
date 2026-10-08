import { router } from 'expo-router';
import { useState } from 'react';

import { AppointmentCard } from '@/components/AppointmentCard';
import { Button, Chips, EmptyState, Screen } from '@/components/ui';
import { listAppointments } from '@/db/repo';
import { useData } from '@/lib/useData';
import { useMembers } from '@/lib/useMembers';

export default function Appointments() {
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const [memberId, setMemberId] = useState<string>('all');
  const { members, byId } = useMembers();
  const { data } = useData(
    (db) => listAppointments(db, { when, memberId: memberId === 'all' ? undefined : memberId }),
    [when, memberId],
  );

  return (
    <Screen>
      <Button label="Nova consulta" icon="add" onPress={() => router.push('/consulta/editar')} />
      <Button
        label="Google Calendário"
        icon="sync-outline"
        variant="secondary"
        onPress={() => router.push('/calendario')}
      />
      <Chips
        options={[
          { value: 'upcoming', label: 'Próximas' },
          { value: 'past', label: 'Passadas' },
        ]}
        value={when}
        onChange={setWhen}
      />
      {members && members.length > 1 ? (
        <Chips
          options={[{ value: 'all', label: 'Todos' }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
          value={memberId}
          onChange={setMemberId}
        />
      ) : null}
      {data?.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          text={when === 'upcoming' ? 'Não há consultas marcadas.' : 'Ainda não há consultas passadas.'}
        />
      ) : null}
      {data?.map((a) => <AppointmentCard key={a.id} appointment={a} member={byId.get(a.memberId)} />)}
    </Screen>
  );
}
