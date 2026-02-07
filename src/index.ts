import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// Routes
import { youtubeRoutes } from './routes/youtube';
import { tiktokRoutes } from './routes/tiktok';
import { facebookRoutes } from './routes/facebook';
import { instagramRoutes } from './routes/instagram';
import { monitorRoutes } from './routes/monitor';
import { templateRoutes } from './routes/templates';
import { authRoutes } from './routes/auth';

// Views
import { renderIndex } from './views/index';

// Shared utilities
import {
  verifySessionTokenCompat,
  extractVideoId,
  sendTelegramNotification,
  sendReportBot,
  logAction,
} from './utils';

// Shared types
import type { Bindings, Variables } from './types';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS - จำกัดเฉพาะ domain ที่ใช้จริง
app.use('*', cors({
  origin: [
    'https://admin-monitor.iplusview.workers.dev',
    'http://localhost:8787', // dev only
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Auth middleware - Check session for API access (httpOnly cookie)
app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  
  // Allow auth endpoints and public API without login
  if (path.startsWith('/api/auth/') || path.startsWith('/api/public/')) {
    return next();
  }
  
  // Read session from httpOnly cookie only (no more X-Session-Token header)
  const sessionToken = getCookie(c, 'session');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Verify HMAC signature (backward-compatible with old unsigned tokens)
  const session = await verifySessionTokenCompat(sessionToken, c.env.SESSION_SECRET);
  
  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }
  
  // Add user to context for logging
  c.set('user', session);
  c.set('userEmail', session.email);
  
  await next();
});

// CSRF middleware — ตรวจ POST/PUT/DELETE ต้องมี X-CSRF-Token header ตรงกับ cookie
app.use('/api/*', async (c, next) => {
  const method = c.req.method;
  const path = c.req.path;
  
  // Skip CSRF check for: GET/HEAD requests, auth endpoints, public API, cron (internal)
  if (method === 'GET' || method === 'HEAD' || path.startsWith('/api/auth/') || path.startsWith('/api/public/')) {
    return next();
  }
  
  const csrfCookie = getCookie(c, 'csrf_token');
  const csrfHeader = c.req.header('X-CSRF-Token');
  
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return c.json({ error: 'CSRF token mismatch' }, 403);
  }
  
  await next();
});

// Rate limiting middleware — จำกัด request ต่อ user ต่อนาที ป้องกัน API quota spam
app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  
  // เฉพาะ paths ที่เรียก external APIs (เปลือง quota)
  const rateLimitedPaths = [
    '/api/youtube/stats',
    '/api/youtube/channel',
    '/api/tiktok/stats',
    '/api/facebook/stats',
    '/api/instagram/stats',
  ];
  
  const needsRateLimit = rateLimitedPaths.some(p => path.startsWith(p));
  if (!needsRateLimit) return next();
  
  try {
    const kv = c.env.ADMIN_MONITOR_CACHE;
    const userEmail = c.get('userEmail') || 'anon';
    const key = `rl:${userEmail}:${path}`;
    
    const current = await kv.get(key);
    const count = current ? parseInt(current) : 0;
    
    // จำกัด 10 requests ต่อ endpoint ต่อนาที ต่อ user
    if (count >= 10) {
      return c.json({ error: 'กรุณารอสักครู่ — ใช้งานบ่อยเกินไป' }, 429);
    }
    
    await kv.put(key, String(count + 1), { expirationTtl: 60 });
  } catch (e) {
    console.error('[RATE-LIMIT] Error:', e);
  }
  
  await next();
});

// Mount routes
app.route('/api/youtube', youtubeRoutes);
app.route('/api/tiktok', tiktokRoutes);
app.route('/api/facebook', facebookRoutes);
app.route('/api/instagram', instagramRoutes);
app.route('/api/monitor', monitorRoutes);
app.route('/api/templates', templateRoutes);
app.route('/api/auth', authRoutes);

