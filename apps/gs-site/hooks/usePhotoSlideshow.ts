'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Photo,
  PhotoCategory,
  PhotosResponse,
  PhotoUploadPayload,
  PhotoUpdatePayload,
  PhotoUploadResponse,
  PhotoDeleteResponse,
} from '@/lib/slideshow/types';

const QUERY_KEY = 'photo-slideshow';

/**
 * Fetch photos from API
 */
async function fetchPhotos(category: PhotoCategory | 'all' = 'all'): Promise<PhotosResponse> {
  const params = new URLSearchParams();
  params.set('category', category);
  params.set('limit', '100');

  const response = await fetch(`/api/slideshow/photos?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch photos');
  }

  return response.json();
}

/**
 * Upload a photo
 */
async function uploadPhoto(
  file: File,
  payload: PhotoUploadPayload
): Promise<PhotoUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', payload.category);
  if (payload.caption) formData.append('caption', payload.caption);
  if (payload.dateTaken) formData.append('dateTaken', payload.dateTaken);

  const response = await fetch('/api/slideshow/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload photo');
  }

  return response.json();
}

/**
 * Update a photo
 */
async function updatePhoto(
  photoId: string,
  payload: PhotoUpdatePayload
): Promise<{ photo: Photo; success: true }> {
  const response = await fetch(`/api/slideshow/${photoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update photo');
  }

  return response.json();
}

/**
 * Delete a photo
 */
async function deletePhoto(photoId: string): Promise<PhotoDeleteResponse> {
  const response = await fetch(`/api/slideshow/${photoId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete photo');
  }

  return response.json();
}

/**
 * Hook for fetching and managing slideshow photos
 */
export function usePhotoSlideshow(category: PhotoCategory | 'all' = 'all') {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, category],
    queryFn: () => fetchPhotos(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, payload }: { file: File; payload: PhotoUploadPayload }) =>
      uploadPhoto(file, payload),
    onSuccess: () => {
      // Invalidate all photo queries to refresh lists
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ photoId, payload }: { photoId: string; payload: PhotoUpdatePayload }) =>
      updatePhoto(photoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  return {
    photos: query.data?.photos || [],
    totalCount: query.data?.totalCount || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Mutations
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,

    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    remove: deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for getting a random photo for the tile preview
 */
export function useRandomPhoto() {
  const { photos, isLoading, isError } = usePhotoSlideshow('all');

  const randomPhoto = photos.length > 0
    ? photos[Math.floor(Math.random() * photos.length)]
    : null;

  return {
    photo: randomPhoto,
    totalCount: photos.length,
    isLoading,
    isError,
  };
}

export default usePhotoSlideshow;
