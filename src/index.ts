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

type Bindings = {
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

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Unicode-safe Base64 decode (same as auth.ts)
function base64Decode(base64: string): string {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Auth middleware - Check session for API access
app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  
  // Allow auth endpoints without login
  if (path.startsWith('/api/auth/')) {
    return next();
  }
  
  // Try to get token from header first, then cookie
  let sessionToken = c.req.header('X-Session-Token') || getCookie(c, 'session');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const session = JSON.parse(base64Decode(sessionToken));
    
    // Check expiration
    if (session.exp < Date.now()) {
      return c.json({ error: 'Session expired' }, 401);
    }
    
    // Add user to context for logging
    c.set('user', session);
    c.set('userEmail', session.email);
    
  } catch (e) {
    return c.json({ error: 'Invalid session' }, 401);
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
    
    // ดึง logs ล่าสุด 500 รายการ
    const logsResult = await db.prepare(`
      SELECT * FROM activity_logs 
      ORDER BY created_at DESC
      LIMIT 500
    `).all();
    
    // ดึงสถิติรวมต่อ email
    const statsResult = await db.prepare(`
      SELECT 
        admin_email,
        COUNT(*) as total_actions,
        MAX(created_at) as last_action,
        SUM(CASE WHEN category = 'youtube' THEN 1 ELSE 0 END) as youtube_count,
        SUM(CASE WHEN category = 'tiktok' THEN 1 ELSE 0 END) as tiktok_count,
        SUM(CASE WHEN category = 'facebook' THEN 1 ELSE 0 END) as facebook_count,
        SUM(CASE WHEN category = 'instagram' THEN 1 ELSE 0 END) as instagram_count
      FROM activity_logs 
      GROUP BY admin_email
      ORDER BY total_actions DESC
    `).all();
    
    return c.json({ 
      logs: logsResult.results || [],
      stats: statsResult.results || []
    });
  } catch (error: any) {
    return c.json({ error: error.message, logs: [], stats: [] }, 500);
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
    
    return c.json({ 
      email,
      logs: logsResult.results || [],
      stats: (statsResult.results || [])[0] || {},
      daily: dailyResult.results || [],
      hourly: hourlyResult.results || []
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Log action helper with deduplication
async function logAction(db: D1Database, email: string, action: string, category: string, details?: string, adminName?: string) {
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
  console.log('[LOG] Inserting:', { email, name, action, category, details });
  const result = await db.prepare(`
    INSERT INTO activity_logs (admin_email, admin_name, action, category, details, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(email, name, action, category, details || '').run();
  console.log('[LOG] Insert result:', result);
  return result;
}

// API สำหรับ log actions จาก frontend
app.post('/api/log-action', async (c) => {
  try {
    const { action, category, details, email } = await c.req.json();
    const db = c.env.DB;
    
    // ดึงข้อมูลจาก session (มี email + name)
    let userEmail = email || 'unknown';
    let userName = '';
    
    const sessionToken = c.req.header('X-Session-Token') || getCookie(c, 'session');
    if (sessionToken) {
      try {
        const session = JSON.parse(base64Decode(sessionToken));
        if (userEmail === 'unknown') userEmail = session.email || 'unknown';
        userName = session.name || '';
      } catch (e) {}
    }
    
    console.log('[LOG-ACTION] Attempting to log:', { userEmail, userName, action, category });
    const result = await logAction(db, userEmail, action, category, details, userName);
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
    const sessionToken = getCookie(c, 'session');
    let currentEmail = '';
    if (sessionToken) {
      try { currentEmail = JSON.parse(base64Decode(sessionToken)).email; } catch(e) {}
    }
    
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
    const sessionToken = getCookie(c, 'session');
    let inviterEmail = '';
    if (sessionToken) {
      try { inviterEmail = JSON.parse(base64Decode(sessionToken)).email; } catch(e) {}
    }
    
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
    const sessionToken = getCookie(c, 'session');
    let currentEmail = '';
    if (sessionToken) {
      try { currentEmail = JSON.parse(base64Decode(sessionToken)).email; } catch(e) {}
    }
    
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
    const sessionToken = getCookie(c, 'session');
    let currentEmail = '';
    if (sessionToken) {
      try { currentEmail = JSON.parse(base64Decode(sessionToken)).email; } catch(e) {}
    }
    
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

// Main page
app.get('/', (c) => {
  return c.html(renderIndex());
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============= SCHEDULED HANDLER (CRON) =============
// ทำงานทุก 30 นาที - ตรวจสอบออเดอร์และแจ้งเตือน Telegram
async function checkAllOrdersScheduled(env: Bindings) {
  const db = env.DB;
  const API_KEY = env.YOUTUBE_API_KEY;
  const TG_TOKEN = env.TELEGRAM_BOT_TOKEN;
  const TG_GROUP = env.TELEGRAM_GROUP_ID;

  console.log('[CRON] Starting checkAllOrders...');

  try {
    // Get all running orders
    const result = await db.prepare(`
      SELECT * FROM orders WHERE status = 'running'
    `).all();

    const orders = result.results || [];
    console.log(`[CRON] Found ${orders.length} running orders`);

    let completedCount = 0;
    let apiErrors: { platform: string; code: number; message: string }[] = [];

    for (const order of orders) {
      try {
        // Get current YouTube stats
        const videoId = extractVideoId(order.url as string);
        if (!videoId) continue;

        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`;
        const res = await fetch(apiUrl);
        
        // ตรวจจับ API error
        if (!res.ok) {
          const errBody = await res.text();
          const isDuplicate = apiErrors.some(e => e.platform === 'YouTube' && e.code === res.status);
          if (!isDuplicate) {
            apiErrors.push({ 
              platform: 'YouTube', 
              code: res.status, 
              message: res.status === 403 ? 'Quota exceeded / Forbidden' : 
                       res.status === 429 ? 'Rate limit exceeded' : 
                       `HTTP ${res.status}` 
            });
          }
          console.error(`[CRON] YouTube API error ${res.status} for order ${order.id}`);
          continue;
        }
        
        const data = await res.json() as any;

        if (!data.items || data.items.length === 0) continue;

        const stats = data.items[0].statistics;
        const currentView = Number(stats.viewCount || 0);
        const currentLike = Number(stats.likeCount || 0);

        // Update current values
        await db.prepare(`
          UPDATE orders SET view_current = ?, like_current = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(currentView, currentLike, order.id).run();

        // Save snapshot for trend tracking
        try {
          await db.prepare(`
            INSERT INTO order_snapshots (order_id, view_current, like_current, checked_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(order.id, currentView, currentLike).run();
        } catch (e) {
          console.error(`[CRON] Snapshot error for order ${order.id}:`, e);
        }

        // Check if target reached
        const viewTarget = Number(order.view_target) || 0;
        const likeTarget = Number(order.like_target) || 0;
        const viewDone = viewTarget === 0 || currentView >= viewTarget;
        const likeDone = likeTarget === 0 || currentLike >= likeTarget;

        if (viewDone && likeDone && order.notified !== 'yes') {
          // Mark as done and notified
          await db.prepare(`
            UPDATE orders SET status = 'done', notified = 'yes', completed_at = datetime('now')
            WHERE id = ?
          `).bind(order.id).run();

          // Get video title for notification
          let videoTitle = '';
          try {
            const apiUrl2 = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
            const res2 = await fetch(apiUrl2);
            const data2 = await res2.json() as any;
            if (data2.items && data2.items.length > 0) {
              videoTitle = data2.items[0].snippet.title || '';
            }
          } catch (e) {}

          // Send Telegram notification - format like old version
          const lineId = order.line_id || '';
          const viewPct = viewTarget > 0 ? Math.min(100, Math.round((currentView / viewTarget) * 100)) : 0;
          const likePct = likeTarget > 0 ? Math.min(100, Math.round((currentLike / likeTarget) * 100)) : 0;
          
          let text = `🎉 <b>งานสำเร็จแล้ว!</b>\n`;
          if (videoTitle) text += `📺 ${videoTitle}\n\n`;
          if (viewTarget > 0) text += `👀 วิว: ${currentView.toLocaleString()} / ${viewTarget.toLocaleString()} (${viewPct}%)\n`;
          if (likeTarget > 0) text += `👍 ไลค์: ${currentLike.toLocaleString()} / ${likeTarget.toLocaleString()} (${likePct}%)\n`;
          if (lineId) text += `👤 LINE ID: ${lineId}`;

          await sendTelegramNotification(TG_TOKEN, TG_GROUP, text, order.url as string);
          completedCount++;
          console.log(`[CRON] Order ${order.id} completed and notified`);
        }
      } catch (e) {
        console.error(`[CRON] Error processing order ${order.id}:`, e);
      }
    }

    // Save last cron check time to KV
    try {
      await env.ADMIN_MONITOR_CACHE.put('last_cron_check', new Date().toISOString());
    } catch (e) {
      console.error('[CRON] Failed to save last check time:', e);
    }

    // Cleanup old snapshots (older than 30 days)
    try {
      const cleanup = await db.prepare(`
        DELETE FROM order_snapshots 
        WHERE checked_at < datetime('now', '-30 days')
      `).run();
      if (cleanup.meta.changes > 0) {
        console.log(`[CRON] Cleaned up ${cleanup.meta.changes} old snapshots`);
      }
    } catch (e) {
      console.error('[CRON] Snapshot cleanup error:', e);
    }

    // Save cron health status (สำหรับ health check)
    try {
      await env.ADMIN_MONITOR_CACHE.put('cron_health', JSON.stringify({
        lastRun: new Date().toISOString(),
        checked: orders.length,
        completed: completedCount,
        errors: apiErrors.length,
      }));
    } catch (e) {}

    // ===== API QUOTA ALERT =====
    if (apiErrors.length > 0) {
      try {
        const REPORT_TOKEN = env.REPORT_BOT_TOKEN;
        const REPORT_CHAT = env.REPORT_CHAT_ID;
        if (REPORT_TOKEN && REPORT_CHAT) {
          // เช็คว่าแจ้งเตือน quota ไปแล้วหรือยัง (ทุก 2 ชม.)
          const lastQuotaAlert = await env.ADMIN_MONITOR_CACHE.get('last_quota_alert');
          let shouldAlert = true;
          if (lastQuotaAlert) {
            const hoursDiff = (Date.now() - new Date(lastQuotaAlert).getTime()) / 3600000;
            if (hoursDiff < 2) shouldAlert = false;
          }

          if (shouldAlert) {
            let text = `🚨 <b>API Error Alert!</b>\n\n`;
            text += `Cron ตรวจพบปัญหา API ขณะเช็คงาน:\n\n`;
            
            for (const err of apiErrors) {
              const icon = err.code === 403 ? '🔴' : err.code === 429 ? '🟠' : '🟡';
              text += `${icon} <b>${err.platform}</b>\n`;
              text += `   Status: ${err.code} — ${err.message}\n\n`;
            }

            text += `📋 สรุป: เช็คได้ ${orders.length - apiErrors.length}/${orders.length} งาน\n`;
            text += `⏰ เวลา: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}\n\n`;
            
            // แนะนำวิธีแก้
            const hasQuota = apiErrors.some(e => e.code === 403);
            const hasRateLimit = apiErrors.some(e => e.code === 429);
            if (hasQuota) text += `💡 <i>YouTube API quota อาจหมด — รีเซ็ตเที่ยงคืน Pacific Time</i>\n`;
            if (hasRateLimit) text += `💡 <i>Rate limit — ลองลดจำนวน order หรือรอสักครู่</i>\n`;

            await sendReportBot(REPORT_TOKEN, REPORT_CHAT, text);
            await env.ADMIN_MONITOR_CACHE.put('last_quota_alert', new Date().toISOString());
            console.log(`[CRON] Quota alert sent for ${apiErrors.length} errors`);
          }
        }
      } catch (e) {
        console.error('[CRON] Quota alert error:', e);
      }
    }

    console.log(`[CRON] Finished. Completed: ${completedCount}, API Errors: ${apiErrors.length}`);
    return { success: true, checked: orders.length, completed: completedCount, apiErrors: apiErrors.length };
  } catch (error: any) {
    console.error('[CRON] Error:', error);
    return { success: false, error: error.message };
  }
}

function extractVideoId(url: string): string | null {
  if (url.includes('watch?v=')) return url.split('watch?v=')[1].split('&')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
  if (url.includes('/shorts/')) return url.split('/shorts/')[1].split('?')[0];
  return null;
}

async function sendTelegramNotification(token: string, groupId: string, text: string, youtubeUrl: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: groupId,
      text: text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '▶️ เปิดดูคลิปบน YouTube', url: youtubeUrl }
        ]]
      }
    }),
  });
}

