import { BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

export const ALLOWED_LMS_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const ALLOWED_LMS_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

export function ensureUploadSubdir(subdir: string): string {
  const base = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  const full = path.join(base, subdir);
  fs.mkdirSync(full, { recursive: true });
  return full;
}

export function validateUploadedFile(
  file: Express.Multer.File,
  allowedMimes: string[] = ALLOWED_LMS_MIME_TYPES,
  maxBytes: number = (parseInt(process.env.MAX_UPLOAD_MB || '10', 10) || 10) *
    1024 *
    1024,
) {
  if (!file) {
    throw new BadRequestException('File upload is required');
  }
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!allowedMimes.includes(file.mimetype) || !ALLOWED_LMS_EXTENSIONS.includes(ext)) {
    throw new BadRequestException(
      `Unsupported file format (${file.mimetype || ext}). Allowed: PDF, JPG, PNG, WEBP`,
    );
  }
  if (file.size > maxBytes) {
    throw new BadRequestException(
      `File exceeds maximum size of ${Math.round(maxBytes / (1024 * 1024))} MB`,
    );
  }
}

export function sanitizeFilename(name: string): string {
  return path
    .basename(name || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
}

