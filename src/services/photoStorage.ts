import * as FileSystem from "expo-file-system";
import { generateId } from "../utils/id";

/**
 * expo-image-picker returns URIs in the app cache, which the OS may clear at
 * any time. Photos are copied here so they survive as long as the app does.
 */
const PHOTO_DIR = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}photos/`
  : null;

function isPersisted(uri: string): boolean {
  return PHOTO_DIR !== null && uri.startsWith(PHOTO_DIR);
}

function isRemote(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

/**
 * Copies a picked photo (or downloads a remote one, e.g. the product image
 * from the barcode lookup) into permanent storage and returns the new URI.
 */
export async function persistPhoto(uri?: string): Promise<string | undefined> {
  if (!uri || !PHOTO_DIR || isPersisted(uri)) return uri;
  try {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
    const ext = uri.split("?")[0].split(".").pop()?.toLowerCase();
    const safeExt = ext && /^[a-z0-9]{2,4}$/.test(ext) ? ext : "jpg";
    const dest = `${PHOTO_DIR}${generateId()}.${safeExt}`;
    if (isRemote(uri)) {
      const result = await FileSystem.downloadAsync(uri, dest);
      if (result.status < 200 || result.status >= 300) {
        await FileSystem.deleteAsync(dest, { idempotent: true });
        throw new Error(`Download foto fallito (HTTP ${result.status})`);
      }
    } else {
      await FileSystem.copyAsync({ from: uri, to: dest });
    }
    return dest;
  } catch (error) {
    // Better to keep the (temporary) photo than to fail the whole save.
    console.warn("Impossibile salvare la foto in modo permanente", error);
    return uri;
  }
}

/**
 * For photos saved before persistPhoto existed: moves a still-existing
 * cached file to permanent storage, or drops the reference if the OS has
 * already deleted it (so the list doesn't show a broken image).
 */
export async function repairStoredPhoto(uri?: string): Promise<string | undefined> {
  if (!uri || !PHOTO_DIR || isPersisted(uri)) return uri;
  if (isRemote(uri)) return persistPhoto(uri);
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return undefined;
  const persisted = await persistPhoto(uri);
  return persisted;
}

/** Deletes a photo previously stored by persistPhoto; ignores anything else. */
export async function deletePhoto(uri?: string): Promise<void> {
  if (!uri || !isPersisted(uri)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}
