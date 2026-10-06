import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { Button, Chips, ColorSwatches, Field, MemberAvatar, Screen } from '@/components/ui';
import { deleteMember, getMember, saveMember, type MemberInput } from '@/db/repo';
import type { MemberKind } from '@/db/types';
import { cleanupMember } from '@/lib/cleanup';
import { memberColors } from '@/lib/theme';

const empty: MemberInput = {
  kind: 'person',
  name: '',
  birthDate: null,
  species: null,
  breed: null,
  microchip: null,
  bloodType: null,
  allergies: null,
  notes: null,
  color: memberColors[0],
};

export default function EditMember() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const db = useSQLiteContext();
  const [form, setForm] = useState<MemberInput>(empty);
  const set = <K extends keyof MemberInput>(key: K, value: MemberInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: keyof MemberInput) => ({
    value: (form[key] as string | null) ?? '',
    onChangeText: (v: string) => set(key, (v || null) as never),
  });

  useEffect(() => {
    if (!id) return;
    getMember(db, id).then((m) => {
      if (m) {
        const { id: _id, createdAt: _c, ...rest } = m;
        setForm(rest);
      }
    });
  }, [db, id]);

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('Falta o nome', 'Indica o nome do membro.');
      return;
    }
    await saveMember(db, { ...form, name: form.name.trim() }, id);
    router.back();
  };

  const remove = () => {
    if (!id) return;
    Alert.alert('Apagar membro?', 'Apaga também as consultas e os documentos deste membro. Não dá para desfazer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await cleanupMember(db, id);
          await deleteMember(db, id);
          router.dismissTo('/familia');
        },
      },
    ]);
  };

  const isPet = form.kind === 'pet';

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? 'Editar membro' : 'Novo membro' }} />
      <Chips<MemberKind>
        label="Tipo"
        options={[
          { value: 'person', label: 'Pessoa' },
          { value: 'pet', label: 'Animal de estimação' },
        ]}
        value={form.kind}
        onChange={(v) => set('kind', v)}
      />
      <Field label="Nome" placeholder={isPet ? 'Ex.: Bolinhas' : 'Ex.: Maria'} {...text('name')} value={form.name} />
      <DateTimeField label="Data de nascimento" mode="date" value={form.birthDate} onChange={(v) => set('birthDate', v)} clearable />
      {isPet ? (
        <>
          <Field label="Espécie" placeholder="Ex.: Cão, gato" {...text('species')} />
          <Field label="Raça" {...text('breed')} />
          <Field label="N.º de microchip" keyboardType="number-pad" {...text('microchip')} />
        </>
      ) : (
        <Field label="Grupo sanguíneo" placeholder="Ex.: A+" autoCapitalize="characters" {...text('bloodType')} />
      )}
      <Field label="Alergias" {...text('allergies')} />
      <Field label="Notas" multiline {...text('notes')} />
      <ColorSwatches
        label="Cor"
        colors={memberColors}
        value={form.color}
        onChange={(v) => set('color', v)}
        preview={<MemberAvatar member={{ ...form, name: form.name || '?' }} size={36} />}
      />
      <Button label="Guardar" icon="checkmark" onPress={save} />
      {id ? <Button label="Apagar membro" icon="trash-outline" variant="danger" onPress={remove} /> : null}
    </Screen>
  );
}