// ============= REPORT BOT FUNCTIONS =============

// ส่งข้อความผ่านบอทรายงาน
async function sendReportBot(token: string, chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

// แจ้งเตือนงานค้างเกิน 48 ชม. (เช็คทุกรอบ cron)
async function checkStaleOrders(env: Bindings) {
  const db = env.DB;
  const REPORT_TOKEN = env.REPORT_BOT_TOKEN;
  const REPORT_CHAT = env.REPORT_CHAT_ID;

  if (!REPORT_TOKEN || !REPORT_CHAT) return;

  try {
    // หา orders ที่ค้างเกิน 48 ชม. และยังไม่เคยแจ้งเตือน stale
    const result = await db.prepare(`
      SELECT * FROM orders 
      WHERE status = 'running' 
      AND created_at < datetime('now', '-48 hours')
    `).all();

    const staleOrders = result.results || [];
    if (staleOrders.length === 0) return;

    // เช็คว่าแจ้งเตือน stale ไปแล้วหรือยัง (ใช้ KV เก็บ)
    const lastStaleAlert = await env.ADMIN_MONITOR_CACHE.get('last_stale_alert');
    const now = new Date();
    
    // แจ้งเตือนทุก 6 ชม. (ไม่ spam)
    if (lastStaleAlert) {
      const lastTime = new Date(lastStaleAlert);
      const hoursDiff = (now.getTime() - lastTime.getTime()) / 3600000;
      if (hoursDiff < 6) return;
    }

    let text = `⚠️ <b>งานค้างเกิน 48 ชั่วโมง!</b>\n`;
    text += `📋 พบ <b>${staleOrders.length}</b> งานที่ยังไม่เสร็จ\n\n`;

    for (const order of staleOrders as any[]) {
      const created = new Date(order.created_at);
      created.setHours(created.getHours() + 7);
      const hoursAgo = Math.floor((now.getTime() - created.getTime()) / 3600000);
      const daysAgo = Math.floor(hoursAgo / 24);
      const remainHours = hoursAgo % 24;

      const vt = order.view_target || 0;
      const vc = order.view_current || 0;
      const lt = order.like_target || 0;
      const lc = order.like_current || 0;
      const vp = vt > 0 ? Math.min(100, Math.round((vc / vt) * 100)) : 0;
      const lp = lt > 0 ? Math.min(100, Math.round((lc / lt) * 100)) : 0;

      text += `🔸 ค้าง ${daysAgo} วัน ${remainHours} ชม.\n`;
      if (vt > 0) text += `   👀 วิว: ${vc.toLocaleString()}/${vt.toLocaleString()} (${vp}%)\n`;
      if (lt > 0) text += `   👍 ไลค์: ${lc.toLocaleString()}/${lt.toLocaleString()} (${lp}%)\n`;
      if (order.line_id) text += `   👤 ${order.line_id}\n`;
      text += `   🔗 ${order.url}\n\n`;
    }

    text += `💡 <i>ตรวจสอบที่ Admin Monitor</i>`;

    await sendReportBot(REPORT_TOKEN, REPORT_CHAT, text);
    await env.ADMIN_MONITOR_CACHE.put('last_stale_alert', now.toISOString());
    console.log(`[REPORT] Sent stale alert for ${staleOrders.length} orders`);
  } catch (e) {
    console.error('[REPORT] Stale check error:', e);
  }
}

// สรุปประจำวัน (ส่งตอน 09:00 เวลาไทย = 02:00 UTC)
async function sendDailyReport(env: Bindings) {
  const db = env.DB;
  const REPORT_TOKEN = env.REPORT_BOT_TOKEN;
  const REPORT_CHAT = env.REPORT_CHAT_ID;

  if (!REPORT_TOKEN || !REPORT_CHAT) return;

  try {
    // เช็คว่าส่งรายงานวันนี้แล้วหรือยัง
    const today = new Date().toISOString().split('T')[0];
    const lastReport = await env.ADMIN_MONITOR_CACHE.get('last_daily_report');
    if (lastReport === today) return;

    // นับจำนวน orders ต่างๆ
    const running = await db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'running'").first() as any;
    const done = await db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'done'").first() as any;
    const stale = await db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'running' AND created_at < datetime('now', '-48 hours')").first() as any;
    const nearComplete = await db.prepare(`
      SELECT COUNT(*) as c FROM orders WHERE status = 'running'
      AND (
        (view_target > 0 AND like_target > 0 AND 
         CAST(view_current AS REAL)/view_target >= 0.9 AND CAST(like_current AS REAL)/like_target >= 0.9)
        OR (view_target > 0 AND like_target = 0 AND CAST(view_current AS REAL)/view_target >= 0.9)
        OR (view_target = 0 AND like_target > 0 AND CAST(like_current AS REAL)/like_target >= 0.9)
      )
    `).first() as any;

    // งานเสร็จเมื่อวาน
    const completedYesterday = await db.prepare(`
      SELECT COUNT(*) as c FROM orders 
      WHERE status = 'done' AND completed_at >= datetime('now', '-24 hours')
    `).first() as any;

    // งานเพิ่มเมื่อวาน
    const addedYesterday = await db.prepare(`
      SELECT COUNT(*) as c FROM orders 
      WHERE created_at >= datetime('now', '-24 hours')
    `).first() as any;

    // Activity logs วันนี้
    const todayLogs = await db.prepare(`
      SELECT COUNT(*) as c FROM activity_logs 
      WHERE created_at >= datetime('now', '-24 hours')
    `).first() as any;

    const activeUsers = await db.prepare(`
      SELECT COUNT(DISTINCT admin_email) as c FROM activity_logs 
      WHERE created_at >= datetime('now', '-24 hours')
    `).first() as any;

    // สร้างข้อความ
    const thaiDate = new Date();
    thaiDate.setHours(thaiDate.getHours() + 7);
    const dateStr = thaiDate.toLocaleDateString('th-TH', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });

    let text = `📊 <b>สรุปประจำวัน</b>\n`;
    text += `📅 ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━\n\n`;

    text += `📦 <b>สถานะงาน</b>\n`;
    text += `   ⏳ กำลังทำ: <b>${running?.c || 0}</b> งาน\n`;
    text += `   ✅ เสร็จแล้ว: <b>${done?.c || 0}</b> งาน\n`;
    if ((stale?.c || 0) > 0) {
      text += `   ⚠️ ค้างเกิน 48 ชม.: <b>${stale.c}</b> งาน\n`;
    }
    if ((nearComplete?.c || 0) > 0) {
      text += `   🔥 ใกล้เสร็จ (90%+): <b>${nearComplete.c}</b> งาน\n`;
    }
    text += `\n`;

    text += `📈 <b>24 ชม.ที่ผ่านมา</b>\n`;
    text += `   ➕ เพิ่มใหม่: ${addedYesterday?.c || 0} งาน\n`;
    text += `   ✅ เสร็จ: ${completedYesterday?.c || 0} งาน\n`;
    text += `   📝 กิจกรรม: ${todayLogs?.c || 0} ครั้ง\n`;
    text += `   👥 ผู้ใช้งาน: ${activeUsers?.c || 0} คน\n\n`;

    // สถานะรวม
    const totalRunning = running?.c || 0;
    const totalStale = stale?.c || 0;
    if (totalStale > 0) {
      text += `🚨 <b>ต้องตรวจสอบ ${totalStale} งานที่ค้างนาน!</b>\n`;
    } else if (totalRunning === 0) {
      text += `🎉 <b>ไม่มีงานค้าง ทุกอย่างเรียบร้อย!</b>\n`;
    } else {
      text += `👍 <b>งานทั้งหมดดำเนินการปกติ</b>\n`;
    }

    await sendReportBot(REPORT_TOKEN, REPORT_CHAT, text);
    await env.ADMIN_MONITOR_CACHE.put('last_daily_report', today);
    console.log('[REPORT] Daily report sent');
  } catch (e) {
    console.error('[REPORT] Daily report error:', e);
  }
}

