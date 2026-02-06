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
  RAPIDAPI_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_GROUP_ID: string;
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
    const session = JSON.parse(atob(sessionToken));
    
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
        const session = JSON.parse(atob(sessionToken));
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
      try { currentEmail = JSON.parse(atob(sessionToken)).email; } catch(e) {}
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
      try { inviterEmail = JSON.parse(atob(sessionToken)).email; } catch(e) {}
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
      try { currentEmail = JSON.parse(atob(sessionToken)).email; } catch(e) {}
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
      try { currentEmail = JSON.parse(atob(sessionToken)).email; } catch(e) {}
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

    for (const order of orders) {
      try {
        // Get current YouTube stats
        const videoId = extractVideoId(order.url as string);
        if (!videoId) continue;

        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`;
        const res = await fetch(apiUrl);
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

    console.log(`[CRON] Finished. Completed: ${completedCount}`);
    return { success: true, checked: orders.length, completed: completedCount };
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

// Export with scheduled handler
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(checkAllOrdersScheduled(env));
  }
};