// Logs API - เฉพาะ Admin เท่านั้น
app.get('/api/logs', async (c) => {
  try {
    const db = c.env.DB;
    
    // Auto-backfill: อัปเดต admin_picture ของ user ที่ login อยู่ลง log เก่าที่ยังไม่มีรูป
    const currentUser = c.get('user') as any;
    if (currentUser?.email && currentUser?.picture) {
      try {
        await db.prepare(`
          UPDATE activity_logs SET admin_picture = ?
          WHERE admin_email = ? AND (admin_picture IS NULL OR admin_picture = '')
        `).bind(currentUser.picture, currentUser.email).run();
      } catch (e) { /* ignore backfill errors */ }
    }
    
    // ดึง logs ล่าสุด 500 รายการ
    const logsResult = await db.prepare(`
      SELECT * FROM activity_logs 
      ORDER BY created_at DESC
      LIMIT 500
    `).all();
    
    // ดึงสถิติรวมต่อ email (basic counts)
    const statsResult = await db.prepare(`
      SELECT 
        admin_email,
        MAX(admin_name) as admin_name,
        COUNT(*) as total_actions,
        MAX(created_at) as last_action,
        SUM(CASE WHEN category = 'youtube' THEN 1 ELSE 0 END) as youtube_count,
        SUM(CASE WHEN category = 'tiktok' THEN 1 ELSE 0 END) as tiktok_count,
        SUM(CASE WHEN category = 'facebook' THEN 1 ELSE 0 END) as facebook_count,
        SUM(CASE WHEN category = 'instagram' THEN 1 ELSE 0 END) as instagram_count,
        COUNT(DISTINCT DATE(created_at)) as days_active,
        SUM(CASE WHEN CAST(strftime('%H', created_at) AS INTEGER) >= 0 
                  AND CAST(strftime('%H', created_at) AS INTEGER) < 5 THEN 1 ELSE 0 END) as night_count,
        SUM(CASE WHEN CAST(strftime('%H', created_at) AS INTEGER) >= 5 
                  AND CAST(strftime('%H', created_at) AS INTEGER) < 7 THEN 1 ELSE 0 END) as early_count,
        SUM(CASE WHEN CAST(strftime('%w', created_at) AS INTEGER) IN (0, 6) THEN 1 ELSE 0 END) as weekend_count
      FROM activity_logs 
      GROUP BY admin_email
      ORDER BY total_actions DESC
    `).all();

    // คำนวณ advanced stats: max_daily, max_hourly, max_streak per user
    const advancedStats: Record<string, { max_daily: number; max_hourly: number; max_streak: number }> = {};
    
    // Max daily & max hourly per user
    const dailyMax = await db.prepare(`
      SELECT admin_email, MAX(cnt) as max_daily FROM (
        SELECT admin_email, DATE(created_at) as d, COUNT(*) as cnt
        FROM activity_logs GROUP BY admin_email, d
      ) GROUP BY admin_email
    `).all();
    
    const hourlyMax = await db.prepare(`
      SELECT admin_email, MAX(cnt) as max_hourly FROM (
        SELECT admin_email, DATE(created_at) as d, CAST(strftime('%H', created_at) AS INTEGER) as h, COUNT(*) as cnt
        FROM activity_logs GROUP BY admin_email, d, h
      ) GROUP BY admin_email
    `).all();
    
    for (const r of (dailyMax.results || []) as any[]) {
      if (!advancedStats[r.admin_email]) advancedStats[r.admin_email] = { max_daily: 0, max_hourly: 0, max_streak: 0 };
      advancedStats[r.admin_email].max_daily = r.max_daily || 0;
    }
    for (const r of (hourlyMax.results || []) as any[]) {
      if (!advancedStats[r.admin_email]) advancedStats[r.admin_email] = { max_daily: 0, max_hourly: 0, max_streak: 0 };
      advancedStats[r.admin_email].max_hourly = r.max_hourly || 0;
    }
    
    // Max streak per user (consecutive days)
    const allDays = await db.prepare(`
      SELECT admin_email, DATE(created_at) as d
      FROM activity_logs 
      GROUP BY admin_email, d
      ORDER BY admin_email, d
    `).all();
    
    let prevEmail = '', prevDate = '', streak = 0, maxStreak = 0;
    for (const r of (allDays.results || []) as any[]) {
      if (r.admin_email !== prevEmail) {
        if (prevEmail && advancedStats[prevEmail]) advancedStats[prevEmail].max_streak = Math.max(maxStreak, streak);
        streak = 1; maxStreak = 1; prevEmail = r.admin_email; prevDate = r.d;
        if (!advancedStats[r.admin_email]) advancedStats[r.admin_email] = { max_daily: 0, max_hourly: 0, max_streak: 0 };
        continue;
      }
      const prev = new Date(prevDate);
      const curr = new Date(r.d);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { streak++; } else { maxStreak = Math.max(maxStreak, streak); streak = 1; }
      prevDate = r.d;
    }
    if (prevEmail && advancedStats[prevEmail]) advancedStats[prevEmail].max_streak = Math.max(maxStreak, streak);
    
    // Merge advanced stats into main stats
    const mergedStats = ((statsResult.results || []) as any[]).map(s => ({
      ...s,
      max_daily: advancedStats[s.admin_email]?.max_daily || 0,
      max_hourly: advancedStats[s.admin_email]?.max_hourly || 0,
      max_streak: advancedStats[s.admin_email]?.max_streak || 0,
    }));
    
    // สร้าง pictureMap จาก logs ที่มี admin_picture (ล่าสุดต่อ email)
    const pictureMap: Record<string, string> = {};
    for (const log of (logsResult.results || []) as any[]) {
      if (log.admin_picture && log.admin_email && !pictureMap[log.admin_email]) {
        pictureMap[log.admin_email] = log.admin_picture;
      }
    }
    
    return c.json({ 
      logs: logsResult.results || [],
      stats: mergedStats,
      pictureMap,
    });
  } catch (error: any) {
    return c.json({ error: error.message, logs: [], stats: [], pictureMap: {} }, 500);
  }
});

