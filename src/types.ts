// ============= SHARED TYPES =============
// Central type definitions used across all routes

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

export type SessionUser = {
  email: string;
  name: string;
  picture?: string;
  exp: number;
};
