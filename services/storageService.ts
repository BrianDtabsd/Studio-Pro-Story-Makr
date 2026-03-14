import { getStorage, ref, uploadString, uploadBytes, getDownloadURL, deleteObject, listAll, StorageReference } from 'firebase/storage';
import { getApp } from 'firebase/app';

const storage = () => getStorage(getApp());

// ── Image compression ────────────────────────────────────────────────────────
// Converts any PNG/image data URL to JPEG at the given quality (0–1).
// Reduces scene images ~65% and thumbnails ~70% before Storage upload.

async function compressToJpeg(dataUrl: string, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

// ── Upload helpers ────────────────────────────────────────────────────────────

/**
 * Upload a base64 image data URL to Storage.
 * Returns the permanent download URL.
 * Uses the same path on regeneration so the old file is automatically overwritten.
 */
export async function uploadImageAsset(
  userId: string,
  projectId: string,
  assetId: string,
  dataUrl: string,
  quality = 0.85
): Promise<string> {
  const jpeg = await compressToJpeg(dataUrl, quality);
  const base64 = jpeg.split(',')[1];
  const storageRef = ref(
    storage(),
    `story-makr/users/${userId}/projects/${projectId}/images/${assetId}.jpg`
  );
  await uploadString(storageRef, base64, 'base64', { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

/**
 * Upload an audio asset to Storage.
 * Accepts blob: URLs (from URL.createObjectURL) or data: URLs.
 * Uses fetch() to get the raw Blob — no changes to how TTS generates audio.
 * Returns the permanent download URL.
 */
export async function uploadAudioAsset(
  userId: string,
  projectId: string,
  chunkId: string,
  audioUrl: string
): Promise<string> {
  const blob = await fetch(audioUrl).then(r => r.blob());
  const storageRef = ref(
    storage(),
    `story-makr/users/${userId}/projects/${projectId}/audio/${chunkId}.wav`
  );
  await uploadBytes(storageRef, blob, { contentType: 'audio/wav' });
  return getDownloadURL(storageRef);
}

/**
 * Upload a user avatar image to Storage.
 * Overwrites on re-upload. Returns permanent download URL.
 */
export async function uploadAvatarAsset(userId: string, dataUrl: string): Promise<string> {
  const jpeg = await compressToJpeg(dataUrl, 0.8);
  const base64 = jpeg.split(',')[1];
  const storageRef = ref(storage(), `story-makr/users/${userId}/avatar.jpg`);
  await uploadString(storageRef, base64, 'base64', { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

// ── Cleanup helpers ───────────────────────────────────────────────────────────

async function deleteFolder(folderRef: StorageReference): Promise<void> {
  const list = await listAll(folderRef);
  await Promise.all([
    ...list.items.map(item => deleteObject(item)),
    ...list.prefixes.map(prefix => deleteFolder(prefix)),
  ]);
}

/**
 * Delete all Storage assets for a project.
 * Called when a project is deleted from Firestore.
 * Best-effort — never blocks project deletion if Storage fails.
 */
export async function deleteProjectAssets(userId: string, projectId: string): Promise<void> {
  const folderRef = ref(storage(), `story-makr/users/${userId}/projects/${projectId}`);
  await deleteFolder(folderRef);
}
