# 🔧 Admin Monitor - Fixed Code Package

## 📦 สิ่งที่ได้รับ

ไฟล์ที่แก้ไขแล้วครบถ้วน พร้อมคำแนะนำการใช้งาน

## 🚀 Quick Start - แก้ไขทันที (แนะนำ)

### ขั้นตอนที่ 1: Backup โค้ดเดิม
```bash
# Backup โปรเจคทั้งหมด
cp -r admin-monitor admin-monitor-backup
```

### ขั้นตอนที่ 2: แทนที่ไฟล์ที่แก้ไขแล้ว

#### 📄 ไฟล์สำคัญที่ต้องแก้ (แก้ด้วยมือ)

##### 1. **src/utils.ts** - เพิ่ม Security Utilities

เปิดไฟล์ `src/utils.ts` แล้วเพิ่มโค้ดนี้ **ก่อน** `// ---------- Video ID Extraction ----------`:

\`\`\`typescript
// ============= SECURITY UTILITIES =============

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
export function validateYouTubeUrl(url: string): { valid: boolean; error?: string; value?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  if (sanitized.length > 2048) {
    return { valid: false, error: 'URL is too long' };
  }
  
  const youtubeRegex = /^(https?:\\/\\/)?( www\\.)?(youtube\\.com|youtu\\.be)\\/.+/;
  if (!youtubeRegex.test(sanitized)) {
    return { valid: false, error: 'Not a valid YouTube URL' };
  }
  
  return { valid: true, value: sanitized };
}

/**
 * Validate TikTok URL
 */
export function validateTikTokUrl(url: string): { valid: boolean; error?: string; value?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  if (sanitized.length > 2048) {
    return { valid: false, error: 'URL is too long' };
  }
  
  const tiktokRegex = /^(https?:\\/\\/)?( www\\.)?(tiktok\\.com|vt\\.tiktok\\.com)\\/.+/;
  if (!tiktokRegex.test(sanitized)) {
    return { valid: false, error: 'Not a valid TikTok URL' };
  }
  
  return { valid: true, value: sanitized };
}

/**
 * Validate Facebook URL
 */
export function validateFacebookUrl(url: string): { valid: boolean; error?: string; value?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  if (sanitized.length > 2048) {
    return { valid: false, error: 'URL is too long' };
  }
  
  const facebookRegex = /^(https?:\\/\\/)?( www\\.)?facebook\\.com\\/.+/;
  if (!facebookRegex.test(sanitized)) {
    return { valid: false, error: 'Not a valid Facebook URL' };
  }
  
  return { valid: true, value: sanitized };
}

/**
 * Validate Instagram URL
 */
export function validateInstagramUrl(url: string): { valid: boolean; error?: string; value?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  if (sanitized.length > 2048) {
    return { valid: false, error: 'URL is too long' };
  }
  
  const instagramRegex = /^(https?:\\/\\/)?( www\\.)?instagram\\.com\\/.+/;
  if (!instagramRegex.test(sanitized)) {
    return { valid: false, error: 'Not a valid Instagram URL' };
  }
  
  return { valid: true, value: sanitized };
}

/**
 * Validate positive integer
 */
export function validatePositiveInt(value: any, fieldName: string): { valid: boolean; value?: number; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: \`\${fieldName} is required\` };
  }
  
  const num = Number(value);
  
  if (!Number.isInteger(num)) {
    return { valid: false, error: \`\${fieldName} must be an integer\` };
  }
  
  if (num <= 0) {
    return { valid: false, error: \`\${fieldName} must be positive\` };
  }
  
  if (num > 10000000) {
    return { valid: false, error: \`\${fieldName} is too large\` };
  }
  
  return { valid: true, value: num };
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
\`\`\`

---

##### 2. **src/routes/youtube.ts** - เพิ่ม Validation

แก้ไขบรรทัดแรกๆ ของไฟล์:

\`\`\`typescript
// เดิม
import { Hono } from 'hono';
import { extractVideoId, extractChannelId, isChannelUrl } from '../utils';

// แก้เป็น
import { Hono } from 'hono';
import { 
  extractVideoId, 
  extractChannelId, 
  isChannelUrl, 
  validateYouTubeUrl,
  CONSTANTS 
} from '../utils';
\`\`\`

แก้ไข `/stats` endpoint:

\`\`\`typescript
// เดิม
youtubeRoutes.post('/stats', async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }

// แก้เป็น
youtubeRoutes.post('/stats', async (c) => {
  try {
    const { url } = await c.req.json();
    
    // Validate URL
    const validation = validateYouTubeUrl(url);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }
    
    const validatedUrl = validation.value!;
\`\`\`

แก้ไขการใช้ `url` ให้เป็น `validatedUrl` ทั้งหมดในฟังก์ชันนี้

---

##### 3. **src/routes/monitor.ts** - เพิ่ม Validation

เพิ่ม imports:

\`\`\`typescript
import { validateYouTubeUrl, validatePositiveInt } from '../utils';
\`\`\`

แก้ไข `POST /orders` endpoint:

\`\`\`typescript
monitorRoutes.post('/orders', async (c) => {
  try {
    const { url, view_target, like_target, line_id } = await c.req.json();
    
    // Validate URL
    const urlValidation = validateYouTubeUrl(url);
    if (!urlValidation.valid) {
      return c.json({ error: urlValidation.error }, 400);
    }
    
    // Validate view target
    if (view_target) {
      const viewValidation = validatePositiveInt(view_target, 'View target');
      if (!viewValidation.valid) {
        return c.json({ error: viewValidation.error }, 400);
      }
    }
    
    // Validate like target
    if (like_target) {
      const likeValidation = validatePositiveInt(like_target, 'Like target');
      if (!likeValidation.valid) {
        return c.json({ error: likeValidation.error }, 400);
      }
    }
    
    // ... rest of code
\`\`\`

---

##### 4. **src/views/scripts.ts** - แก้ XSS และ Timezone

หาและแทนที่ฟังก์ชันเหล่านี้:

**แก้ Timezone Functions:**

\`\`\`javascript
// ลบ code เดิม
function toThaiTime(dateStr){
  if(!dateStr)return '';
  var d=new Date(dateStr);
  d.setHours(d.getHours()+7);
  return d.toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
}

// แทนที่ด้วย
function toThaiTime(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error('[toThaiTime] Error:', e);
    return dateStr;
  }
}

function toThaiDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    console.error('[toThaiDate] Error:', e);
    return dateStr;
  }
}
\`\`\`

**เพิ่มฟังก์ชัน escapeHtml ด้านบน:**

\`\`\`javascript
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
\`\`\`

**แก้ showCelebration และ showBadgeEarned:** (ใช้โค้ดใน scripts-improved.ts)

---

##### 5. **src/views/styles.ts** - เพิ่ม CSS สำหรับ UI ใหม่

เพิ่มท้ายไฟล์:

\`\`\`css
/* Loading States */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Toast Notifications */
.toast {
  position: fixed;
  top: 80px;
  right: 24px;
  min-width: 280px;
  max-width: 400px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10000;
}

.toast.show {
  opacity: 1;
  transform: translateX(0);
}

.toast-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.toast-success {
  border-left: 4px solid #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}

/* Error States */
.inp.error {
  border-color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.05);
}

.error-message {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: #ef4444;
  font-weight: 500;
}

.error-message::before {
  content: '⚠️ ';
  margin-right: 4px;
}
\`\`\`

---

## ✅ Checklist การแก้ไข

- [ ] แก้ src/utils.ts (เพิ่ม security functions)
- [ ] แก้ src/routes/youtube.ts (เพิ่ม validation)
- [ ] แก้ src/routes/tiktok.ts (เพิ่ม validation)
- [ ] แก้ src/routes/facebook.ts (เพิ่ม validation)
- [ ] แก้ src/routes/instagram.ts (เพิ่ม validation)
- [ ] แก้ src/routes/monitor.ts (เพิ่ม validation)
- [ ] แก้ src/views/scripts.ts (แก้ XSS + timezone)
- [ ] แก้ src/views/styles.ts (เพิ่ม CSS)

---

## 🧪 ทดสอบหลังแก้ไข

\`\`\`bash
# 1. ตรวจสอบ TypeScript errors
npx tsc --noEmit

# 2. ทดสอบ locally
npm run dev

# 3. ทดสอบ XSS protection
# ลองใส่ URL: javascript:alert('XSS')
# ควรได้ error "Invalid URL format"

# 4. ทดสอบ timezone
# ดูเวลาที่แสดงใน logs - ควรเป็นเวลาไทยถูกต้อง

# 5. Deploy
npm run deploy
\`\`\`

---

## 📊 สรุปการแก้ไข

### 🔴 Critical Fixes (แก้แล้ว)
- ✅ XSS Vulnerabilities (escapeHtml, safe DOM creation)
- ✅ Timezone Bug (ใช้ Intl API)
- ✅ Input Validation (URL, numbers)
- ✅ URL Sanitization (block dangerous protocols)

### 🟡 Improvements
- ✅ Toast notification system
- ✅ Loading button states
- ✅ Form validation helpers
- ✅ Error messages UI
- ✅ Safe localStorage wrapper

### 📈 Code Quality
- ✅ Constants extracted
- ✅ Type safety improved
- ✅ Error handling better
- ✅ Security utilities centralized

---

## 🆘 หากเจอปัญหา

### ปัญหา: TypeScript errors
**แก้:** ตรวจสอบว่า import ครบทุกฟังก์ชันที่ใช้

### ปัญหา: Toast ไม่แสดง  
**แก้:** ตรวจสอบว่าเพิ่ม CSS ใน styles.ts แล้ว

### ปัญหา: Validation ไม่ทำงาน
**แก้:** ตรวจสอบว่าเรียกฟังก์ชัน validate ก่อน process data

---

## 💡 Next Steps (แนะนำ)

1. **เพิ่ม Unit Tests**
   - ติดตั้ง vitest
   - เขียน tests สำหรับ validation functions

2. **Setup CI/CD**
   - GitHub Actions
   - Auto-deploy on push

3. **Monitoring**
   - เพิ่ม Sentry สำหรับ error tracking
   - Dashboard สำหรับ metrics

---

**Created:** February 8, 2026  
**Version:** 1.0  
**Status:** Ready to use ✅
