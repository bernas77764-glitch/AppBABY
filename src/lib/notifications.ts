import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Appointment, Member } from '@/db/types';
import { formatDateTime } from './format';

const CHANNEL_ID = 'consultas';

export const reminderOptions: { minutes: number; label: string }[] = [
  { minutes: 30, label: '30 min antes' },
  { minutes: 120, label: '2 h antes' },
  { minutes: 24 * 60, label: '1 dia antes' },
  { minutes: 7 * 24 * 60, label: '1 semana antes' },
];

export const defaultReminders = [120, 24 * 60];

export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes de consultas',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function cancelReminders(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
}

/**
 * Agenda os lembretes de uma consulta e devolve os ids das notificações criadas.
 * O texto não inclui notas clínicas, porque as notificações aparecem no ecrã bloqueado.
 */
export async function scheduleReminders(appointment: Appointment, member: Member | null): Promise<string[]> {
  if (appointment.status !== 'scheduled' || appointment.reminderMinutes.length === 0) return [];
  if (!(await ensurePermission())) return [];
  const now = Date.now();
  const who = member ? ` (${member.name})` : '';
  const ids: string[] = [];
  for (const minutes of appointment.reminderMinutes) {
    const fireAt = appointment.startsAt - minutes * 60_000;
    if (fireAt <= now) continue;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Consulta${who}`,
        body: `${appointment.title}: ${formatDateTime(appointment.startsAt)}`,
        data: { appointmentId: appointment.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: CHANNEL_ID,
      },
    });
    ids.push(id);
  }
  return ids;
}
