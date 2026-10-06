import { router } from 'expo-router';

import { AppointmentCard } from '@/components/AppointmentCard';
import { DocumentCard } from '@/components/DocumentCard';
import { Body, Button, EmptyState, Row, Screen, SectionTitle, Title } from '@/components/ui';
import { listAppointments, listDocuments } from '@/db/repo';
import { useData } from '@/lib/useData';
import { useMembers } from '@/lib/useMembers';

export default function Home() {
  const { members, byId } = useMembers();
  const { data: upcoming } = useData((db) => listAppointments(db, { when: 'upcoming', limit: 5 }), []);
  const { data: docs } = useData(async (db) => (await listDocuments(db)).slice(0, 4), []);

  if (members && members.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="heart-outline"
          text="Bem-vindo à AppBABY. Começa por adicionar as pessoas e os animais da família."
          action={<Button label="Adicionar membro" icon="person-add-outline" onPress={() => router.push('/membro/editar')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Olá!</Title>
      <Row style={{ flexWrap: 'wrap' }}>
        <Button label="Nova consulta" icon="add" onPress={() => router.push('/consulta/editar')} />
        <Button
          label="Digitalizar"
          icon="scan-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/documento/editar', params: { scan: '1' } })}
        />
      </Row>

      <SectionTitle>Próximas consultas</SectionTitle>
      {upcoming?.length === 0 ? <Body muted>Nada agendado.</Body> : null}
      {upcoming?.map((a) => <AppointmentCard key={a.id} appointment={a} member={byId.get(a.memberId)} />)}

      <SectionTitle>Documentos recentes</SectionTitle>
      {docs?.length === 0 ? <Body muted>Ainda não guardaste documentos.</Body> : null}
      {docs?.map((d) => <DocumentCard key={d.id} document={d} member={byId.get(d.memberId)} />)}
    </Screen>
  );
}
