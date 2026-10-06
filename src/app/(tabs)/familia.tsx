import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Body, Button, Card, EmptyState, MemberAvatar, Row, Screen, SectionTitle } from '@/components/ui';
import type { Member } from '@/db/types';
import { ageLabel } from '@/lib/format';
import { useColors } from '@/lib/theme';
import { useMembers } from '@/lib/useMembers';

function MemberRow({ member }: { member: Member }) {
  const c = useColors();
  const details =
    member.kind === 'pet'
      ? [member.species, member.breed, ageLabel(member.birthDate)]
      : [ageLabel(member.birthDate), member.allergies ? `Alergias: ${member.allergies}` : null];
  return (
    <Card onPress={() => router.push({ pathname: '/membro/[id]', params: { id: member.id } })}>
      <Row>
        <MemberAvatar member={member} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{member.name}</Text>
          <Body muted>{details.filter(Boolean).join(' · ') || (member.kind === 'pet' ? 'Animal' : 'Pessoa')}</Body>
        </View>
      </Row>
    </Card>
  );
}

export default function Family() {
  const { members } = useMembers();
  const people = members?.filter((m) => m.kind === 'person') ?? [];
  const pets = members?.filter((m) => m.kind === 'pet') ?? [];

  return (
    <Screen>
      <Button label="Adicionar membro" icon="person-add-outline" onPress={() => router.push('/membro/editar')} />
      {members?.length === 0 ? (
        <EmptyState icon="people-outline" text="Adiciona pessoas e animais para organizares as consultas e os documentos de cada um." />
      ) : null}
      {people.length ? <SectionTitle>Pessoas</SectionTitle> : null}
      {people.map((m) => <MemberRow key={m.id} member={m} />)}
      {pets.length ? <SectionTitle>Animais</SectionTitle> : null}
      {pets.map((m) => <MemberRow key={m.id} member={m} />)}
    </Screen>
  );
}
