import { useMemo } from 'react';

import { listMembers } from '@/db/repo';
import type { Member } from '@/db/types';
import { useData } from './useData';

export function useMembers(): { members: Member[] | undefined; byId: Map<string, Member> } {
  const { data } = useData(listMembers, []);
  const byId = useMemo(() => new Map((data ?? []).map((m) => [m.id, m])), [data]);
  return { members: data, byId };
}
