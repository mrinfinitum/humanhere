export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const extensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/wav": "wav",
  "video/mp4": "mp4", "video/quicktime": "mov", "application/pdf": "pdf",
};

export function uploadMetadata(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const { contentType, size } = value as Record<string, unknown>;
  if (typeof contentType !== "string" || !Object.hasOwn(extensions, contentType) ||
    typeof size !== "number" || !Number.isInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) return null;
  return {
    contentType, size, extension: extensions[contentType],
    mediaType: contentType.startsWith("image/") ? "image" : contentType.startsWith("video/") ? "video" : contentType.startsWith("audio/") ? "audio" : "document",
  };
}

export function isOwnedUploadKey(key: unknown, userId: string, submissionId: string): key is string {
  if (typeof key !== "string") return false;
  const prefix = `${userId}/${submissionId}/pending/`;
  return key.startsWith(prefix) && /^[0-9a-f-]{36}\.(jpg|png|webp|mp3|m4a|wav|mp4|mov|pdf)$/.test(key.slice(prefix.length));
}
