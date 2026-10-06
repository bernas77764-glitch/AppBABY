import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';

import type {
  Appointment,
  AppointmentStatus,
  DocumentCategory,
  MedicalDocument,
  Member,
  MemberKind,
  StoredFile,
} from './types';

type MemberRow = {
  id: string;
  kind: MemberKind;
  name: string;
  birth_date: number | null;
  species: string | null;
  breed: string | null;
  microchip: string | null;
  blood_type: string | null;
  allergies: string | null;
  notes: string | null;
  color: string;
  created_at: number;
};

type AppointmentRow = {
  id: string;
  member_id: string;
  title: string;
  professional: string | null;
  location: string | null;
  starts_at: number;
  reminder_minutes: string;
  notification_ids: string;
  notes: string | null;
  outcome: string | null;
  status: AppointmentStatus;
  created_at: number;
};

type DocumentRow = {
  id: string;
  member_id: string;
  appointment_id: string | null;
  title: string;
  category: DocumentCategory;
  files: string;
  doc_date: number | null;
  notes: string | null;
  created_at: number;
};

const toMember = (r: MemberRow): Member => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  birthDate: r.birth_date,
  species: r.species,
  breed: r.breed,
  microchip: r.microchip,
  bloodType: r.blood_type,
  allergies: r.allergies,
  notes: r.notes,
  color: r.color,
  createdAt: r.created_at,
});

const toAppointment = (r: AppointmentRow): Appointment => ({
  id: r.id,
  memberId: r.member_id,
  title: r.title,
  professional: r.professional,
  location: r.location,
  startsAt: r.starts_at,
  reminderMinutes: JSON.parse(r.reminder_minutes),
  notificationIds: JSON.parse(r.notification_ids),
  notes: r.notes,
  outcome: r.outcome,
  status: r.status,
  createdAt: r.created_at,
});

const toDocument = (r: DocumentRow): MedicalDocument => ({
  id: r.id,
  memberId: r.member_id,
  appointmentId: r.appointment_id,
  title: r.title,
  category: r.category,
  files: JSON.parse(r.files) as StoredFile[],
  docDate: r.doc_date,
  notes: r.notes,
  createdAt: r.created_at,
});

// Membros

export type MemberInput = Omit<Member, 'id' | 'createdAt'>;

export async function listMembers(db: SQLiteDatabase): Promise<Member[]> {
  const rows = await db.getAllAsync<MemberRow>('SELECT * FROM members ORDER BY kind, name COLLATE NOCASE');
  return rows.map(toMember);
}

export async function getMember(db: SQLiteDatabase, id: string): Promise<Member | null> {
  const row = await db.getFirstAsync<MemberRow>('SELECT * FROM members WHERE id = ?', id);
  return row ? toMember(row) : null;
}

