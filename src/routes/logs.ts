import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

export const logsRoutes = new Hono<{ Bindings: Bindings }>();

// ============= บันทึก Log =============
logsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { action, platform, details } = body;
    
    // Get user from header
    const sessionToken = c.req.header('X-Session-Token');
    let userEmail = 'anonymous';
    let userName = 'Anonymous';
    let userPicture = '';
    
    if (sessionToken) {
      try {
        const binaryString = atob(sessionToken);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const session = JSON.parse(new TextDecoder().decode(bytes));
        userEmail = session.email || 'anonymous';
        userName = session.name || 'Anonymous';
        userPicture = session.picture || '';
      } catch (e) {}
    }
    
    // Determine action type
    let actionType = 'other';
    if (action.includes('ดูสถิติ')) actionType = 'stats';
    else if (action.includes('สรุปงาน')) actionType = 'summary';
    else if (action.includes('เพิ่มงาน') || action.includes('Monitor')) actionType = 'monitor_add';
    else if (action.includes('ลบ')) actionType = 'delete';
    
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (admin_email, admin_name, admin_picture, action, action_type, category, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(userEmail, userName, userPicture, action, actionType, platform || 'other', details || '').run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Log error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============= ดึง Logs ทั้งหมด (Overview) =============
logsRoutes.get('/', async (c) => {
  try {
    // Get all logs (latest 500)
    const logsResult = await c.env.DB.prepare(`
      SELECT * FROM activity_logs 
      ORDER BY created_at DESC 
      LIMIT 500
    `).all();
    
    // Get user stats (aggregate by user)
    const userStatsResult = await c.env.DB.prepare(`
      SELECT 
        admin_email,
        admin_name,
        admin_picture,
        COUNT(*) as total_actions,
        SUM(CASE WHEN category = 'youtube' THEN 1 ELSE 0 END) as youtube_count,
        SUM(CASE WHEN category = 'tiktok' THEN 1 ELSE 0 END) as tiktok_count,
        SUM(CASE WHEN category = 'facebook' THEN 1 ELSE 0 END) as facebook_count,
        SUM(CASE WHEN category = 'instagram' THEN 1 ELSE 0 END) as instagram_count,
        SUM(CASE WHEN action_type = 'stats' THEN 1 ELSE 0 END) as stats_count,
        SUM(CASE WHEN action_type = 'summary' THEN 1 ELSE 0 END) as summary_count,
        SUM(CASE WHEN action_type = 'monitor_add' THEN 1 ELSE 0 END) as monitor_add_count,
        SUM(CASE WHEN action_type = 'delete' THEN 1 ELSE 0 END) as delete_count,
        MAX(created_at) as last_active
      FROM activity_logs 
      GROUP BY admin_email
      ORDER BY total_actions DESC
    `).all();
    
    // Get today's count
    const todayResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM activity_logs 
      WHERE date(created_at) = date('now')
    `).first();
    
    // Get total count
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM activity_logs
    `).first();
    
    // Platform totals
    const platformResult = await c.env.DB.prepare(`
      SELECT 
        category,
        COUNT(*) as count
      FROM activity_logs 
      GROUP BY category
    `).all();
    
    const platforms: Record<string, number> = {};
    (platformResult.results || []).forEach((p: any) => {
      platforms[p.category] = p.count;
    });
    
    return c.json({
      logs: logsResult.results || [],
      userStats: userStatsResult.results || [],
      today: (todayResult as any)?.count || 0,
      total: (totalResult as any)?.count || 0,
      userCount: (userStatsResult.results || []).length,
      platforms
    });
  } catch (error: any) {
    console.error('Get logs error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============= ดึง Logs ของผู้ใช้คนเดียว =============
logsRoutes.get('/user/:email', async (c) => {
  try {
    const email = decodeURIComponent(c.req.param('email'));
    
    // Get user info and stats
    const userStatsResult = await c.env.DB.prepare(`
      SELECT 
        admin_email,
        admin_name,
        admin_picture,
        COUNT(*) as total_actions,
        SUM(CASE WHEN category = 'youtube' THEN 1 ELSE 0 END) as youtube_count,
        SUM(CASE WHEN category = 'tiktok' THEN 1 ELSE 0 END) as tiktok_count,
        SUM(CASE WHEN category = 'facebook' THEN 1 ELSE 0 END) as facebook_count,
        SUM(CASE WHEN category = 'instagram' THEN 1 ELSE 0 END) as instagram_count,
        SUM(CASE WHEN action_type = 'stats' THEN 1 ELSE 0 END) as stats_count,
        SUM(CASE WHEN action_type = 'summary' THEN 1 ELSE 0 END) as summary_count,
        SUM(CASE WHEN action_type = 'monitor_add' THEN 1 ELSE 0 END) as monitor_add_count,
        SUM(CASE WHEN action_type = 'delete' THEN 1 ELSE 0 END) as delete_count,
        MIN(created_at) as first_active,
        MAX(created_at) as last_active
      FROM activity_logs 
      WHERE admin_email = ?
      GROUP BY admin_email
    `).bind(email).first();
    
    // Get user's recent logs
    const logsResult = await c.env.DB.prepare(`
      SELECT * FROM activity_logs 
      WHERE admin_email = ?
      ORDER BY created_at DESC 
      LIMIT 100
    `).bind(email).all();
    
    // Get daily activity (last 7 days)
    const dailyResult = await c.env.DB.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as count
      FROM activity_logs 
      WHERE admin_email = ? AND created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date DESC
    `).bind(email).all();
    
    return c.json({
      user: userStatsResult || null,
      logs: logsResult.results || [],
      dailyActivity: dailyResult.results || []
    });
  } catch (error: any) {
    console.error('Get user logs error:', error);
    return c.json({ error: error.message }, 500);
  }
});
