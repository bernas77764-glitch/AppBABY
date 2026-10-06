import type { SQLiteDatabase } from 'expo-sqlite';

import { listDocumentIdsForMember, listNotificationIdsForMember } from '@/db/repo';
import { deleteDocumentFiles } from './files';
import { cancelReminders } from './notifications';

/** Antes de apagar um membro: cancela lembretes e apaga os ficheiros dos seus documentos. */
export async function cleanupMember(db: SQLiteDatabase, memberId: string): Promise<void> {
  await cancelReminders(await listNotificationIdsForMember(db, memberId));
  for (const id of await listDocumentIdsForMember(db, memberId)) deleteDocumentFiles(id);
}
