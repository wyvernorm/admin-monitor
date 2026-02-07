// ============= SHARED UTILITIES =============
// Centralized helpers used across routes and index

import type { SessionUser } from './types';

// ---------- Video ID Extraction ----------
export function extractVideoId(url: string): string | null {
  if (url.includes('watch?v=')) return url.split('watch?v=')[1].split('&')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
  if (url.includes('/shorts/')) return url.split('/shorts/')[1].split('?')[0];
  return null;
}

export function extractChannelId(url: string): string | null {
  if (url.includes('/channel/')) {
    const match = url.match(/\/channel\/([^\/\?]+)/);
    return match ? match[1] : null;
  }
  return null;
}

export function isChannelUrl(url: string): boolean {
  return url.includes('/channel/') || url.includes('/@') || url.includes('/c/');
}

// ---------- HMAC Session Token ----------
// แทน Base64 เปล่าๆ ด้วย HMAC-SHA256 signed token

async function getSigningKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

// Unicode-safe Base64
export function base64Encode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  const binaryString = String.fromCharCode(...utf8Bytes);
  return btoa(binaryString);
}

export function base64Decode(base64: string): string {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * สร้าง signed session token
 * Format: base64(payload).hmac_hex
 */
export async function createSessionToken(payload: object, secret: string): Promise<string> {
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64Encode(payloadStr);
  
  const key = await getSigningKey(secret);
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  const sigHex = bufferToHex(signature);
  
  return `${payloadB64}.${sigHex}`;
}

/**
 * Verify และ decode session token
 * คืน parsed payload หรือ null ถ้า invalid/expired
 */
export async function verifySessionToken(token: string, secret: string): Promise<SessionUser | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [payloadB64, sigHex] = parts;
    
    const key = await getSigningKey(secret);
    const enc = new TextEncoder();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBuffer(sigHex),
      enc.encode(payloadB64)
    );
    
    if (!valid) return null;
    
    const payload = JSON.parse(base64Decode(payloadB64));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now()) return null;
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Backward-compatible: ลอง verify HMAC ก่อน ถ้าไม่ได้ลอง decode แบบเก่า (unsigned base64)
 * ใช้ช่วง transition ให้ session เก่ายังใช้ได้
 */
export async function verifySessionTokenCompat(token: string, secret: string): Promise<SessionUser | null> {
  // Try new signed format first
  const signed = await verifySessionToken(token, secret);
  if (signed) return signed;
  
  // Fallback: try legacy unsigned base64 (transition period)
  try {
    let decoded = token;
    try { decoded = decodeURIComponent(token); } catch {}
    
    const payload = JSON.parse(base64Decode(decoded));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- Telegram Helpers ----------
export async function sendTelegramNotification(
  token: string, groupId: string, text: string, youtubeUrl: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: groupId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '▶️ เปิดดูคลิปบน YouTube', url: youtubeUrl }
        ]]
      }
    }),
  });
}

export async function sendReportBot(
  token: string, chatId: string, text: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

// ---------- CSRF Token ----------
/**
 * สร้าง CSRF token (random hex 32 bytes)
 */
export async function generateCsrfToken(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------- Activity Logging (with dedup) ----------
export async function logAction(
  db: D1Database, email: string, action: string, category: string, 
  details?: string, adminName?: string, adminPicture?: string
): Promise<any> {
  // Check for duplicate within 5 seconds
  const recent = await db.prepare(`
    SELECT id FROM activity_logs 
    WHERE admin_email = ? AND action = ? AND category = ?
    AND created_at > datetime('now', '-5 seconds')
    LIMIT 1
  `).bind(email, action, category).first();
  
  if (recent) {
    console.log('[LOG] Skipped duplicate:', { email, action, category });
    return null;
  }
  
  const name = adminName || email.split('@')[0] || '';
  const picture = adminPicture || '';
  console.log('[LOG] Inserting:', { email, name, action, category, details });
  const result = await db.prepare(`
    INSERT INTO activity_logs (admin_email, admin_name, admin_picture, action, category, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(email, name, picture, action, category, details || '').run();
  console.log('[LOG] Insert result:', result);
  return result;
}
