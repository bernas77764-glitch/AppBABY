import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { MemberSelect } from '@/components/MemberSelect';
import { Button, Chips, Field, Screen } from '@/components/ui';
import {
  getAppointment,
  getMember,
  saveAppointment,
  setAppointmentNotifications,
  type AppointmentInput,
} from '@/db/repo';
import { cancelReminders, defaultReminders, reminderOptions, scheduleReminders } from '@/lib/notifications';

function nextHalfHour(): number {
  const d = new Date(Date.now() + 24 * 3600_000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  return d.getTime();
}

export default function EditAppointment() {
  const { id, memberId } = useLocalSearchParams<{ id?: string; memberId?: string }>();
  const db = useSQLiteContext();
  const [form, setForm] = useState<AppointmentInput>({
    memberId: memberId ?? '',
    title: '',
    professional: null,
    location: null,
    startsAt: nextHalfHour(),
    reminderMinutes: defaultReminders,
    notes: null,
    outcome: null,
    status: 'scheduled',
  });
  const [oldNotificationIds, setOldNotificationIds] = useState<string[]>([]);
  const set = <K extends keyof AppointmentInput>(key: K, value: AppointmentInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const text = (key: 'professional' | 'location' | 'notes' | 'outcome') => ({
    value: form[key] ?? '',
    onChangeText: (v: string) => set(key, v || null),
  });

  useEffect(() => {
    if (!id) return;
    getAppointment(db, id).then((a) => {
      if (!a) return;
      const { id: _id, createdAt: _c, notificationIds, ...rest } = a;
      setForm(rest);
      setOldNotificationIds(notificationIds);
    });
  }, [db, id]);

  const toggleReminder = (minutes: number) =>
    set(
      'reminderMinutes',
      form.reminderMinutes.includes(minutes)
        ? form.reminderMinutes.filter((m) => m !== minutes)
        : [...form.reminderMinutes, minutes].sort((a, b) => a - b),
    );

  const save = async () => {
    if (!form.memberId) return Alert.alert('Para quem?', 'Escolhe o membro da família.');
    if (!form.title.trim()) return Alert.alert('Falta o motivo', 'Indica a especialidade ou o motivo da consulta.');
    const input = { ...form, title: form.title.trim() };
    const savedId = await saveAppointment(db, input, id);
    await cancelReminders(oldNotificationIds);
    const member = await getMember(db, input.memberId);
    const ids = await scheduleReminders({ ...input, id: savedId, notificationIds: [], createdAt: 0 }, member);
    await setAppointmentNotifications(db, savedId, ids);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? 'Editar consulta' : 'Nova consulta' }} />
      <MemberSelect value={form.memberId || null} onChange={(v) => set('memberId', v)} />
      <Field
        label="Especialidade / motivo"
        placeholder="Ex.: Pediatria, vacina, veterinário"
        value={form.title}
        onChangeText={(v) => set('title', v)}
      />
      <DateTimeField label="Data e hora" value={form.startsAt} onChange={(v) => v != null && set('startsAt', v)} />
      <Field label="Médico / veterinário" {...text('professional')} />
      <Field label="Local" placeholder="Clínica, hospital, centro de saúde" {...text('location')} />
      <Chips
        label="Lembretes"
        multiple
        options={reminderOptions.map((r) => ({ value: r.minutes, label: r.label }))}
        value={form.reminderMinutes}
        onChange={toggleReminder}
      />
      <Field label="Notas / perguntas a fazer" multiline {...text('notes')} />
      {id ? (
        <>
          <Chips
            label="Estado"
            options={[
              { value: 'scheduled' as const, label: 'Marcada' },
              { value: 'done' as const, label: 'Realizada' },
              { value: 'cancelled' as const, label: 'Cancelada' },
            ]}
            value={form.status}
            onChange={(v) => set('status', v)}
          />
          <Field label="O que foi dito / próximos passos" multiline {...text('outcome')} />
        </>
      ) : null}
      <Button label="Guardar" icon="checkmark" onPress={save} />
    </Screen>
  );
}
