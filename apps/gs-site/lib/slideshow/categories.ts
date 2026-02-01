/**
 * Photo Slideshow Category Definitions
 *
 * Each category has a display name, emoji, and color for UI rendering.
 */

import type { PhotoCategory } from './types';

export interface CategoryConfig {
  id: PhotoCategory;
  label: string;
  emoji: string;
  color: string; // Tailwind color class suffix (e.g., 'orange' for bg-orange-500)
  description: string;
}

export const CATEGORY_CONFIGS: Record<PhotoCategory, CategoryConfig> = {
  'grub-villain': {
    id: 'grub-villain',
    label: 'Grub Villain',
    emoji: '🍔',
    color: 'orange',
    description: 'Food adventures and culinary conquests',
  },
  family: {
    id: 'family',
    label: 'Family',
    emoji: '👨‍👩‍👧‍👦',
    color: 'blue',
    description: 'Family moments and gatherings',
  },
  friends: {
    id: 'friends',
    label: 'Friends',
    emoji: '🤝',
    color: 'green',
    description: 'Friend hangouts and memories',
  },
  habitat: {
    id: 'habitat',
    label: 'Habitat',
    emoji: '🏠',
    color: 'amber',
    description: 'Home and living space photos',
  },
  dogs: {
    id: 'dogs',
    label: 'Dogs',
    emoji: '🐕',
    color: 'yellow',
    description: 'Pup pics and dog adventures',
  },
  quotes: {
    id: 'quotes',
    label: 'Quotes',
    emoji: '💬',
    color: 'purple',
    description: 'Inspirational quotes and text',
  },
  inspo: {
    id: 'inspo',
    label: 'Inspo',
    emoji: '✨',
    color: 'pink',
    description: 'Inspiration and mood board',
  },
  'linkedin-ppl': {
    id: 'linkedin-ppl',
    label: 'LinkedIn',
    emoji: '💼',
    color: 'sky',
    description: 'Professional network and connections',
  },
};

/**
 * Get category config by ID
 */
export function getCategoryConfig(category: PhotoCategory): CategoryConfig {
  return CATEGORY_CONFIGS[category];
}

/**
 * Get all category configs as array
 */
export function getAllCategories(): CategoryConfig[] {
  return Object.values(CATEGORY_CONFIGS);
}

/**
 * Get Tailwind background class for a category
 */
export function getCategoryBgClass(category: PhotoCategory, variant: 'solid' | 'light' = 'solid'): string {
  const color = CATEGORY_CONFIGS[category].color;
  return variant === 'solid' ? `bg-${color}-500` : `bg-${color}-500/10`;
}

/**
 * Get Tailwind text class for a category
 */
export function getCategoryTextClass(category: PhotoCategory): string {
  const color = CATEGORY_CONFIGS[category].color;
  return `text-${color}-500`;
}