// ============= HEALTH CHECK — ตรวจจับ cron หยุดทำงาน =============
async function cronHealthCheck(env: Bindings) {
  const REPORT_TOKEN = env.REPORT_BOT_TOKEN;
  const REPORT_CHAT = env.REPORT_CHAT_ID;
  if (!REPORT_TOKEN || !REPORT_CHAT) return;

  try {
    const lastCheck = await env.ADMIN_MONITOR_CACHE.get('last_cron_check');
    if (!lastCheck) return; // ยังไม่เคยรัน ไม่ต้องเช็ค

    const lastTime = new Date(lastCheck);
    const now = new Date();
    const hoursSinceLast = (now.getTime() - lastTime.getTime()) / 3600000;

    // ถ้า cron ไม่รันเกิน 2 ชม. (ปกติรันทุก 30 นาที)
    if (hoursSinceLast >= 2) {
      // เช็คว่าแจ้งเตือน health ไปแล้วหรือยัง (ทุก 2 ชม.)
      const lastHealthAlert = await env.ADMIN_MONITOR_CACHE.get('last_health_alert');
      if (lastHealthAlert) {
        const alertHours = (now.getTime() - new Date(lastHealthAlert).getTime()) / 3600000;
        if (alertHours < 2) return;
      }

      const hoursAgo = Math.floor(hoursSinceLast);
      const minsAgo = Math.round((hoursSinceLast - hoursAgo) * 60);

      let text = `🏥 <b>Cron Health Alert!</b>\n\n`;
      text += `⚠️ Cron ไม่ได้รันมา <b>${hoursAgo} ชม. ${minsAgo} นาที</b>\n`;
      text += `📅 รันล่าสุด: ${lastTime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}\n\n`;

      // ดึง health status ล่าสุด
      try {
        const healthStr = await env.ADMIN_MONITOR_CACHE.get('cron_health');
        if (healthStr) {
          const health = JSON.parse(healthStr);
          text += `📊 <b>สถานะรอบล่าสุด:</b>\n`;
          text += `   ✅ เช็ค: ${health.checked} งาน\n`;
          text += `   🎉 เสร็จ: ${health.completed} งาน\n`;
          if (health.errors > 0) text += `   ❌ API errors: ${health.errors}\n`;
          text += `\n`;
        }
      } catch (e) {}

      text += `💡 <i>อาจเกิดจาก:\n`;
      text += `- Cloudflare Workers มีปัญหา\n`;
      text += `- Cron trigger ถูกปิด\n`;
      text += `- Deploy ใหม่แล้ว cron ยังไม่เริ่ม</i>`;

      await sendReportBot(REPORT_TOKEN, REPORT_CHAT, text);
      await env.ADMIN_MONITOR_CACHE.put('last_health_alert', now.toISOString());
      console.log(`[HEALTH] Alert sent - cron missing for ${hoursAgo}h ${minsAgo}m`);
    }
  } catch (e) {
    console.error('[HEALTH] Check error:', e);
  }
}

