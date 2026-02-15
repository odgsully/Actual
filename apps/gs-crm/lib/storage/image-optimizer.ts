/**
 * Image optimization and processing service
 */

import sharp from 'sharp';
import { createClient } from '@/lib/supabase/client';
import { ImageConfig } from '@/lib/scraping/types';

export interface ImageVersion {
  type: 'thumbnail' | 'card' | 'full';
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessedImage {
  originalUrl: string;
  versions: ImageVersion[];
  primaryUrl?: string;
  thumbnailUrl?: string;
  cardUrl?: string;
  fullUrl?: string;
}

export class ImageOptimizer {
  private config: ImageConfig;
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.config = {
      sizes: {
        thumbnail: { width: 300, quality: 85 },
        card: { width: 600, quality: 90 },
        full: { width: 1200, quality: 95 }
      },
      formats: ['webp', 'jpg'],
      maxSizeBytes: 5 * 1024 * 1024, // 5MB max
      compressionQuality: 90
    };
    this.supabase = createClient();
  }

  /**
   * Download and process an image from URL
   */
  async processImageFromUrl(
    imageUrl: string, 
    propertyId: string,
    isPrimary: boolean = false
  ): Promise<ProcessedImage | null> {
    try {
      // Download image
      const imageBuffer = await this.downloadImage(imageUrl);
      if (!imageBuffer) {
        console.error(`Failed to download image: ${imageUrl}`);
        return null;
      }

      // Check image size
      if (imageBuffer.length > this.config.maxSizeBytes) {
        console.warn(`Image too large (${imageBuffer.length} bytes), skipping: ${imageUrl}`);
        return null;
      }

      // Process image into multiple versions
      const versions = await this.createImageVersions(imageBuffer);
      
      // Upload to Supabase Storage
      const uploadedUrls = await this.uploadToSupabase(
        versions,
        propertyId,
        isPrimary
      );

      return {
        originalUrl: imageUrl,
        versions,
        ...uploadedUrls
      };

    } catch (error) {
      console.error(`Error processing image ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<Buffer | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (error) {
      console.error(`Failed to download image from ${url}:`, error);
      return null;
    }
  }

  /**
   * Create multiple versions of an image
   */
  private async createImageVersions(inputBuffer: Buffer): Promise<ImageVersion[]> {
    const versions: ImageVersion[] = [];

    try {
      // Get original image metadata
      const metadata = await sharp(inputBuffer).metadata();
      const originalWidth = metadata.width || 1920;
      const originalHeight = metadata.height || 1080;

      // Create versions for each size
      for (const [type, config] of Object.entries(this.config.sizes)) {
        // Skip if original is smaller than target
        if (originalWidth <= config.width) {
          // Just compress the original
          const optimized = await sharp(inputBuffer)
            .jpeg({ quality: config.quality, progressive: true })
            .toBuffer();

          versions.push({
            type: type as 'thumbnail' | 'card' | 'full',
            buffer: optimized,
            width: originalWidth,
            height: originalHeight,
            format: 'jpg',
            size: optimized.length
          });
        } else {
          // Resize and compress
          const aspectRatio = originalHeight / originalWidth;
          const targetHeight = Math.round(config.width * aspectRatio);

          // Create WebP version (smaller file size)
          const webpBuffer = await sharp(inputBuffer)
            .resize(config.width, targetHeight, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: config.quality })
            .toBuffer();

          // Create JPEG fallback
          const jpegBuffer = await sharp(inputBuffer)
            .resize(config.width, targetHeight, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: config.quality, progressive: true })
            .toBuffer();

          // Use WebP if it's significantly smaller, otherwise use JPEG
          const useWebp = webpBuffer.length < jpegBuffer.length * 0.9;
          
          versions.push({
            type: type as 'thumbnail' | 'card' | 'full',
            buffer: useWebp ? webpBuffer : jpegBuffer,
            width: config.width,
            height: targetHeight,
            format: useWebp ? 'webp' : 'jpg',
            size: useWebp ? webpBuffer.length : jpegBuffer.length
          });
        }
      }

      return versions;

    } catch (error) {
      console.error('Error creating image versions:', error);
      return [];
    }
  }

  /**
   * Upload image versions to Supabase Storage
   */
  private async uploadToSupabase(
    versions: ImageVersion[],
    propertyId: string,
    isPrimary: boolean
  ): Promise<Record<string, string>> {
    const urls: Record<string, string> = {};
    const bucketName = 'property-images';

    for (const version of versions) {
      try {
        const fileName = `${propertyId}/${isPrimary ? 'primary' : 'additional'}_${version.type}.${version.format}`;
        
        // Upload to Supabase Storage
        const { data, error } = await this.supabase.storage
          .from(bucketName)
          .upload(fileName, version.buffer, {
            contentType: `image/${version.format}`,
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error(`Failed to upload ${version.type} version:`, error);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = this.supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        // Store URL by type
        switch (version.type) {
          case 'thumbnail':
            urls.thumbnailUrl = publicUrl;
            break;
          case 'card':
            urls.cardUrl = publicUrl;
            break;
          case 'full':
            urls.fullUrl = publicUrl;
            if (isPrimary) {
              urls.primaryUrl = publicUrl;
            }
            break;
        }

      } catch (error) {
        console.error(`Error uploading ${version.type} version:`, error);
      }
    }

    return urls;
  }

  /**
   * Process multiple images for a property
   */
  async processPropertyImages(
    imageUrls: string[],
    propertyId: string,
    maxImages: number = 10
  ): Promise<ProcessedImage[]> {
    const processedImages: ProcessedImage[] = [];
    const urlsToProcess = imageUrls.slice(0, maxImages);

    // Process primary image first
    if (urlsToProcess.length > 0) {
      const primaryImage = await this.processImageFromUrl(
        urlsToProcess[0],
        propertyId,
        true
      );
      if (primaryImage) {
        processedImages.push(primaryImage);
      }
    }

    // Process additional images in parallel (but limited)
    if (urlsToProcess.length > 1) {
      const additionalUrls = urlsToProcess.slice(1);
      const batchSize = 3; // Process 3 at a time to avoid memory issues

      for (let i = 0; i < additionalUrls.length; i += batchSize) {
        const batch = additionalUrls.slice(i, i + batchSize);
        const batchPromises = batch.map(url => 
          this.processImageFromUrl(url, propertyId, false)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value) {
            processedImages.push(result.value);
          }
        }
      }
    }

    return processedImages;
  }

  /**
   * Clean up old images for a property
   */
  async cleanupPropertyImages(propertyId: string): Promise<void> {
    try {
      const { data: files, error } = await this.supabase.storage
        .from('property-images')
        .list(propertyId);

      if (error) {
        console.error('Error listing files for cleanup:', error);
        return;
      }

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${propertyId}/${file.name}`);
        
        const { error: deleteError } = await this.supabase.storage
          .from('property-images')
          .remove(filePaths);

        if (deleteError) {
          console.error('Error deleting old images:', deleteError);
        }
      }
    } catch (error) {
      console.error('Error during image cleanup:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalImages: number;
    totalSizeBytes: number;
    averageSizeBytes: number;
  }> {
    try {
      const { data: files, error } = await this.supabase.storage
        .from('property-images')
        .list('', {
          limit: 1000,
          offset: 0
        });

      if (error || !files) {
        return {
          totalImages: 0,
          totalSizeBytes: 0,
          averageSizeBytes: 0
        };
      }

      const totalImages = files.length;
      const totalSizeBytes = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      const averageSizeBytes = totalImages > 0 ? Math.round(totalSizeBytes / totalImages) : 0;

      return {
        totalImages,
        totalSizeBytes,
        averageSizeBytes
      };

    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalImages: 0,
        totalSizeBytes: 0,
        averageSizeBytes: 0
      };
    }
  }
}

// Singleton instance
let imageOptimizerInstance: ImageOptimizer | null = null;

export function getImageOptimizer(): ImageOptimizer {
  if (!imageOptimizerInstance) {
    imageOptimizerInstance = new ImageOptimizer();
  }
  return imageOptimizerInstance;
}