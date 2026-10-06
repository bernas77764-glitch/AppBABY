import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import DocumentScanner, { ResponseType } from 'react-native-document-scanner-plugin';

import type { StoredFile } from '@/db/types';

/** Ficheiro escolhido pelo utilizador, ainda fora da pasta da app. */
export type PendingFile = { uri: string; mimeType: string; name: string };

// Os documentos ficam na pasta privada da app (não visível a outras apps nem à galeria).
function rootDir(): Directory {
  const dir = new Directory(Paths.document, 'documentos');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export function fileFor(stored: StoredFile): File {
  return new File(rootDir(), stored.path);
}

function extensionFor(mimeType: string, name: string): string {
  const fromName = name.includes('.') ? name.split('.').pop() : undefined;
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png') return 'png';
  return 'jpg';
}

export async function scanWithCamera(): Promise<PendingFile[]> {
  const result = await DocumentScanner.scanDocument({
    croppedImageQuality: 85,
    responseType: ResponseType.ImageFilePath,
  });
  return (result.scannedImages ?? []).map((uri, i) => ({
    uri: uri.startsWith('file://') ? uri : `file://${uri}`,
    mimeType: 'image/jpeg',
    name: `pagina-${i + 1}.jpg`,
  }));
}

export async function pickFromGallery(): Promise<PendingFile[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.85,
  });
  if (result.canceled) return [];
  return result.assets.map((a, i) => ({
    uri: a.uri,
    mimeType: a.mimeType ?? 'image/jpeg',
    name: a.fileName ?? `imagem-${i + 1}.jpg`,
  }));
}

export async function pickPdfOrFile(): Promise<PendingFile[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({
    uri: a.uri,
    mimeType: a.mimeType ?? 'application/octet-stream',
    name: a.name,
  }));
}

/** Copia os ficheiros escolhidos para a pasta do documento e devolve as referências guardadas. */
export async function storeFiles(documentId: string, pending: PendingFile[]): Promise<StoredFile[]> {
  const dir = new Directory(rootDir(), documentId);
  if (!dir.exists) dir.create({ intermediates: true });
  const stored: StoredFile[] = [];
  for (const [i, p] of pending.entries()) {
    const fileName = `${String(i + 1).padStart(2, '0')}-${Date.now()}.${extensionFor(p.mimeType, p.name)}`;
    const target = new File(dir, fileName);
    await new File(p.uri).copy(target);
    stored.push({ path: `${documentId}/${fileName}`, mimeType: p.mimeType });
  }
  return stored;
}

export function deleteStoredFile(stored: StoredFile): void {
  const file = fileFor(stored);
  if (file.exists) file.delete();
}

export function deleteDocumentFiles(documentId: string): void {
  const dir = new Directory(rootDir(), documentId);
  if (dir.exists) dir.delete();
}
