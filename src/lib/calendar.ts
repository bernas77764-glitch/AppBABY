import {
  ExpoCalendar,
  ExpoCalendarEvent,
  getCalendarPermissions,
  getCalendars,
  requestCalendarPermissions,
} from 'expo-calendar';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getMember,
  getSetting,
  listAppointmentsInCalendar,
  listScheduledUpcoming,
  setAppointmentCalendarEvent,
  setSetting,
} from '@/db/repo';
import type { Appointment, Member } from '@/db/types';

/*
 * Sincronização com o calendário do telemóvel. No Android, os calendários da conta Google
 * do telemóvel aparecem aqui e o sistema envia os eventos para o Google Calendário.
 * Só vai para o calendário o essencial (motivo, membro, médico e local); as notas clínicas
 * ficam apenas na app.
 */

const CALENDAR_SETTING = 'calendar.id';
const DEFAULT_DURATION_MS = 60 * 60_000;
const GOOGLE_ACCOUNT_TYPE = 'com.google';

export type CalendarOption = {
  id: string;
  title: string;
  account: string;
  color?: string;
  isGoogle: boolean;
};

export async function ensureCalendarPermission(ask: boolean): Promise<boolean> {
  const current = await getCalendarPermissions();
  if (current.granted) return true;
  if (!ask) return false;
  return (await requestCalendarPermissions()).granted;
}

function isGoogle(calendar: ExpoCalendar): boolean {
  const source = calendar.source;
  return source?.type === GOOGLE_ACCOUNT_TYPE || /gmail|google/i.test(source?.name ?? '');
}

/** Calendários onde a app pode escrever, com os da conta Google primeiro. */
export async function listWritableCalendars(): Promise<CalendarOption[]> {
  const calendars = await getCalendars();
  return calendars
    .filter((cal) => cal.allowsModifications)
    .map((cal) => ({
      id: cal.id,
      title: cal.title,
      account: cal.source?.name ?? '',
      color: cal.color,
      isGoogle: isGoogle(cal),
    }))
    .sort((a, b) => Number(b.isGoogle) - Number(a.isGoogle) || a.account.localeCompare(b.account));
}

export function getSyncCalendarId(db: SQLiteDatabase): Promise<string | null> {
  return getSetting(db, CALENDAR_SETTING);
}

async function findEvent(eventId: string): Promise<ExpoCalendarEvent | null> {
  try {
    return await ExpoCalendarEvent.get(eventId);
  } catch {
    // O evento foi apagado no calendário.
    return null;
  }
}

export async function removeCalendarEvent(eventId: string | null): Promise<void> {
  if (!eventId || !(await ensureCalendarPermission(false))) return;
  const event = await findEvent(eventId);
  await event?.delete().catch(() => undefined);
}

function eventDetails(appointment: Appointment, member: Member | null) {
  return {
    title: member ? `${appointment.title} (${member.name})` : appointment.title,
    location: appointment.location ?? '',
    notes: [appointment.professional, 'Marcado na AppBABY'].filter(Boolean).join('\n'),
    startDate: new Date(appointment.startsAt),
    endDate: new Date(appointment.startsAt + DEFAULT_DURATION_MS),
    // Os lembretes já são dados pela própria app; assim não aparecem em duplicado.
    alarms: [],
  };
}

/**
 * Cria, atualiza ou remove o evento de uma consulta no calendário escolhido.
 * Consultas canceladas saem do calendário. Não faz nada se a sincronização estiver desligada.
 */
export async function syncAppointment(db: SQLiteDatabase, appointment: Appointment): Promise<void> {
  const calendarId = await getSyncCalendarId(db);
  if (!calendarId || !(await ensureCalendarPermission(false))) return;

  if (appointment.status === 'cancelled') {
    await removeCalendarEvent(appointment.calendarEventId);
    await setAppointmentCalendarEvent(db, appointment.id, null);
    return;
  }

  const details = eventDetails(appointment, await getMember(db, appointment.memberId));
  const existing = appointment.calendarEventId ? await findEvent(appointment.calendarEventId) : null;
  if (existing && existing.calendarId === calendarId) {
    await existing.update(details);
    return;
  }
  // Não existe ou ficou noutro calendário (o utilizador mudou de calendário).
  await existing?.delete().catch(() => undefined);
  const calendar = await ExpoCalendar.get(calendarId);
  const created = await calendar.createEvent(details);
  await setAppointmentCalendarEvent(db, appointment.id, created.id);
}

/** Sincroniza sem interromper quem chama: um erro no calendário não deve impedir guardar a consulta. */
export async function trySyncAppointment(db: SQLiteDatabase, appointment: Appointment): Promise<boolean> {
  try {
    await syncAppointment(db, appointment);
    return true;
  } catch (e) {
    console.warn('Falha ao sincronizar com o calendário', e);
    return false;
  }
}

/** Liga a sincronização ao calendário indicado e envia todas as próximas consultas marcadas. */
export async function enableCalendarSync(db: SQLiteDatabase, calendarId: string): Promise<number> {
  await setSetting(db, CALENDAR_SETTING, calendarId);
  const upcoming = await listScheduledUpcoming(db);
  for (const appointment of upcoming) await syncAppointment(db, appointment);
  return upcoming.length;
}

/** Desliga a sincronização e, se pedido, retira do calendário os eventos criados pela app. */
export async function disableCalendarSync(db: SQLiteDatabase, removeEvents: boolean): Promise<void> {
  await setSetting(db, CALENDAR_SETTING, null);
  for (const appointment of await listAppointmentsInCalendar(db)) {
    if (removeEvents) await removeCalendarEvent(appointment.calendarEventId);
    await setAppointmentCalendarEvent(db, appointment.id, null);
  }
}

/** Antes de apagar um membro: retira as suas consultas do calendário. */
export async function removeMemberCalendarEvents(db: SQLiteDatabase, memberId: string): Promise<void> {
  for (const appointment of await listAppointmentsInCalendar(db, memberId)) {
    await removeCalendarEvent(appointment.calendarEventId);
  }
}
