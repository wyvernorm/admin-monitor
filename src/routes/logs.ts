import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  SESSION_SECRET: string;
};

type Variables = {
  user?: { email: string; name: string; picture?: string };
};

const logs = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Get all logs with stats
logs.get('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get recent logs (last 100)
    const logsResult = await c.env.DB.prepare(`
      SELECT id, admin_email, admin_name, action, category, details, created_at
      FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    // Get stats per user with platform breakdown and advanced metrics
    const statsResult = await c.env.DB.prepare(`
      SELECT 
        admin_email,
        admin_name,
        COUNT(*) as total_actions,
        MAX(created_at) as last_active,
        MIN(created_at) as first_active,
        SUM(CASE WHEN category = 'youtube' THEN 1 ELSE 0 END) as youtube_count,
        SUM(CASE WHEN category = 'tiktok' THEN 1 ELSE 0 END) as tiktok_count,
        SUM(CASE WHEN category = 'facebook' THEN 1 ELSE 0 END) as facebook_count,
        SUM(CASE WHEN category = 'instagram' THEN 1 ELSE 0 END) as instagram_count,
        SUM(CASE WHEN CAST(strftime('%H', created_at) AS INTEGER) >= 0 AND CAST(strftime('%H', created_at) AS INTEGER) < 5 THEN 1 ELSE 0 END) as night_count,
        SUM(CASE WHEN CAST(strftime('%H', created_at) AS INTEGER) >= 5 AND CAST(strftime('%H', created_at) AS INTEGER) < 7 THEN 1 ELSE 0 END) as early_count,
        SUM(CASE WHEN CAST(strftime('%w', created_at) AS INTEGER) IN (0, 6) THEN 1 ELSE 0 END) as weekend_count,
        COUNT(DISTINCT DATE(created_at)) as days_active
      FROM activity_logs
      GROUP BY admin_email
      ORDER BY total_actions DESC
    `).all();

    // Get max daily count per user (for speed badges)
    const dailyMaxResult = await c.env.DB.prepare(`
      SELECT admin_email, MAX(daily_count) as max_daily
      FROM (
        SELECT admin_email, DATE(created_at) as day, COUNT(*) as daily_count
        FROM activity_logs
        GROUP BY admin_email, DATE(created_at)
      )
      GROUP BY admin_email
    `).all();

    // Get max hourly count per user (for speed badges)
    const hourlyMaxResult = await c.env.DB.prepare(`
      SELECT admin_email, MAX(hourly_count) as max_hourly
      FROM (
        SELECT admin_email, DATE(created_at) as day, CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as hourly_count
        FROM activity_logs
        GROUP BY admin_email, DATE(created_at), CAST(strftime('%H', created_at) AS INTEGER)
      )
      GROUP BY admin_email
    `).all();

    // Merge advanced stats
    const dailyMaxMap: Record<string, number> = {};
    const hourlyMaxMap: Record<string, number> = {};
    (dailyMaxResult.results || []).forEach((r: any) => { dailyMaxMap[r.admin_email] = r.max_daily; });
    (hourlyMaxResult.results || []).forEach((r: any) => { hourlyMaxMap[r.admin_email] = r.max_hourly; });

    const enrichedStats = (statsResult.results || []).map((s: any, index: number) => ({
      ...s,
      max_daily: dailyMaxMap[s.admin_email] || 0,
      max_hourly: hourlyMaxMap[s.admin_email] || 0,
      max_streak: 1, // TODO: calculate actual streak
      best_rank: index + 1
    }));

    // Get today's count
    const todayResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM activity_logs
      WHERE DATE(created_at) = DATE('now')
    `).first();

    // Get platform stats
    const platformResult = await c.env.DB.prepare(`
      SELECT category, COUNT(*) as count
      FROM activity_logs
      GROUP BY category
    `).all();

    return c.json({
      logs: logsResult.results || [],
      stats: enrichedStats,
      todayCount: todayResult?.count || 0,
      platformStats: platformResult.results || []
    });
  } catch (e: any) {
    console.error('Logs fetch error:', e);
    return c.json({ error: e.message, logs: [], stats: [] });
  }
});

// Add new log entry (with deduplication)
logs.post('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { action, category, details } = body;

    if (!action || !category) {
      return c.json({ error: 'Missing action or category' }, 400);
    }

    // Deduplication: Check if same log exists within last 5 seconds
    const recentLog = await c.env.DB.prepare(`
      SELECT id FROM activity_logs 
      WHERE admin_email = ? AND action = ? AND category = ? 
      AND created_at > datetime('now', '-5 seconds')
      LIMIT 1
    `).bind(user.email, action, category).first();

    if (recentLog) {
      // Skip duplicate
      return c.json({ success: true, skipped: true });
    }

    // Get IP and User Agent
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';

    await c.env.DB.prepare(`
      INSERT INTO activity_logs (admin_email, admin_name, action, category, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.email,
      user.name || user.email.split('@')[0],
      action,
      category,
      details ? JSON.stringify(details) : null,
      ip,
      userAgent
    ).run();

    return c.json({ success: true });
  } catch (e: any) {
    console.error('Log create error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// Get logs by user
logs.get('/user/:email', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const email = c.req.param('email');

  try {
    const result = await c.env.DB.prepare(`
      SELECT id, admin_email, admin_name, action, category, details, created_at
      FROM activity_logs
      WHERE admin_email = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(email).all();

    return c.json({ logs: result.results || [] });
  } catch (e: any) {
    return c.json({ error: e.message, logs: [] });
  }
});

// Get logs by category
logs.get('/category/:category', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const category = c.req.param('category');

  try {
    const result = await c.env.DB.prepare(`
      SELECT id, admin_email, admin_name, action, category, details, created_at
      FROM activity_logs
      WHERE category = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(category).all();

    return c.json({ logs: result.results || [] });
  } catch (e: any) {
    return c.json({ error: e.message, logs: [] });
  }
});

export default logs;
