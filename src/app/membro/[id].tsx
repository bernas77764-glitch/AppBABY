import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { AppointmentCard } from '@/components/AppointmentCard';
import { DocumentCard } from '@/components/DocumentCard';
import { Body, Button, Card, MemberAvatar, Row, Screen, SectionTitle } from '@/components/ui';
import { getMember, listAppointments, listDocuments } from '@/db/repo';
import { ageLabel, formatDate } from '@/lib/format';
import { useColors } from '@/lib/theme';
import { useData } from '@/lib/useData';

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <Body>
      <Body muted>{label}: </Body>
      {value}
    </Body>
  );
}

export default function MemberDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const { data: member } = useData((db) => getMember(db, id), [id]);
  const { data: upcoming } = useData((db) => listAppointments(db, { when: 'upcoming', memberId: id }), [id]);
  const { data: past } = useData((db) => listAppointments(db, { when: 'past', memberId: id, limit: 5 }), [id]);
  const { data: docs } = useData((db) => listDocuments(db, { memberId: id }), [id]);

  if (!member) return <Screen>{null}</Screen>;
  const isPet = member.kind === 'pet';

  return (
    <Screen>
      <Stack.Screen options={{ title: member.name }} />
      <Card>
        <Row>
          <MemberAvatar member={member} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>{member.name}</Text>
            <Body muted>
              {[isPet ? member.species : 'Pessoa', member.birthDate ? `${formatDate(member.birthDate)} (${ageLabel(member.birthDate)})` : null]
                .filter(Boolean)
                .join(' · ')}
            </Body>
          </View>
        </Row>
        <Info label="Raça" value={member.breed} />
        <Info label="Microchip" value={member.microchip} />
        <Info label="Grupo sanguíneo" value={member.bloodType} />
        <Info label="Alergias" value={member.allergies} />
        <Info label="Notas" value={member.notes} />
      </Card>
      <Row style={{ flexWrap: 'wrap' }}>
        <Button
          label="Nova consulta"
          icon="add"
          onPress={() => router.push({ pathname: '/consulta/editar', params: { memberId: id } })}
        />
        <Button
          label="Documento"
          icon="scan-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/documento/editar', params: { memberId: id } })}
        />
        <Button
          label="Editar"
          icon="create-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/membro/editar', params: { id } })}
        />
      </Row>

      <SectionTitle>Próximas consultas</SectionTitle>
      {upcoming?.length === 0 ? <Body muted>Nada agendado.</Body> : null}
      {upcoming?.map((a) => <AppointmentCard key={a.id} appointment={a} />)}

      {past?.length ? <SectionTitle>Últimas consultas</SectionTitle> : null}
      {past?.map((a) => <AppointmentCard key={a.id} appointment={a} />)}

      <SectionTitle>Documentos</SectionTitle>
      {docs?.length === 0 ? <Body muted>Sem documentos.</Body> : null}
      {docs?.map((d) => <DocumentCard key={d.id} document={d} />)}
    </Screen>
  );
}