// API สำหรับดึง logs ของ user เฉพาะคน
app.get('/api/logs/user/:email', async (c) => {
  try {
    const db = c.env.DB;
    const email = decodeURIComponent(c.req.param('email'));
    
    // ดึง logs ทั้งหมดของ user นี้
    const logsResult = await db.prepare(`
      SELECT * FROM activity_logs 
      WHERE admin_email = ?
      ORDER BY created_at DESC
      LIMIT 1000
    `).bind(email).all();
    
    // สถิติรวมของ user
    const statsResult = await db.prepare(`
      SELECT 
        COUNT(*) as total_actions,
        MIN(created_at) as first_action,
        MAX(created_at) as last_action,
        SUM(CASE WHEN category = 'youtube' THEN 1 ELSE 0 END) as youtube_count,
        SUM(CASE WHEN category = 'tiktok' THEN 1 ELSE 0 END) as tiktok_count,
        SUM(CASE WHEN category = 'facebook' THEN 1 ELSE 0 END) as facebook_count,
        SUM(CASE WHEN category = 'instagram' THEN 1 ELSE 0 END) as instagram_count,
        SUM(CASE WHEN category = 'monitor' THEN 1 ELSE 0 END) as monitor_count
      FROM activity_logs 
      WHERE admin_email = ?
    `).bind(email).all();
    
    // สถิติรายวัน
    const dailyResult = await db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(CASE WHEN category = 'youtube' THEN 1 ELSE 0 END) as youtube,
        SUM(CASE WHEN category = 'tiktok' THEN 1 ELSE 0 END) as tiktok,
        SUM(CASE WHEN category = 'facebook' THEN 1 ELSE 0 END) as facebook,
        SUM(CASE WHEN category = 'instagram' THEN 1 ELSE 0 END) as instagram
      FROM activity_logs 
      WHERE admin_email = ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).bind(email).all();
    
    // สถิติรายชั่วโมง
    const hourlyResult = await db.prepare(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as count
      FROM activity_logs 
      WHERE admin_email = ?
      GROUP BY hour
      ORDER BY hour
    `).bind(email).all();
    
    // สถิติแยกตาม action (กดอะไรไปกี่ครั้ง)
    const actionResult = await db.prepare(`
      SELECT 
        action,
        category,
        COUNT(*) as count,
        MAX(created_at) as last_used
      FROM activity_logs 
      WHERE admin_email = ?
      GROUP BY action, category
      ORDER BY count DESC
      LIMIT 30
    `).bind(email).all();
    
    return c.json({ 
      email,
      logs: logsResult.results || [],
      stats: (statsResult.results || [])[0] || {},
      daily: dailyResult.results || [],
      hourly: hourlyResult.results || [],
      actions: actionResult.results || []
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// logAction is now imported from utils.ts

// API สำหรับ log actions จาก frontend
app.post('/api/log-action', async (c) => {
  try {
    const { action, category, details, email } = await c.req.json();
    const db = c.env.DB;
    
    // ดึงข้อมูลจาก session middleware (c.set('user'))
    const sessionUser = c.get('user') as any;
    const userEmail = sessionUser?.email || email || 'unknown';
    const userName = sessionUser?.name || '';
    const userPicture = sessionUser?.picture || '';
    
    console.log('[LOG-ACTION] Attempting to log:', { userEmail, userName, action, category });
    const result = await logAction(db, userEmail, action, category, details, userName, userPicture);
    console.log('[LOG-ACTION] Success:', result);
    
    return c.json({ success: true, email: userEmail, dbResult: result });
  } catch (error: any) {
    console.error('[LOG-ACTION] Error:', error);
    return c.json({ error: error.message, success: false }, 500);
  }
});

// ==================== TEAM MANAGEMENT API ====================
app.get('/api/team', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user') as any;
    const currentEmail = user?.email || '';
    
    // ตรวจสอบว่าเป็น admin ไหม
    const currentUser = await db.prepare('SELECT * FROM team_members WHERE email = ?').bind(currentEmail).first();
    const isAdmin = currentUser?.role === 'admin';
    
    // ดึงรายชื่อทีม
    const members = await db.prepare(`
      SELECT tm.*, 
        (SELECT COUNT(*) FROM activity_logs WHERE admin_email = tm.email) as total_actions,
        (SELECT MAX(created_at) FROM activity_logs WHERE admin_email = tm.email) as last_action
      FROM team_members tm
      ORDER BY tm.role DESC, tm.created_at
    `).all();
    
    return c.json({ 
      members: members.results || [],
      currentUser: currentUser || { email: currentEmail, role: 'member' },
      isAdmin
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/team/invite', async (c) => {
  try {
    const db = c.env.DB;
    const { email, role } = await c.req.json();
    const user = c.get('user') as any;
    const inviterEmail = user?.email || '';
    
    // ตรวจสอบว่าเป็น admin
    const inviter = await db.prepare('SELECT role FROM team_members WHERE email = ?').bind(inviterEmail).first();
    if (inviter?.role !== 'admin') {
      return c.json({ error: 'Only admin can invite members' }, 403);
    }
    
    await db.prepare(`
      INSERT OR REPLACE INTO team_members (email, role, invited_by)
      VALUES (?, ?, ?)
    `).bind(email, role || 'member', inviterEmail).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/team/update-role', async (c) => {
  try {
    const db = c.env.DB;
    const { email, role } = await c.req.json();
    const user = c.get('user') as any;
    const currentEmail = user?.email || '';
    
    const current = await db.prepare('SELECT role FROM team_members WHERE email = ?').bind(currentEmail).first();
    if (current?.role !== 'admin') {
      return c.json({ error: 'Only admin can change roles' }, 403);
    }
    
    await db.prepare('UPDATE team_members SET role = ? WHERE email = ?').bind(role, email).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/api/team/:email', async (c) => {
  try {
    const db = c.env.DB;
    const email = decodeURIComponent(c.req.param('email'));
    const user = c.get('user') as any;
    const currentEmail = user?.email || '';
    
    const current = await db.prepare('SELECT role FROM team_members WHERE email = ?').bind(currentEmail).first();
    if (current?.role !== 'admin') {
      return c.json({ error: 'Only admin can remove members' }, 403);
    }
    
    if (email === currentEmail) {
      return c.json({ error: 'Cannot remove yourself' }, 400);
    }
    
    await db.prepare('DELETE FROM team_members WHERE email = ?').bind(email).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ==================== ANALYTICS API ====================
app.get('/api/analytics', async (c) => {
  try {
    const db = c.env.DB;
    
    // สถิติรายวัน 30 วันล่าสุด
    const dailyStats = await db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN category = 'youtube' THEN 1 ELSE 0 END) as youtube,
        SUM(CASE WHEN category = 'tiktok' THEN 1 ELSE 0 END) as tiktok,
        SUM(CASE WHEN category = 'facebook' THEN 1 ELSE 0 END) as facebook,
        SUM(CASE WHEN category = 'instagram' THEN 1 ELSE 0 END) as instagram
      FROM activity_logs
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();
    
    // สถิติรายสัปดาห์
    const weeklyStats = await db.prepare(`
      SELECT 
        strftime('%Y-W%W', created_at) as week,
        COUNT(*) as total,
        SUM(CASE WHEN category = 'youtube' THEN 1 ELSE 0 END) as youtube,
        SUM(CASE WHEN category = 'tiktok' THEN 1 ELSE 0 END) as tiktok,
        SUM(CASE WHEN category = 'facebook' THEN 1 ELSE 0 END) as facebook,
        SUM(CASE WHEN category = 'instagram' THEN 1 ELSE 0 END) as instagram
      FROM activity_logs
      WHERE created_at >= datetime('now', '-12 weeks')
      GROUP BY week
      ORDER BY week DESC
    `).all();
    
    // Top actions
    const topActions = await db.prepare(`
      SELECT action, category, COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY action, category
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    // สถิติรวม
    const totals = await db.prepare(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(DISTINCT admin_email) as total_users,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM activity_logs
    `).first();
    
    // สรุปสัปดาห์นี้ vs สัปดาห์ที่แล้ว
    const thisWeek = await db.prepare(`
      SELECT COUNT(*) as count FROM activity_logs 
      WHERE created_at >= datetime('now', '-7 days')
    `).first();
    
    const lastWeek = await db.prepare(`
      SELECT COUNT(*) as count FROM activity_logs 
      WHERE created_at >= datetime('now', '-14 days') 
      AND created_at < datetime('now', '-7 days')
    `).first();
    
    return c.json({
      daily: dailyStats.results || [],
      weekly: weeklyStats.results || [],
      topActions: topActions.results || [],
      totals: totals || {},
      comparison: {
        thisWeek: thisWeek?.count || 0,
        lastWeek: lastWeek?.count || 0,
        change: thisWeek && lastWeek ? 
          Math.round(((thisWeek.count - lastWeek.count) / (lastWeek.count || 1)) * 100) : 0
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= 1. ENSEMBLE QUOTA MONITOR =============
// ดูเครดิตคงเหลือ EnsembleData (ฟรี 0 units)
app.get('/api/ensemble-quota', async (c) => {
  try {
    const tokens = {
      tiktok: { token: c.env.ENSEMBLE_TOKEN, label: 'TikTok' },
      instagram: { token: c.env.ENSEMBLE_IG_TOKEN, label: 'Instagram' },
    };

    const results: any = {};

    for (const [key, { token, label }] of Object.entries(tokens)) {
      if (!token) {
        results[key] = { label, error: 'Token not set' };
        continue;
      }

      try {
        // ดึง usage วันนี้
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const usageRes = await fetch(
          `https://ensembledata.com/apis/customer/get-used-units?date=${today}&token=${token}`
        );
        const usageData = await usageRes.json() as any;

        // ดึง history 7 วัน
        const historyRes = await fetch(
          `https://ensembledata.com/apis/customer/get-history?days=7&token=${token}`
        );
        const historyData = await historyRes.json() as any;

        results[key] = {
          label,
          todayUsed: usageData?.data?.used_units ?? usageData?.data ?? 0,
          dailyLimit: 50, // Free tier
          remaining: 50 - (usageData?.data?.used_units ?? usageData?.data ?? 0),
          history: historyData?.data || [],
        };
      } catch (e: any) {
        results[key] = { label, error: e.message };
      }
    }

    return c.json(results);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= 2. API SOURCE LOG =============
// บันทึก & ดึงสถิติว่าใช้ ensemble vs apify กี่ครั้ง
app.post('/api/log-api-source', async (c) => {
  try {
    const { platform, endpoint, source, responseTime } = await c.req.json();
    const db = c.env.DB;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    // บันทึกลง KV (ใช้ KV เพราะไม่อยาก alter DB table)
    const today = new Date().toISOString().split('T')[0];
    const logKey = `api_source_log_${today}`;
    
    const existing = await cache?.get(logKey);
    const logs: any[] = existing ? JSON.parse(existing) : [];
    
    logs.push({
      platform,
      endpoint,
      source, // 'ensemble' | 'apify'
      responseTime,
      timestamp: new Date().toISOString(),
    });

    // เก็บ log วันนี้ไว้ 7 วัน
    await cache?.put(logKey, JSON.stringify(logs), { expirationTtl: 604800 });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/api/api-source-stats', async (c) => {
  try {
    const cache = c.env.ADMIN_MONITOR_CACHE;
    const days = Number(c.req.query('days') || '7');
    
    const stats: any = {
      daily: [],
      totals: { ensemble: 0, apify: 0, total: 0 },
      byPlatform: {},
    };

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const logKey = `api_source_log_${dateStr}`;
      
      const data = await cache?.get(logKey);
      const logs: any[] = data ? JSON.parse(data) : [];
      
      const dayStat = {
        date: dateStr,
        ensemble: 0,
        apify: 0,
        total: logs.length,
        avgResponseTime: { ensemble: 0, apify: 0 },
      };

      let ensembleTimes: number[] = [];
      let apifyTimes: number[] = [];

      for (const log of logs) {
        if (log.source === 'ensemble') {
          dayStat.ensemble++;
          stats.totals.ensemble++;
          if (log.responseTime) ensembleTimes.push(log.responseTime);
        } else {
          dayStat.apify++;
          stats.totals.apify++;
          if (log.responseTime) apifyTimes.push(log.responseTime);
        }

        // By platform
        if (!stats.byPlatform[log.platform]) {
          stats.byPlatform[log.platform] = { ensemble: 0, apify: 0 };
        }
        stats.byPlatform[log.platform][log.source]++;
      }

      dayStat.avgResponseTime.ensemble = ensembleTimes.length > 0 
        ? Math.round(ensembleTimes.reduce((a, b) => a + b, 0) / ensembleTimes.length) : 0;
      dayStat.avgResponseTime.apify = apifyTimes.length > 0
        ? Math.round(apifyTimes.reduce((a, b) => a + b, 0) / apifyTimes.length) : 0;

      stats.daily.push(dayStat);
      stats.totals.total += logs.length;
    }

    return c.json(stats);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= PUBLIC API — ใช้ API Key แทน login =============
// เว็บอื่นเรียก: GET /api/public/monitor-stats?key=YOUR_KEY&days=7
app.get('/api/public/monitor-stats', async (c) => {
  // Validate API Key
  const key = c.req.query('key') || c.req.header('X-API-Key') || '';
  if (!key || key !== c.env.PUBLIC_API_KEY) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  try {
    const db = c.env.DB;
    const days = Math.min(Math.max(Number(c.req.query('days') || '7'), 1), 90);
    
    // นับจำนวนครั้งที่แต่ละคนเพิ่มงาน Monitor (ช่วง N วัน)
    const result = await db.prepare(`
      SELECT 
        admin_email,
        MAX(admin_name) as admin_name,
        COUNT(*) as monitor_count,
        MAX(created_at) as last_action
      FROM activity_logs
      WHERE category = 'monitor' 
        AND action = 'เพิ่มงาน Monitor'
        AND created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY admin_email
      ORDER BY monitor_count DESC
    `).bind(days).all();

    // สรุปรวม
    const users = ((result.results || []) as any[]).map(r => ({
      email: r.admin_email,
      name: r.admin_name || (r.admin_email || '').split('@')[0],
      count: r.monitor_count,
      last_action: r.last_action,
    }));
    
    const total = users.reduce((sum, u) => sum + u.count, 0);

    return c.json({
      period_days: days,
      total_monitor_adds: total,
      users,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Main page
app.get('/', (c) => {
  return c.html(renderIndex());
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// ============= CRON FUNCTIONS (extracted to src/cron.ts) =============
import {
  checkAllOrdersScheduled,
  checkStaleOrders,
  sendDailyReport,
  cronHealthCheck,
  checkEnsembleCredits,
} from './cron';

// Export with scheduled handler
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    // Health check ก่อน — ตรวจว่า cron หายไปนานไหม
    ctx.waitUntil(cronHealthCheck(env));
    
    // เช็ค orders ตามปกติ
    ctx.waitUntil(checkAllOrdersScheduled(env));
    
    // เช็คงานค้างเกิน 48 ชม. ทุกรอบ (แจ้งเตือนทุก 6 ชม.)
    ctx.waitUntil(checkStaleOrders(env));
    
    // เช็คเครดิต EnsembleData (แจ้งเตือนทุก 6 ชม. ถ้าเหลือน้อย)
    ctx.waitUntil(checkEnsembleCredits(env));
    
    // สรุปประจำวัน (ส่งแค่วันละครั้ง ตอน 02:00 UTC = 09:00 เวลาไทย)
    const hour = new Date().getUTCHours();
    if (hour === 2) {
      ctx.waitUntil(sendDailyReport(env));
    }
  }
};
