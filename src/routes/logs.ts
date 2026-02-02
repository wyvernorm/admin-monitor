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

    // Get stats per user
    const statsResult = await c.env.DB.prepare(`
      SELECT 
        admin_email,
        admin_name,
        COUNT(*) as total_actions,
        MAX(created_at) as last_active
      FROM activity_logs
      GROUP BY admin_email
      ORDER BY total_actions DESC
    `).all();

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
      stats: statsResult.results || [],
      todayCount: todayResult?.count || 0,
      platformStats: platformResult.results || []
    });
  } catch (e: any) {
    console.error('Logs fetch error:', e);
    return c.json({ error: e.message, logs: [], stats: [] });
  }
});

// Add new log entry
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
