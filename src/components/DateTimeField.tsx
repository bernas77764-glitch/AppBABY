import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatTime } from '@/lib/format';
import { useColors } from '@/lib/theme';

type Props = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  mode?: 'date' | 'datetime';
  clearable?: boolean;
};

/** Campo de data (e hora). No Android abre os seletores nativos um de cada vez. */
export function DateTimeField({ label, value, onChange, mode = 'datetime', clearable }: Props) {
  const c = useColors();
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [fallback] = useState(() => Date.now());
  const current = new Date(value ?? fallback);

  const handle = (kind: 'date' | 'time') => (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type !== 'set' || !picked) return;
    const next = new Date(current);
    if (kind === 'date') next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    else next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    if (mode === 'date') next.setHours(12, 0, 0, 0);
    onChange(next.getTime());
  };

  const handleIos = (event: DateTimePickerEvent, picked?: Date) => {
    if (event.type !== 'set' || !picked) return;
    const next = new Date(picked);
    if (mode === 'date') next.setHours(12, 0, 0, 0);
    else next.setSeconds(0, 0);
    onChange(next.getTime());
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
        <View style={styles.row}>
          <DateTimePicker value={current} mode={mode} locale="pt-PT" onChange={handleIos} />
          {clearable && value != null ? (
            <Pressable onPress={() => onChange(null)}>
              <Text style={{ color: c.primary }}>Limpar</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <View style={styles.row}>
        <Pressable style={[styles.box, { borderColor: c.border, backgroundColor: c.card }]} onPress={() => setPicker('date')}>
          <Text style={{ color: value == null ? c.muted : c.text }}>{value == null ? 'Escolher data' : formatDate(value)}</Text>
        </Pressable>
        {mode === 'datetime' ? (
          <Pressable style={[styles.box, { borderColor: c.border, backgroundColor: c.card }]} onPress={() => setPicker('time')}>
            <Text style={{ color: c.text }}>{formatTime(current.getTime())}</Text>
          </Pressable>
        ) : null}
        {clearable && value != null ? (
          <Pressable onPress={() => onChange(null)}>
            <Text style={{ color: c.primary }}>Limpar</Text>
          </Pressable>
        ) : null}
      </View>
      {picker ? (
        <DateTimePicker value={current} mode={picker} is24Hour onChange={handle(picker)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
});
