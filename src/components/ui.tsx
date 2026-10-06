import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import type { Member } from '@/db/types';
import { useColors } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const c = useColors();
  if (!scroll) return <View style={[styles.screen, { backgroundColor: c.background }]}>{children}</View>;
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: ViewStyle }) {
  const c = useColors();
  const body = <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {body}
    </Pressable>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const c = useColors();
  return <Text style={[styles.title, { color: c.text }]}>{children}</Text>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.section, { color: c.muted }]}>{children}</Text>
      {action}
    </View>
  );
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  const c = useColors();
  return <Text style={[styles.body, { color: muted ? c.muted : c.text }, style]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const c = useColors();
  const bg = variant === 'primary' ? c.primary : 'transparent';
  const fg = variant === 'primary' ? c.primaryText : variant === 'danger' ? c.danger : c.primary;
  const border = variant === 'primary' ? c.primary : variant === 'danger' ? c.danger : c.border;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.muted}
        {...props}
        style={[
          styles.input,
          { color: c.text, borderColor: c.border, backgroundColor: c.card },
          props.multiline ? { minHeight: 88, textAlignVertical: 'top' } : null,
        ]}
      />
    </View>
  );
}

export function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  multiple,
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T | T[] | null;
  onChange: (value: T) => void;
  multiple?: boolean;
}) {
  const c = useColors();
  const selected = (v: T) => (multiple ? (value as T[]).includes(v) : value === v);
  return (
    <View style={styles.field}>
      {label ? <Text style={[styles.label, { color: c.muted }]}>{label}</Text> : null}
      <View style={styles.chips}>
        {options.map((o) => {
          const on = selected(o.value);
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[
                styles.chip,
                { borderColor: on ? c.primary : c.border, backgroundColor: on ? c.chip : c.card },
              ]}
            >
              <Text style={{ color: on ? c.primary : c.text, fontWeight: on ? '600' : '400' }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MemberAvatar({ member, size = 40 }: { member: Pick<Member, 'name' | 'color' | 'kind'>; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: member.color }]}>
      {member.kind === 'pet' ? (
        <Ionicons name="paw" size={size * 0.5} color="#fff" />
      ) : (
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.42 }}>
          {member.name.trim().charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

export function EmptyState({ icon, text, action }: { icon: IconName; text: string; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={c.muted} />
      <Text style={[styles.body, { color: c.muted, textAlign: 'center' }]}>{text}</Text>
      {action}
    </View>
  );
}

export function ColorSwatches({
  label,
  colors,
  value,
  onChange,
  preview,
}: {
  label: string;
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  preview?: ReactNode;
}) {
  const c = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        {preview}
        {colors.map((color) => (
          <Pressable
            key={color}
            accessibilityRole="button"
            accessibilityState={{ selected: value === color }}
            onPress={() => onChange(color)}
            style={[styles.swatch, { backgroundColor: color, borderColor: value === color ? c.text : 'transparent' }]}
          />
        ))}
      </View>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, paddingBottom: 48, flexGrow: 1 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 14, gap: 6 },
  title: { fontSize: 22, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  section: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  body: { fontSize: 15, lineHeight: 21 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 40, paddingHorizontal: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 3 },
});
