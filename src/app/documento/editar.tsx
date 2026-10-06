import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { MemberSelect } from '@/components/MemberSelect';
import { Body, Button, Chips, Field, Row, Screen } from '@/components/ui';
import { getDocument, listAppointments, saveDocument, type DocumentInput } from '@/db/repo';
import { documentCategories, type Appointment, type StoredFile } from '@/db/types';
import {
  deleteStoredFile,
  fileFor,
  pickFromGallery,
  pickPdfOrFile,
  scanWithCamera,
  storeFiles,
  type PendingFile,
} from '@/lib/files';
import { formatDate } from '@/lib/format';
import { useColors } from '@/lib/theme';

export default function EditDocument() {
  const params = useLocalSearchParams<{ id?: string; memberId?: string; appointmentId?: string; scan?: string }>();
  const db = useSQLiteContext();
  const c = useColors();
  const isNew = !params.id;
  const [docId] = useState(() => params.id ?? randomUUID());
  const [form, setForm] = useState<DocumentInput>({
    memberId: params.memberId ?? '',
    appointmentId: params.appointmentId ?? null,
    title: '',
    category: 'outro',
    files: [],
    docDate: Date.now(),
    notes: null,
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [busy, setBusy] = useState(false);
  // Ficheiros copiados nesta edição (apagados se sair sem guardar) e ficheiros a remover ao guardar.
  const added = useRef<StoredFile[]>([]);
  const removed = useRef<StoredFile[]>([]);
  const saved = useRef(false);
  const set = <K extends keyof DocumentInput>(key: K, value: DocumentInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (params.id) {
      getDocument(db, params.id).then((d) => {
        if (!d) return;
        const { id: _id, createdAt: _c, ...rest } = d;
        setForm(rest);
      });
    }
    if (params.scan) addFrom(scanWithCamera);
    const addedFiles = added.current;
    return () => {
      if (!saved.current) addedFiles.forEach(deleteStoredFile);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const memberId = form.memberId;
    Promise.all(
      memberId
        ? [
            listAppointments(db, { when: 'past', memberId, limit: 4 }),
            listAppointments(db, { when: 'upcoming', memberId, limit: 2 }),
          ]
        : [[], []],
    ).then(([past, upcoming]) => setAppointments([...upcoming, ...past]));
  }, [db, form.memberId]);

  async function addFrom(source: () => Promise<PendingFile[]>) {
    try {
      setBusy(true);
      const pending = await source();
      if (!pending.length) return;
      const stored = await storeFiles(docId, pending);
      added.current.push(...stored);
      setForm((f) => ({ ...f, files: [...f.files, ...stored] }));
    } catch (e) {
      Alert.alert('Não foi possível adicionar', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const removeFile = (file: StoredFile) => {
    removed.current.push(file);
    setForm((f) => ({ ...f, files: f.files.filter((x) => x.path !== file.path) }));
  };

  const save = async () => {
    if (!form.memberId) return Alert.alert('De quem é?', 'Escolhe o membro da família.');
    if (!form.title.trim()) return Alert.alert('Falta o título', 'Dá um nome ao documento (ex.: Análises ao sangue).');
    if (!form.files.length) return Alert.alert('Sem ficheiros', 'Digitaliza ou importa pelo menos uma página.');
    await saveDocument(db, { ...form, title: form.title.trim() }, docId, isNew);
    saved.current = true;
    removed.current.forEach(deleteStoredFile);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: isNew ? 'Novo documento' : 'Editar documento' }} />
      <Row style={{ flexWrap: 'wrap' }}>
        <Button label="Digitalizar" icon="scan-outline" disabled={busy} onPress={() => addFrom(scanWithCamera)} />
        <Button label="Galeria" icon="images-outline" variant="secondary" disabled={busy} onPress={() => addFrom(pickFromGallery)} />
        <Button label="PDF" icon="document-outline" variant="secondary" disabled={busy} onPress={() => addFrom(pickPdfOrFile)} />
      </Row>
      {form.files.length ? (
        <ScrollView horizontal contentContainerStyle={{ gap: 10 }}>
          {form.files.map((f) => (
            <View key={f.path} style={{ width: 90, height: 120, borderRadius: 8, overflow: 'hidden', backgroundColor: c.chip }}>
              {f.mimeType.startsWith('image/') ? (
                <Image source={{ uri: fileFor(f).uri }} style={{ width: 90, height: 120 }} />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="document-outline" size={32} color={c.primary} />
                  <Body muted>PDF</Body>
                </View>
              )}
              <Pressable
                accessibilityLabel="Remover página"
                onPress={() => removeFile(f)}
                style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#0008', borderRadius: 12, padding: 2 }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Body muted>Ainda sem páginas.</Body>
      )}
      <MemberSelect value={form.memberId || null} onChange={(v) => setForm((f) => ({ ...f, memberId: v, appointmentId: null }))} />
      <Field label="Título" placeholder="Ex.: Análises ao sangue" value={form.title} onChangeText={(v) => set('title', v)} />
      <Chips label="Categoria" options={documentCategories} value={form.category} onChange={(v) => set('category', v)} />
      <DateTimeField label="Data do documento" mode="date" value={form.docDate} onChange={(v) => set('docDate', v)} clearable />
      {appointments.length ? (
        <Chips
          label="Ligar a uma consulta"
          options={[
            { value: '', label: 'Nenhuma' },
            ...appointments.map((a) => ({ value: a.id, label: `${a.title} · ${formatDate(a.startsAt)}` })),
          ]}
          value={form.appointmentId ?? ''}
          onChange={(v) => set('appointmentId', v || null)}
        />
      ) : null}
      <Field label="Notas" multiline value={form.notes ?? ''} onChangeText={(v) => set('notes', v || null)} />
      <Button label="Guardar" icon="checkmark" disabled={busy} onPress={save} />
    </Screen>
  );
}
