/**
 * Photo Slideshow Types
 *
 * Categories for organizing personal photos in the slideshow tile.
 */

export const PHOTO_CATEGORIES = [
  'grub-villain',
  'family',
  'friends',
  'habitat',
  'dogs',
  'quotes',
  'inspo',
  'linkedin-ppl',
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export interface Photo {
  id: string;
  userId: string;
  category: PhotoCategory;
  storagePath: string;
  publicUrl: string;
  originalFilename: string | null;
  caption: string | null;
  dateTaken: string | null; // ISO date string
  createdAt: string; // ISO date string
  metadata: Record<string, unknown> | null;
}

export interface PhotoUploadPayload {
  category: PhotoCategory;
  caption?: string;
  dateTaken?: string;
}

export interface PhotoUpdatePayload {
  category?: PhotoCategory;
  caption?: string;
  dateTaken?: string;
}

export interface PhotosResponse {
  photos: Photo[];
  totalCount: number;
  category: PhotoCategory | 'all';
}

export interface PhotoUploadResponse {
  photo: Photo;
  success: true;
}

export interface PhotoDeleteResponse {
  success: true;
  deletedId: string;
}
