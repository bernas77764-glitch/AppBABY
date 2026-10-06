import { router } from 'expo-router';

import { Body, Button, Chips } from './ui';
import { useMembers } from '@/lib/useMembers';

export function MemberSelect({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const { members } = useMembers();
  if (members && members.length === 0) {
    return (
      <>
        <Body muted>Primeiro adiciona um membro da família.</Body>
        <Button label="Adicionar membro" icon="person-add-outline" variant="secondary" onPress={() => router.push('/membro/editar')} />
      </>
    );
  }
  return (
    <Chips
      label="Para quem"
      options={(members ?? []).map((m) => ({ value: m.id, label: m.name }))}
      value={value}
      onChange={onChange}
    />
  );
}
