'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface EPSN3Upload {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  storagePath: string;
}

interface UploadsResponse {
  uploads: EPSN3Upload[];
  totalCount: number;
}

interface UploadResponse {
  upload: EPSN3Upload;
  success: boolean;
}

interface DeleteResponse {
  success: boolean;
  deletedId: string;
}

const QUERY_KEY = 'epsn3-uploads';

async function fetchUploads(): Promise<UploadsResponse> {
  const response = await fetch('/api/epsn3/uploads?limit=100');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch uploads');
  }

  return response.json();
}

async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/epsn3/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  return response.json();
}

async function deleteUpload(uploadId: string): Promise<DeleteResponse> {
  const response = await fetch(`/api/epsn3/${uploadId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete upload');
  }

  return response.json();
}

export function useEPSN3Uploads() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchUploads,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  return {
    uploads: query.data?.uploads || [],
    totalCount: query.data?.totalCount || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,

    remove: deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export default useEPSN3Uploads;
