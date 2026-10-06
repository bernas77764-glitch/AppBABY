import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';

import { categoryLabel, type MedicalDocument, type Member } from '@/db/types';
import { fileFor } from '@/lib/files';
import { formatDate } from '@/lib/format';
import { useColors } from '@/lib/theme';
import { Body, Card, Row } from './ui';

export function DocumentCard({ document, member }: { document: MedicalDocument; member?: Member }) {
  const c = useColors();
  const first = document.files[0];
  const isImage = first?.mimeType.startsWith('image/');
  return (
    <Card onPress={() => router.push({ pathname: '/documento/[id]', params: { id: document.id } })}>
      <Row>
        <View
          style={{
            width: 48,
            height: 60,
            borderRadius: 6,
            backgroundColor: c.chip,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {first && isImage ? (
            <Image source={{ uri: fileFor(first).uri }} style={{ width: 48, height: 60 }} />
          ) : (
            <Ionicons name={first ? 'document-outline' : 'document-attach-outline'} size={24} color={c.primary} />
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{document.title}</Text>
          <Body muted>{[categoryLabel(document.category), member?.name].filter(Boolean).join(' · ')}</Body>
          <Body muted style={{ fontSize: 13 }}>
            {formatDate(document.docDate ?? document.createdAt)} · {document.files.length}{' '}
            {document.files.length === 1 ? 'ficheiro' : 'ficheiros'}
          </Body>
        </View>
      </Row>
    </Card>
  );
}
