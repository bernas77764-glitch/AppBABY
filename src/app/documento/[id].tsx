import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, Image, useWindowDimensions } from 'react-native';

import { Body, Button, Card, Row, Screen, Title } from '@/components/ui';
import { deleteDocument, getAppointment, getDocument, getMember } from '@/db/repo';
import { categoryLabel, type StoredFile } from '@/db/types';
import { deleteDocumentFiles, fileFor } from '@/lib/files';
import { formatDate } from '@/lib/format';
import { useData } from '@/lib/useData';

async function openFile(file: StoredFile) {
  await Sharing.shareAsync(fileFor(file).uri, { mimeType: file.mimeType, dialogTitle: 'Abrir documento' });
}

export default function DocumentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { width } = useWindowDimensions();
  const { data } = useData(async (db) => {
    const doc = await getDocument(db, id);
    if (!doc) return null;
    const [member, appointment] = await Promise.all([
      getMember(db, doc.memberId),
      doc.appointmentId ? getAppointment(db, doc.appointmentId) : null,
    ]);
    return { doc, member, appointment };
  }, [id]);

  if (!data) return <Screen>{null}</Screen>;
  const { doc, member, appointment } = data;
  const pageWidth = width - 32;

  const remove = () =>
    Alert.alert('Apagar documento?', 'Os ficheiros são apagados do telemóvel. Não dá para desfazer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await deleteDocument(db, doc.id);
          deleteDocumentFiles(doc.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <Title>{doc.title}</Title>
      <Body muted>
        {[categoryLabel(doc.category), member?.name, doc.docDate ? formatDate(doc.docDate) : null].filter(Boolean).join(' · ')}
      </Body>
      {appointment ? (
        <Card onPress={() => router.push({ pathname: '/consulta/[id]', params: { id: appointment.id } })}>
          <Body>
            Consulta: {appointment.title} · {formatDate(appointment.startsAt)}
          </Body>
        </Card>
      ) : null}
      {doc.notes ? <Body>{doc.notes}</Body> : null}
      <Row style={{ flexWrap: 'wrap' }}>
        <Button
          label="Editar"
          icon="create-outline"
          onPress={() => router.push({ pathname: '/documento/editar', params: { id: doc.id } })}
        />
        <Button label="Apagar" icon="trash-outline" variant="danger" onPress={remove} />
      </Row>
      {doc.files.map((f, i) =>
        f.mimeType.startsWith('image/') ? (
          <Card key={f.path} onPress={() => openFile(f)} style={{ padding: 0, overflow: 'hidden' }}>
            <Image source={{ uri: fileFor(f).uri }} style={{ width: pageWidth, height: pageWidth * 1.41 }} resizeMode="contain" />
          </Card>
        ) : (
          <Button key={f.path} label={`Abrir ficheiro ${i + 1} (PDF)`} icon="open-outline" variant="secondary" onPress={() => openFile(f)} />
        ),
      )}
      <Body muted style={{ fontSize: 13 }}>Toca numa página para a abrir ou partilhar.</Body>
    </Screen>
  );
}
