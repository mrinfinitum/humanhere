/**
 * Checks that an image's bytes match its declared type, and removes metadata
 * such as EXIF (which can hold the GPS position a photo was taken at), XMP,
 * IPTC and text comments. Pixels are untouched. Returns null when the bytes are
 * not a well-formed file of the declared type.
 */

export function isJpeg(bytes: Uint8Array) {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
function isPng(bytes: Uint8Array) {
  return PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function isWebp(bytes: Uint8Array) {
  return bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
}

function join(parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let position = 0;
  for (const part of parts) {
    output.set(part, position);
    position += part.length;
  }
  return output;
}

/** Removes EXIF, XMP and IPTC segments (APP1 and APP13) and comments from a JPEG. */
export function stripJpegMetadata(bytes: Uint8Array) {
  if (!isJpeg(bytes)) return null;
  const kept: Uint8Array[] = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    // Start of scan: the rest is image data.
    if (marker === 0xda) break;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) return null;
    if (marker !== 0xe1 && marker !== 0xed && marker !== 0xfe) kept.push(bytes.subarray(offset, offset + 2 + length));
    offset += 2 + length;
  }
  if (offset + 4 > bytes.length || bytes[offset + 1] !== 0xda) return null;
  kept.push(bytes.subarray(offset));
  return join(kept);
}

// eXIf holds EXIF; tEXt, zTXt and iTXt hold text, including XMP; tIME is the edit time.
const PNG_DROPPED = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);

function stripPngMetadata(bytes: Uint8Array) {
  if (!isPng(bytes)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  let ended = false;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = ascii(bytes, offset + 4, 4);
    const end = offset + 12 + length;
    if (end > bytes.length) return null;
    if (!PNG_DROPPED.has(type)) kept.push(bytes.subarray(offset, end));
    offset = end;
    if (type === "IEND") { ended = true; break; }
  }
  return ended ? join(kept) : null;
}

function stripWebpMetadata(bytes: Uint8Array) {
  if (!isWebp(bytes)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept: Uint8Array[] = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = ascii(bytes, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const end = offset + 8 + size + (size % 2);
    if (offset + 8 + size > bytes.length) return null;
    if (type !== "EXIF" && type !== "XMP ") {
      const chunk = bytes.slice(offset, Math.min(end, bytes.length));
      // VP8X flags announce EXIF (bit 3) and XMP (bit 2); clear them to match.
      if (type === "VP8X" && chunk.length > 8) chunk[8] &= ~0x0c;
      kept.push(chunk);
    }
    offset = end;
  }
  if (!kept.length) return null;
  const body = join(kept);
  const header = new Uint8Array(12);
  header.set(bytes.subarray(0, 12));
  new DataView(header.buffer).setUint32(4, body.length + 4, true);
  return join([header, body]);
}

export function stripImageMetadata(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/jpeg") return stripJpegMetadata(bytes);
  if (contentType === "image/png") return stripPngMetadata(bytes);
  if (contentType === "image/webp") return stripWebpMetadata(bytes);
  return null;
}

/** True when a non-image file starts the way its declared type should. */
export function matchesDeclaredType(bytes: Uint8Array, contentType: string) {
  switch (contentType) {
    case "application/pdf": return ascii(bytes, 0, 5) === "%PDF-";
    case "audio/mpeg": return ascii(bytes, 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    case "audio/wav": return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE";
    case "audio/mp4": case "video/mp4": case "video/quicktime": return ascii(bytes, 4, 4) === "ftyp" || ["moov", "mdat", "wide", "free"].includes(ascii(bytes, 4, 4));
    default: return stripImageMetadata(bytes, contentType) !== null;
  }
}
