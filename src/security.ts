// ============= SECURITY UTILITIES =============
// Add to src/utils.ts or create new src/security.ts

/**
 * Escape HTML to prevent XSS attacks
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => trimmed.startsWith(protocol))) {
    return null;
  }
  
  // Only allow http(s) and relative URLs
  if (!trimmed.startsWith('http://') && 
      !trimmed.startsWith('https://') && 
      !trimmed.startsWith('/')) {
    return null;
  }
  
  return url.trim();
}

/**
 * Validate YouTube URL
 */
export function validateYouTubeUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  if (!youtubeRegex.test(sanitized)) {
    return { valid: false, error: 'Not a valid YouTube URL' };
  }
  
  return { valid: true };
}

/**
 * Validate TikTok URL
 */
export function validateTikTokUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  const tiktokRegex = /^(https?:\/\/)?(www\.)?(tiktok\.com|vt\.tiktok\.com)\/.+/;
  if (!tiktokRegex.test(sanitized)) {
    return { valid: false, error: 'Not a valid TikTok URL' };
  }
  
  return { valid: true };
}

/**
 * Validate positive integer
 */
export function validatePositiveInt(value: any, fieldName: string): { valid: boolean; value?: number; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  const num = Number(value);
  
  if (!Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }
  
  if (num <= 0) {
    return { valid: false, error: `${fieldName} must be positive` };
  }
  
  if (num > 10000000) {
    return { valid: false, error: `${fieldName} is too large` };
  }
  
  return { valid: true, value: num };
}

/**
 * Rate limit key generator
 */
export function getRateLimitKey(userEmail: string, endpoint: string): string {
  // Use consistent format for rate limit keys
  const sanitizedEmail = userEmail.toLowerCase().trim();
  const sanitizedEndpoint = endpoint.replace(/[^a-z0-9_-]/gi, '_');
  return `rl:${sanitizedEmail}:${sanitizedEndpoint}`;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('[SAFE_JSON_PARSE] Failed to parse:', e);
    return fallback;
  }
}

/**
 * Atomic increment for rate limiting (using KV)
 * Note: This is a workaround. For true atomic operations, use Durable Objects
 */
export async function atomicIncrement(
  kv: KVNamespace,
  key: string,
  ttl: number = 60
): Promise<number> {
  const lockKey = `${key}:lock`;
  const maxRetries = 3;
  
  for (let i = 0; i < maxRetries; i++) {
    // Try to acquire lock
    const lockAcquired = await kv.get(lockKey);
    if (lockAcquired) {
      // Wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 10 * (i + 1)));
      continue;
    }
    
    // Set lock (TTL 1 second)
    await kv.put(lockKey, '1', { expirationTtl: 1 });
    
    try {
      const current = await kv.get(key);
      const count = current ? parseInt(current) : 0;
      const newCount = count + 1;
      await kv.put(key, String(newCount), { expirationTtl: ttl });
      return newCount;
    } finally {
      // Release lock
      await kv.delete(lockKey);
    }
  }
  
  // Fallback if all retries failed
  throw new Error('Failed to acquire lock for atomic increment');
}

/**
 * Constants
 */
export const CONSTANTS = {
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 10,
    WINDOW_TTL: 60,
  },
  CACHE: {
    VIDEO_STATS_TTL: 300, // 5 minutes
    CHANNEL_STATS_TTL: 600, // 10 minutes
    TEMPLATE_TTL: 3600, // 1 hour
  },
  VALIDATION: {
    MAX_TARGET_VALUE: 10000000,
    MIN_TARGET_VALUE: 1,
    MAX_URL_LENGTH: 2048,
  },
} as const;
