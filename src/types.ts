// ============= SHARED TYPES =============
// Central type definitions used across all routes

// ---------- Environment Bindings ----------
export type Bindings = {
  DB: D1Database;
  YOUTUBE_API_KEY: string;
  APIFY_TOKEN: string;
  APIFY2_TOKEN: string;
  APIFY3_TOKEN: string;
  ENSEMBLE_TOKEN: string;
  ENSEMBLE_IG_TOKEN: string;
  RAPIDAPI_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_GROUP_ID: string;
  REPORT_BOT_TOKEN: string;
  REPORT_CHAT_ID: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  ADMIN_MONITOR_CACHE: KVNamespace;
};

// ---------- Hono App Variables ----------
export type Variables = {
  user: SessionUser | null;
  userEmail: string;
};

// ---------- Auth / Session ----------
export interface SessionUser {
  email: string;
  name: string;
  picture?: string;
  exp: number;
}

// ---------- DB Models ----------
export interface Order {
  id: number;
  url: string;
  view_target: number;
  view_current: number;
  like_target: number;
  like_current: number;
  status: 'running' | 'done' | 'paused';
  line_id: string;
  notified: 'yes' | 'no';
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ActivityLog {
  id: number;
  admin_email: string;
  admin_name: string;
  admin_picture: string;
  action: string;
  action_type: string;
  category: 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'monitor' | 'system' | 'other';
  details: string;
  created_at: string;
}

export interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  invited_by: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: number;
  name: string;
  platform: string;
  items: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface OrderSnapshot {
  id: number;
  order_id: number;
  view_current: number;
  like_current: number;
  checked_at: string;
}

// ---------- API Response Types ----------
export interface ApiError {
  platform: string;
  code: number;
  message: string;
}

export interface CronResult {
  success: boolean;
  checked?: number;
  completed?: number;
  apiErrors?: number;
  error?: string;
}

export interface YouTubeStats {
  title: string;
  views: number;
  likes: number;
}

// ---------- Stats Aggregation ----------
export interface UserStats {
  admin_email: string;
  admin_name?: string;
  total_actions: number;
  youtube_count: number;
  tiktok_count: number;
  facebook_count: number;
  instagram_count: number;
  last_action?: string;
  night_count?: number;
  early_count?: number;
  weekend_count?: number;
  max_streak?: number;
  max_daily?: number;
  max_hourly?: number;
  days_active?: number;
  best_rank?: number;
}
