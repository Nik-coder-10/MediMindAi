import { AppError } from "@/lib/api/errors";

export interface ValidationResult {
  isValid: boolean;
  mimeType: string;
  extension: string;
  error?: string;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
];

export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".txt",
];

/**
 * Inspects buffer magic bytes (file signature) to detect actual binary format
 */
export function detectMagicBytes(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) return null;

  // PDF: %PDF (0x25 0x50 0x44 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  // PNG: \x89PNG (0x89 0x50 0x4E 0x47)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // JPEG: \xFF\xD8\xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Validates uploaded file buffer, size, extension, and MIME type
 */
export function validateUploadedDocument(
  fileBuffer: Buffer,
  fileName: string,
  declaredMimeType: string
): ValidationResult {
  // 1. Check for empty files
  if (!fileBuffer || fileBuffer.length === 0) {
    throw AppError.badRequest("Uploaded file is empty.");
  }

  // 2. Enforce 10MB size limit
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw AppError.badRequest(
      `File size (${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB) exceeds the 10MB limit.`
    );
  }

  // 3. Inspect extension
  const ext = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase()}`
    : "";

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw AppError.badRequest(
      `File extension '${ext}' is not supported. Supported: ${ALLOWED_EXTENSIONS.join(", ")}`
    );
  }

  // 4. Magic bytes detection
  const detectedMime = detectMagicBytes(fileBuffer) || declaredMimeType;

  if (!ALLOWED_MIME_TYPES.includes(detectedMime) && !ALLOWED_MIME_TYPES.includes(declaredMimeType)) {
    throw AppError.badRequest(
      `MIME type '${detectedMime || declaredMimeType}' is unsupported. Only PDF, JPG, PNG, WEBP, and TXT are supported.`
    );
  }

  return {
    isValid: true,
    mimeType: detectedMime || declaredMimeType,
    extension: ext,
  };
}