// ============= ENSEMBLE CREDIT ALERT =============
// เช็คเครดิต EnsembleData ทุกรอบ cron — แจ้งเตือนถ้าเหลือน้อย
async function checkEnsembleCredits(env: Bindings) {
  const REPORT_TOKEN = env.REPORT_BOT_TOKEN;
  const REPORT_CHAT = env.REPORT_CHAT_ID;
  const cache = env.ADMIN_MONITOR_CACHE;

  if (!REPORT_TOKEN || !REPORT_CHAT) return;

  const ALERT_THRESHOLD = 10; // แจ้งเตือนถ้าเหลือต่ำกว่า 10 units
  const DAILY_LIMIT = 50;     // Free tier

  const tokens: { key: string; token: string; label: string }[] = [
    { key: 'tiktok', token: env.ENSEMBLE_TOKEN, label: '🎵 TikTok' },
    { key: 'instagram', token: env.ENSEMBLE_IG_TOKEN, label: '📷 Instagram' },
  ];

  try {
    const today = new Date().toISOString().split('T')[0];
    const alerts: string[] = [];

    for (const { key, token, label } of tokens) {
      if (!token) continue;

      try {
        const res = await fetch(
          `https://ensembledata.com/apis/customer/get-used-units?date=${today}&token=${token}`
        );
        const data = await res.json() as any;
        const used = Number(data?.data?.used_units ?? data?.data ?? 0);
        const remaining = DAILY_LIMIT - used;

        if (remaining <= ALERT_THRESHOLD) {
          alerts.push(`${label}: เหลือ <b>${remaining}</b>/${DAILY_LIMIT} units (ใช้ไป ${used})`);
        }

        // ถ้าหมดเลย (0) แจ้งเตือนพิเศษ
        if (remaining <= 0) {
          alerts.push(`⚠️ ${label}: <b>หมดแล้ว!</b> ระบบจะใช้ Apify แทน (ช้ากว่า)`);
        }
      } catch (e) {
        console.error(`[EnsembleAlert] Error checking ${key}:`, e);
      }
    }

    if (alerts.length === 0) return;

    // เช็คว่าแจ้งไปแล้วหรือยังวันนี้ (ไม่แจ้งซ้ำทุก 30 นาที)
    const alertKey = `ensemble_alert_${today}`;
    const lastAlert = await cache?.get(alertKey);
    
    // แจ้งซ้ำได้ทุก 6 ชม.
    if (lastAlert) {
      const lastTime = new Date(lastAlert).getTime();
      const now = Date.now();
      if (now - lastTime < 6 * 60 * 60 * 1000) return; // ยังไม่ถึง 6 ชม.
    }

    const text = `🔋 <b>EnsembleData Credit Alert</b>

${alerts.join('\n')}

📅 วันที่: ${today}
💡 เครดิตจะรีเซ็ตรอบใหม่พรุ่งนี้`;

    await sendReportBot(REPORT_TOKEN, REPORT_CHAT, text);
    await cache?.put(alertKey, new Date().toISOString(), { expirationTtl: 86400 });

    console.log(`[EnsembleAlert] Alert sent: ${alerts.length} warnings`);
  } catch (e) {
    console.error('[EnsembleAlert] Error:', e);
  }
}

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
