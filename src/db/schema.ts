import type { SQLiteDatabase } from 'expo-sqlite';

// Cada entrada é uma migração; a posição no array é a versão (PRAGMA user_version).
const migrations: string[] = [
  `
  CREATE TABLE members (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('person', 'pet')),
    name TEXT NOT NULL,
    birth_date INTEGER,
    species TEXT,
    breed TEXT,
    microchip TEXT,
    blood_type TEXT,
    allergies TEXT,
    notes TEXT,
    color TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE appointments (
    id TEXT PRIMARY KEY NOT NULL,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    professional TEXT,
    location TEXT,
    starts_at INTEGER NOT NULL,
    reminder_minutes TEXT NOT NULL DEFAULT '[]',
    notification_ids TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    outcome TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'done', 'cancelled')),
    created_at INTEGER NOT NULL
  );
  CREATE INDEX appointments_starts_at ON appointments (starts_at);
  CREATE INDEX appointments_member ON appointments (member_id);

  CREATE TABLE documents (
    id TEXT PRIMARY KEY NOT NULL,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    files TEXT NOT NULL DEFAULT '[]',
    doc_date INTEGER,
    notes TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX documents_member ON documents (member_id);
  CREATE INDEX documents_appointment ON documents (appointment_id);
  `,
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < migrations.length) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(migrations[version]);
      await tx.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
    version += 1;
  }
}
