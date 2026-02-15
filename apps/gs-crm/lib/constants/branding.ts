/**
 * Sullivan Realty CRM Branding Constants
 *
 * Central source of truth for all branding elements
 * Color scheme: Black, White, Red accents
 * Design: Clean, modern, professional
 */

export const BRAND = {
  // Company Information
  name: 'Sullivan Realty CRM',
  fullName: 'Sullivan Realty CRM',
  tagline: 'Professional Client & Property Management',
  owner: 'Garrett Sullivan',
  location: 'Maricopa County, Arizona',

  // Color Palette - Black/White/Red Theme
  colors: {
    // Primary Colors
    primary: '#000000',       // Black
    secondary: '#FFFFFF',     // White
    accent: '#DC2626',        // Red (Tailwind red-600)

    // Background Colors
    background: {
      light: '#FFFFFF',       // Pure white
      gray: '#F9FAFB',        // Very light gray
      dark: '#111827',        // Very dark gray
    },

    // Text Colors
    text: {
      primary: '#111827',     // Almost black
      secondary: '#6B7280',   // Medium gray
      light: '#9CA3AF',       // Light gray
      inverse: '#FFFFFF',     // White (for dark backgrounds)
    },

    // Border Colors
    border: {
      light: '#E5E7EB',       // Light gray border
      medium: '#D1D5DB',      // Medium gray border
      dark: '#9CA3AF',        // Darker gray border
    },

    // Status Colors
    status: {
      success: '#10B981',     // Green
      warning: '#F59E0B',     // Amber
      error: '#EF4444',       // Red
      info: '#3B82F6',        // Blue
    },
  },

  // Typography
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    headings: 'Inter, system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },

  // Logo & Assets
  logo: '/logo1.png',
  logoAlt: 'Sullivan Realty CRM Logo',

  // Contact Information
  contact: {
    email: 'gbsullivan@mac.com',
    adminEmail: 'gbsullivan@mac.com',
  },

  // Application Routes
  routes: {
    // Admin Routes
    admin: {
      dashboard: '/admin',
      clients: '/admin/clients',
      upload: '/admin/upload',
      mcao: '/admin/mcao',
      settings: '/admin/settings',
    },

    // Client Routes
    client: {
      dashboard: '/client',
      properties: '/client/properties',
      files: '/client/files',
      profile: '/client/profile',
    },

    // Public Routes
    public: {
      home: '/',
      signin: '/signin',
    },
  },

  // Feature Flags
  features: {
    mcaoIntegration: true,
    emailInvites: true,
    excelProcessing: true,
    clientPortal: true,
  },
} as const;

// Export individual items for convenience
export const COLORS = BRAND.colors;
export const ROUTES = BRAND.routes;
export const FONTS = BRAND.fonts;
export const FEATURES = BRAND.features;

// Type exports for TypeScript
export type BrandColors = typeof BRAND.colors;
export type BrandRoutes = typeof BRAND.routes;
