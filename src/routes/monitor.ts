import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  YOUTUBE_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_GROUP_ID: string;
  ADMIN_MONITOR_CACHE: KVNamespace;
};

export const monitorRoutes = new Hono<{ Bindings: Bindings }>();

// ============= HELPER FUNCTIONS =============

function extractVideoId(url: string): string | null {
  if (url.includes('watch?v=')) {
    return url.split('watch?v=')[1].split('&')[0];
  }
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1].split('?')[0];
  }
  if (url.includes('/shorts/')) {
    return url.split('/shorts/')[1].split('?')[0];
  }
  return null;
}

async function getYoutubeStats(url: string, apiKey: string): Promise<any> {
  const videoId = extractVideoId(url);
  if (!videoId) return null;

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
  const res = await fetch(apiUrl);
  const data = await res.json() as any;

  if (!data.items || data.items.length === 0) return null;

  const item = data.items[0];
  return {
    title: item.snippet.title,
    views: Number(item.statistics.viewCount || 0),
    likes: Number(item.statistics.likeCount || 0),
  };
}

async function sendTelegram(token: string, groupId: string, text: string, youtubeUrl: string): Promise<void> {
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

// ============= GET ALL RUNNING ORDERS =============
monitorRoutes.get('/orders', async (c) => {
  try {
    const db = c.env.DB;

    const result = await db.prepare(`
      SELECT * FROM orders 
      WHERE status = 'running' 
      ORDER BY created_at DESC
    `).all();

    return c.json({ orders: result.results || [] });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= ADD NEW ORDER =============
monitorRoutes.post('/orders', async (c) => {
  try {
    const { url, viewTarget, likeTarget, lineId } = await c.req.json();
    const user = c.get('user');
    const userEmail = user?.email || 'unknown';

    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    const viewTargetNum = Number(viewTarget) || 0;
    const likeTargetNum = Number(likeTarget) || 0;

    if (viewTargetNum === 0 && likeTargetNum === 0) {
      return c.json({ error: 'กรุณาระบุจำนวนวิวหรือไลค์อย่างน้อย 1 อย่าง' }, 400);
    }

    const API_KEY = c.env.YOUTUBE_API_KEY;
    const db = c.env.DB;

    // Get current stats
    const stats = await getYoutubeStats(url, API_KEY);
    if (!stats) {
      return c.json({ error: 'ไม่สามารถดึงข้อมูล YouTube ได้' }, 400);
    }

    const currentView = stats.views;
    const currentLike = stats.likes;
    const finalViewTarget = viewTargetNum > 0 ? currentView + viewTargetNum : 0;
    const finalLikeTarget = likeTargetNum > 0 ? currentLike + likeTargetNum : 0;

    // Insert to database
    await db.prepare(`
      INSERT INTO orders (url, view_target, view_current, like_target, like_current, status, line_id, notified, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, 'running', ?, 'no', datetime('now'), ?)
    `).bind(
      url,
      finalViewTarget,
      currentView,
      finalLikeTarget,
      currentLike,
      lineId || '',
      userEmail
    ).run();

    // Log activity (เพิ่มงานเท่านั้น)
    try {
      await db.prepare(`
        INSERT INTO activity_logs (admin_email, admin_name, action, category, details, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        userEmail,
        user?.name || userEmail.split('@')[0],
        'เพิ่มงาน Monitor',
        'monitor',
        JSON.stringify({url, viewTarget: viewTargetNum, likeTarget: likeTargetNum, lineId})
      ).run();
    } catch(e) { console.error('Log error:', e); }

    let summary = 'เพิ่มงานเรียบร้อยแล้ว\n';
    if (viewTargetNum > 0) {
      summary += `วิว: ${currentView.toLocaleString()} → ${finalViewTarget.toLocaleString()}\n`;
    }
    if (likeTargetNum > 0) {
      summary += `ไลค์: ${currentLike.toLocaleString()} → ${finalLikeTarget.toLocaleString()}`;
    }

    return c.json({ success: true, message: summary });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= DELETE ORDER =============
monitorRoutes.delete('/orders/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    const user = c.get('user');
    const userEmail = user?.email || 'unknown';

    await db.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();

    // Log activity (แสดงใน logs แต่ไม่นับสถิติ - ใช้ category 'system')
    try {
      await db.prepare(`
        INSERT INTO activity_logs (admin_email, admin_name, action, category, details, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        userEmail,
        user?.name || userEmail.split('@')[0],
        'ลบงาน Monitor',
        'system',
        JSON.stringify({orderId: id})
      ).run();
    } catch(e) { console.error('Log error:', e); }

    return c.json({ success: true, message: 'ลบงานเรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= CHECK ALL ORDERS =============
monitorRoutes.post('/check-all', async (c) => {
  try {
    const db = c.env.DB;
    const API_KEY = c.env.YOUTUBE_API_KEY;
    const TG_TOKEN = c.env.TELEGRAM_BOT_TOKEN;
    const TG_GROUP = c.env.TELEGRAM_GROUP_ID;

    const result = await db.prepare(`
      SELECT * FROM orders 
      WHERE status = 'running' AND notified != 'yes'
    `).all();

    const orders = result.results || [];
    let checkedCount = 0;
    let completedCount = 0;

    for (const order of orders as any[]) {
      const stats = await getYoutubeStats(order.url, API_KEY);
      if (!stats) continue;

      const newView = stats.views;
      const newLike = stats.likes;

      // Update current values
      await db.prepare(`
        UPDATE orders 
        SET view_current = ?, like_current = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(newView, newLike, order.id).run();

      checkedCount++;

      // Check if complete
      const viewComplete = order.view_target === 0 || newView >= order.view_target;
      const likeComplete = order.like_target === 0 || newLike >= order.like_target;

      if (viewComplete && likeComplete) {
        // Build notification message
        let message = `🎉 <b>งานสำเร็จแล้ว!</b>\n🎬 <b>${stats.title}</b>\n`;

        if (order.view_target > 0) {
          const percentView = Math.min(100, Math.floor((newView / order.view_target) * 100));
          message += `\n👀 วิว: ${newView.toLocaleString()} / ${order.view_target.toLocaleString()} (${percentView}%)`;
        }

        if (order.like_target > 0) {
          const percentLike = Math.min(100, Math.floor((newLike / order.like_target) * 100));
          message += `\n👍 ไลค์: ${newLike.toLocaleString()} / ${order.like_target.toLocaleString()} (${percentLike}%)`;
        }

        if (order.line_id) {
          message += `\n\n👤 LINE ID: ${order.line_id}`;
        }

        // Send Telegram notification
        await sendTelegram(TG_TOKEN, TG_GROUP, message, order.url);

        // Update status
        await db.prepare(`
          UPDATE orders 
          SET status = 'done', notified = 'yes', completed_at = datetime('now')
          WHERE id = ?
        `).bind(order.id).run();

        completedCount++;
      }
    }

    // Save last check time to KV
    try {
      await c.env.ADMIN_MONITOR_CACHE.put('last_cron_check', new Date().toISOString());
    } catch (e) {}

    return c.json({ 
      success: true, 
      message: `ตรวจสอบแล้ว ${checkedCount} งาน, เสร็จสมบูรณ์ ${completedCount} งาน` 
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GET LAST CRON CHECK TIME =============
monitorRoutes.get('/last-check', async (c) => {
  try {
    const lastCheck = await c.env.ADMIN_MONITOR_CACHE.get('last_cron_check');
    return c.json({ lastCheck: lastCheck || null });
  } catch (error: any) {
    return c.json({ lastCheck: null }, 200);
  }
});

// ============= GET DASHBOARD DATA =============
monitorRoutes.get('/dashboard', async (c) => {
  try {
    const db = c.env.DB;

    // Get counts
    const totalResult = await db.prepare('SELECT COUNT(*) as count FROM orders').first() as any;
    const runningResult = await db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'running'").first() as any;
    const doneResult = await db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'done'").first() as any;

    // Get today's stats
    const todayAddedResult = await db.prepare(`
      SELECT COUNT(*) as count FROM orders 
      WHERE date(created_at) = date('now')
    `).first() as any;

    const todayCompletedResult = await db.prepare(`
      SELECT COUNT(*) as count FROM orders 
      WHERE status = 'done' AND date(completed_at) = date('now')
    `).first() as any;

    // Get near completion (90%+)
    const nearCompletionResult = await db.prepare(`
      SELECT * FROM orders 
      WHERE status = 'running'
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    const nearCompletion: any[] = [];
    for (const order of (nearCompletionResult.results || []) as any[]) {
      let progress = 0;
      let totalTarget = 0;
      let totalCurrent = 0;

      if (order.view_target > 0) {
        totalTarget += order.view_target;
        totalCurrent += order.view_current;
      }
      if (order.like_target > 0) {
        totalTarget += order.like_target;
        totalCurrent += order.like_current;
      }

      if (totalTarget > 0) {
        progress = Math.floor((totalCurrent / totalTarget) * 100);
      }

      if (progress >= 90) {
        nearCompletion.push({
          id: order.id,
          url: order.url,
          progress,
          viewCurrent: order.view_current,
          viewTarget: order.view_target,
          likeCurrent: order.like_current,
          likeTarget: order.like_target,
          lineId: order.line_id,
        });
      }
    }

    return c.json({
      totalOrders: totalResult?.count || 0,
      running: runningResult?.count || 0,
      done: doneResult?.count || 0,
      todayStats: {
        added: todayAddedResult?.count || 0,
        completed: todayCompletedResult?.count || 0,
      },
      nearCompletion: nearCompletion.slice(0, 10),
      stuckOrders: [],
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GET RECENT ACTIVITY =============
monitorRoutes.get('/activity', async (c) => {
  try {
    const db = c.env.DB;

    const result = await db.prepare(`
      SELECT * FROM orders 
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

    const activity = (result.results || []).map((order: any) => ({
      type: order.status === 'running' ? 'added' : 'completed',
      time: order.status === 'running' ? 'เพิ่งเพิ่ม' : 'เสร็จแล้ว',
      url: order.url,
      shortUrl: order.url.substring(0, 50) + '...',
    }));

    return c.json({ activity });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= CLEANUP OLD ORDERS =============
monitorRoutes.post('/cleanup', async (c) => {
  try {
    const { days = 30 } = await c.req.json();
    const db = c.env.DB;

    const result = await db.prepare(`
      DELETE FROM orders 
      WHERE status = 'done' 
      AND completed_at < datetime('now', '-' || ? || ' days')
    `).bind(days).run();

    return c.json({ 
      success: true, 
      message: `🧹 ลบออเดอร์เก่าแล้ว ${result.meta.changes || 0} รายการ` 
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
