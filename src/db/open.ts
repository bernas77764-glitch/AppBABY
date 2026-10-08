import { deleteDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrate } from './schema';

export const DATABASE_NAME = 'appbaby.db';

/** Com SQLCipher, a chave tem de ser a primeira instrução depois de abrir a base de dados. */
export async function applyKey(db: SQLiteDatabase, key: string): Promise<void> {
  await db.execAsync(`PRAGMA key = "x'${key}'"`);
}

async function canRead(db: SQLiteDatabase): Promise<boolean> {
  try {
    await db.getFirstAsync('SELECT count(*) FROM sqlite_master');
    return true;
  } catch {
    return false;
  }
}

/**
 * Garante que a base de dados abre com esta chave e está migrada.
 * Se o ficheiro existir mas não for legível com a chave (ficou corrompido ou foi criado
 * por uma versão anterior sem cifra), é apagado e recriado: sem a chave certa não há
 * forma de recuperar o conteúdo.
 */
export async function prepareDatabase(key: string): Promise<void> {
  let db = await openDatabaseAsync(DATABASE_NAME);
  await applyKey(db, key);
  if (!(await canRead(db))) {
    await db.closeAsync();
    await deleteDatabaseAsync(DATABASE_NAME);
    db = await openDatabaseAsync(DATABASE_NAME);
    await applyKey(db, key);
  }
  try {
    await migrate(db);
  } finally {
    await db.closeAsync();
  }
}
