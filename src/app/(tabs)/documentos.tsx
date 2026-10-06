import { router } from 'expo-router';
import { useState } from 'react';

import { DocumentCard } from '@/components/DocumentCard';
import { Button, Chips, EmptyState, Field, Row, Screen } from '@/components/ui';
import { listDocuments } from '@/db/repo';
import { documentCategories, type DocumentCategory } from '@/db/types';
import { useData } from '@/lib/useData';
import { useMembers } from '@/lib/useMembers';

export default function Documents() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [memberId, setMemberId] = useState<string>('all');
  const { members, byId } = useMembers();
  const { data } = useData(
    (db) =>
      listDocuments(db, {
        search,
        category: category === 'all' ? undefined : category,
        memberId: memberId === 'all' ? undefined : memberId,
      }),
    [search, category, memberId],
  );

  return (
    <Screen>
      <Row style={{ flexWrap: 'wrap' }}>
        <Button
          label="Digitalizar"
          icon="scan-outline"
          onPress={() => router.push({ pathname: '/documento/editar', params: { scan: '1' } })}
        />
        <Button label="Importar" icon="cloud-upload-outline" variant="secondary" onPress={() => router.push('/documento/editar')} />
      </Row>
      <Field label="Pesquisar" placeholder="Título ou notas" value={search} onChangeText={setSearch} clearButtonMode="while-editing" />
      <Chips
        options={[{ value: 'all' as const, label: 'Todas' }, ...documentCategories]}
        value={category}
        onChange={setCategory}
      />
      {members && members.length > 1 ? (
        <Chips
          options={[{ value: 'all', label: 'Todos' }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
          value={memberId}
          onChange={setMemberId}
        />
      ) : null}
      {data?.length === 0 ? <EmptyState icon="document-text-outline" text="Nenhum documento encontrado." /> : null}
      {data?.map((d) => <DocumentCard key={d.id} document={d} member={byId.get(d.memberId)} />)}
    </Screen>
  );
}