export async function saveMember(db: SQLiteDatabase, input: MemberInput, id?: string): Promise<string> {
  const params = [
    input.kind,
    input.name,
    input.birthDate,
    input.species,
    input.breed,
    input.microchip,
    input.bloodType,
    input.allergies,
    input.notes,
    input.color,
  ];
  if (id) {
    await db.runAsync(
      `UPDATE members SET kind = ?, name = ?, birth_date = ?, species = ?, breed = ?, microchip = ?,
       blood_type = ?, allergies = ?, notes = ?, color = ? WHERE id = ?`,
      ...params,
      id,
    );
    return id;
  }
  const newId = randomUUID();
  await db.runAsync(
    `INSERT INTO members (kind, name, birth_date, species, breed, microchip, blood_type, allergies, notes, color, id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ...params,
    newId,
    Date.now(),
  );
  return newId;
}

export async function deleteMember(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM members WHERE id = ?', id);
}

// Consultas

export type AppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'notificationIds'>;

export async function listAppointments(
  db: SQLiteDatabase,
  filter: { when: 'upcoming' | 'past'; memberId?: string; limit?: number },
): Promise<Appointment[]> {
  const now = Date.now();
  const where = filter.when === 'upcoming' ? 'starts_at >= ?' : 'starts_at < ?';
  const order = filter.when === 'upcoming' ? 'ASC' : 'DESC';
  const params: (string | number)[] = [now];
  let sql = `SELECT * FROM appointments WHERE ${where}`;
  if (filter.memberId) {
    sql += ' AND member_id = ?';
    params.push(filter.memberId);
  }
  sql += ` ORDER BY starts_at ${order}`;
  if (filter.limit) {
    sql += ' LIMIT ?';
    params.push(filter.limit);
  }
  const rows = await db.getAllAsync<AppointmentRow>(sql, params);
  return rows.map(toAppointment);
}

export async function getAppointment(db: SQLiteDatabase, id: string): Promise<Appointment | null> {
  const row = await db.getFirstAsync<AppointmentRow>('SELECT * FROM appointments WHERE id = ?', id);
  return row ? toAppointment(row) : null;
}

export async function saveAppointment(
  db: SQLiteDatabase,
  input: AppointmentInput,
  id?: string,
): Promise<string> {
  const params = [
    input.memberId,
    input.title,
    input.professional,
    input.location,
    input.startsAt,
    JSON.stringify(input.reminderMinutes),
    input.notes,
    input.outcome,
    input.status,
  ];
  if (id) {
    await db.runAsync(
      `UPDATE appointments SET member_id = ?, title = ?, professional = ?, location = ?, starts_at = ?,
       reminder_minutes = ?, notes = ?, outcome = ?, status = ? WHERE id = ?`,
      ...params,
      id,
    );
    return id;
  }
  const newId = randomUUID();
  await db.runAsync(
    `INSERT INTO appointments (member_id, title, professional, location, starts_at, reminder_minutes, notes, outcome, status, id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ...params,
    newId,
    Date.now(),
  );
  return newId;
}

export async function setAppointmentNotifications(db: SQLiteDatabase, id: string, ids: string[]): Promise<void> {
  await db.runAsync('UPDATE appointments SET notification_ids = ? WHERE id = ?', JSON.stringify(ids), id);
}

export async function deleteAppointment(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM appointments WHERE id = ?', id);
}

// Documentos

export type DocumentInput = Omit<MedicalDocument, 'id' | 'createdAt'>;

export async function listDocuments(
  db: SQLiteDatabase,
  filter: { memberId?: string; appointmentId?: string; category?: DocumentCategory; search?: string } = {},
): Promise<MedicalDocument[]> {
  const clauses: string[] = [];
  const params: string[] = [];
  if (filter.memberId) {
    clauses.push('member_id = ?');
    params.push(filter.memberId);
  }
  if (filter.appointmentId) {
    clauses.push('appointment_id = ?');
    params.push(filter.appointmentId);
  }
  if (filter.category) {
    clauses.push('category = ?');
    params.push(filter.category);
  }
  if (filter.search?.trim()) {
    clauses.push('(title LIKE ? OR notes LIKE ?)');
    const like = `%${filter.search.trim()}%`;
    params.push(like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.getAllAsync<DocumentRow>(
    `SELECT * FROM documents ${where} ORDER BY COALESCE(doc_date, created_at) DESC`,
    params,
  );
  return rows.map(toDocument);
}

export async function getDocument(db: SQLiteDatabase, id: string): Promise<MedicalDocument | null> {
  const row = await db.getFirstAsync<DocumentRow>('SELECT * FROM documents WHERE id = ?', id);
  return row ? toDocument(row) : null;
}

export async function saveDocument(db: SQLiteDatabase, input: DocumentInput, id: string, isNew: boolean): Promise<void> {
  const params = [
    input.memberId,
    input.appointmentId,
    input.title,
    input.category,
    JSON.stringify(input.files),
    input.docDate,
    input.notes,
  ];
  if (!isNew) {
    await db.runAsync(
      `UPDATE documents SET member_id = ?, appointment_id = ?, title = ?, category = ?, files = ?, doc_date = ?, notes = ?
       WHERE id = ?`,
      ...params,
      id,
    );
    return;
  }
  await db.runAsync(
    `INSERT INTO documents (member_id, appointment_id, title, category, files, doc_date, notes, id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ...params,
    id,
    Date.now(),
  );
}

export async function deleteDocument(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM documents WHERE id = ?', id);
}

export async function listDocumentIdsForMember(db: SQLiteDatabase, memberId: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM documents WHERE member_id = ?', memberId);
  return rows.map((r) => r.id);
}

export async function listNotificationIdsForMember(db: SQLiteDatabase, memberId: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ notification_ids: string }>(
    'SELECT notification_ids FROM appointments WHERE member_id = ?',
    memberId,
  );
  return rows.flatMap((r) => JSON.parse(r.notification_ids) as string[]);
}
