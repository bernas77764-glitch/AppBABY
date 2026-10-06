export type MemberKind = 'person' | 'pet';

export type Member = {
  id: string;
  kind: MemberKind;
  name: string;
  birthDate: number | null;
  species: string | null;
  breed: string | null;
  microchip: string | null;
  bloodType: string | null;
  allergies: string | null;
  notes: string | null;
  color: string;
  createdAt: number;
};

export type AppointmentStatus = 'scheduled' | 'done' | 'cancelled';

export type Appointment = {
  id: string;
  memberId: string;
  title: string;
  professional: string | null;
  location: string | null;
  startsAt: number;
  reminderMinutes: number[];
  notificationIds: string[];
  notes: string | null;
  outcome: string | null;
  status: AppointmentStatus;
  createdAt: number;
};

export type DocumentCategory =
  | 'receita'
  | 'analises'
  | 'relatorio'
  | 'imagem'
  | 'vacinas'
  | 'fatura'
  | 'outro';

export const documentCategories: { value: DocumentCategory; label: string }[] = [
  { value: 'receita', label: 'Receita' },
  { value: 'analises', label: 'Análises' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'imagem', label: 'Exame de imagem' },
  { value: 'vacinas', label: 'Vacinas' },
  { value: 'fatura', label: 'Fatura / seguro' },
  { value: 'outro', label: 'Outro' },
];

export function categoryLabel(value: string): string {
  return documentCategories.find((c) => c.value === value)?.label ?? 'Outro';
}

export type StoredFile = {
  /** Caminho relativo à pasta de documentos da app. */
  path: string;
  mimeType: string;
};

export type MedicalDocument = {
  id: string;
  memberId: string;
  appointmentId: string | null;
  title: string;
  category: DocumentCategory;
  files: StoredFile[];
  docDate: number | null;
  notes: string | null;
  createdAt: number;
};
