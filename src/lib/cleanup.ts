import type { SQLiteDatabase } from 'expo-sqlite';

import { listDocumentIdsForMember, listNotificationIdsForMember } from '@/db/repo';
import { removeMemberCalendarEvents } from './calendar';
import { deleteDocumentFiles } from './files';
import { cancelReminders } from './notifications';

/** Antes de apagar um membro: cancela lembretes, retira as consultas do calendário e apaga os ficheiros dos documentos. */
export async function cleanupMember(db: SQLiteDatabase, memberId: string): Promise<void> {
  await cancelReminders(await listNotificationIdsForMember(db, memberId));
  await removeMemberCalendarEvents(db, memberId).catch(() => undefined);
  for (const id of await listDocumentIdsForMember(db, memberId)) deleteDocumentFiles(id);
}
