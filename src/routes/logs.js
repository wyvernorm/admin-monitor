import { Hono } from 'hono';

const app = new Hono();

// ==================== GET LOGS ====================
app.get('/', async (c) => {
  const user = c.get('user');
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 50;
  const offset = (page - 1) * limit;
  
  try {
    // Get logs with pagination
    const result = await c.env.DB.prepare(`
      SELECT * FROM logs 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM logs
    `).first();
    
    return c.json({
      logs: result.results || [],
      total: countResult.count || 0,
      page,
      limit,
      totalPages: Math.ceil((countResult.count || 0) / limit),
    });
  } catch (err) {
    console.error('Logs error:', err);
    return c.json({ error: 'Failed to fetch logs' }, 500);
  }
});

// ==================== GET USER LOGS ====================
app.get('/user/:email', async (c) => {
  const email = c.req.param('email');
  const limit = Number(c.req.query('limit')) || 50;
  
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM logs 
      WHERE user_email = ?
      ORDER BY timestamp DESC 
      LIMIT ?
    `).bind(email, limit).all();
    
    return c.json({ logs: result.results || [] });
  } catch (err) {
    console.error('User logs error:', err);
    return c.json({ error: 'Failed to fetch user logs' }, 500);
  }
});

// ==================== GET ACTIVITY SUMMARY ====================
app.get('/summary', async (c) => {
  try {
    // Most active users
    const activeUsers = await c.env.DB.prepare(`
      SELECT user_email, COUNT(*) as action_count
      FROM logs
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY user_email
      ORDER BY action_count DESC
      LIMIT 10
    `).all();
    
    // Most common actions
    const commonActions = await c.env.DB.prepare(`
      SELECT action, COUNT(*) as count
      FROM logs
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    // Recent activity
    const recentActivity = await c.env.DB.prepare(`
      SELECT * FROM logs
      ORDER BY timestamp DESC
      LIMIT 20
    `).all();
    
    return c.json({
      activeUsers: activeUsers.results || [],
      commonActions: commonActions.results || [],
      recentActivity: recentActivity.results || [],
    });
  } catch (err) {
    console.error('Summary error:', err);
    return c.json({ error: 'Failed to fetch summary' }, 500);
  }
});

export const logRoutes = app;
