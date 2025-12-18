// Shared database types that can be used across all apps
export interface User {
  id: string;
  email: string;
  created_at: Date;
  app_source?: string;
  last_app_accessed?: string;
}

export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

// Add more shared types as needed