import { Attachment } from '@core/models';

/**
 * Illustrative placeholder graphics for the demo galleries.
 *
 * These are deliberately abstract blueprint drawings, not photographs. The app
 * displays damage reports and reconstruction progress for real places, so
 * fabricating photo-like imagery of destruction would misrepresent real
 * suffering. A real deployment replaces these with genuine uploads.
 */
const PLACEHOLDER_COUNT = 6;

export function placeholderPhoto(id: string, variant: number, uploadedAt: string): Attachment {
  // 1-based file names, wrapping so any caller index is safe.
  const index = (Math.abs(variant) % PLACEHOLDER_COUNT) + 1;
  return {
    id,
    url: `/img/placeholder-${index}.svg`,
    fileName: `placeholder-${index}.svg`,
    mimeType: 'image/svg+xml',
    uploadedAt,
  };
}

/** A short run of distinct placeholders, for galleries and phase thumbnails. */
export function placeholderPhotos(idPrefix: string, count: number, uploadedAt: string): Attachment[] {
  return Array.from({ length: count }, (_, i) =>
    placeholderPhoto(`${idPrefix}-photo-${i + 1}`, i + idPrefix.length, uploadedAt),
  );
}
