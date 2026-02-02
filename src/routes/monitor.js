import { Hono } from 'hono';

const app = new Hono();

// ==================== HELPER: Extract Video ID ====================
function extractVideoId(url) {
  if (url.includes('watch?v=')) return url.split('watch?v=')[1].split('&')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
  if (url.includes('/shorts/')) return url.split('/shorts/')[1].split('?')[0];
  return null;
}

// ==================== HELPER: Get YouTube Stats ====================
async function getYoutubeStats(url, apiKey) {
  const videoId = extractVideoId(url);
  if (!videoId) return null;
  
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) return null;
  
  const item = data.items[0];
  return {
    title: item.snippet.title,
    views: Number(item.statistics.viewCount || 0),
    likes: Number(item.statistics.likeCount || 0),
  };
}

// ==================== GET ALL ORDERS ====================
app.get('/', async (c) => {
  const user = c.get('user');
  
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `).all();
    
    return c.json({ orders: result.results || [] });
  } catch (err) {
    console.error('Database error:', err);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// ==================== ADD ORDER ====================
app.post('/add', async (c) => {
  const user = c.get('user');
  const { url, viewTarget, likeTarget, lineId } = await c.req.json();
  
  if (!url) {
    return c.json({ error: 'URL is required' }, 400);
  }
  
  const viewTargetNum = Number(viewTarget) || 0;
  const likeTargetNum = Number(likeTarget) || 0;
  
  if (viewTargetNum === 0 && likeTargetNum === 0) {
    return c.json({ error: 'กรุณาระบุจำนวนวิวหรือไลค์อย่างน้อย 1 อย่าง' }, 400);
  }
  
  try {
    // Get current stats
    const stats = await getYoutubeStats(url, c.env.YOUTUBE_API_KEY);
    
    if (!stats) {
      return c.json({ error: 'ไม่สามารถดึงข้อมูล YouTube ได้' }, 400);
    }
    
    const currentView = stats.views;
    const currentLike = stats.likes;
    const finalViewTarget = viewTargetNum > 0 ? currentView + viewTargetNum : 0;
    const finalLikeTarget = likeTargetNum > 0 ? currentLike + likeTargetNum : 0;
    
    // Insert to database
    const result = await c.env.DB.prepare(`
      INSERT INTO orders (
        url, view_target, view_current, like_target, like_current,
        status, line_id, user_email
      ) VALUES (?, ?, ?, ?, ?, 'running', ?, ?)
    `).bind(
      url,
      finalViewTarget,
      currentView,
      finalLikeTarget,
      currentLike,
      lineId || '',
      user.email
    ).run();
    
    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO logs (user_email, action, details)
      VALUES (?, 'add_order', ?)
    `).bind(
      user.email,
      `Added order: ${url} (View: ${currentView}→${finalViewTarget}, Like: ${currentLike}→${finalLikeTarget})`
    ).run();
    
    let summary = 'เพิ่มงานเรียบร้อยแล้ว\n';
    if (viewTargetNum > 0) {
      summary += `วิว: ${currentView.toLocaleString()} → ${finalViewTarget.toLocaleString()}\n`;
    }
    if (likeTargetNum > 0) {
      summary += `ไลค์: ${currentLike.toLocaleString()} → ${finalLikeTarget.toLocaleString()}`;
    }
    
    return c.json({ 
      success: true, 
      message: summary,
      orderId: result.meta.last_row_id 
    });
  } catch (err) {
    console.error('Add order error:', err);
    return c.json({ error: 'Failed to add order' }, 500);
  }
});

// ==================== DELETE ORDER ====================
app.delete('/:id', async (c) => {
  const user = c.get('user');
  const orderId = c.req.param('id');
  
  try {
    // Check if order exists and belongs to user (or user is admin)
    const order = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE id = ?
    `).bind(orderId).first();
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    // Delete order
    await c.env.DB.prepare(`
      DELETE FROM orders WHERE id = ?
    `).bind(orderId).run();
    
    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO logs (user_email, action, details)
      VALUES (?, 'delete_order', ?)
    `).bind(user.email, `Deleted order ID: ${orderId}`).run();
    
    return c.json({ success: true, message: 'ลบงานเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Delete order error:', err);
    return c.json({ error: 'Failed to delete order' }, 500);
  }
});

// ==================== CHECK ALL ORDERS (CRON) ====================
app.post('/check-all', async (c) => {
  const user = c.get('user');
  
  try {
    // Get all running orders
    const result = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE status = 'running'
    `).all();
    
    const orders = result.results || [];
    let checkedCount = 0;
    let completedCount = 0;
    
    for (const order of orders) {
      const stats = await getYoutubeStats(order.url, c.env.YOUTUBE_API_KEY);
      
      if (!stats) continue;
      
      const currentView = stats.views;
      const currentLike = stats.likes;
      
      let viewDone = false;
      let likeDone = false;
      
      if (order.view_target > 0) {
        viewDone = currentView >= order.view_target;
      } else {
        viewDone = true; // ไม่ได้ตั้งเป้า
      }
      
      if (order.like_target > 0) {
        likeDone = currentLike >= order.like_target;
      } else {
        likeDone = true; // ไม่ได้ตั้งเป้า
      }
      
      const isDone = viewDone && likeDone;
      const newStatus = isDone ? 'done' : 'running';
      
      // Update order
      await c.env.DB.prepare(`
        UPDATE orders 
        SET view_current = ?, like_current = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(currentView, currentLike, newStatus, order.id).run();
      
      checkedCount++;
      
      if (isDone && order.notified !== 'yes') {
        // Send notification (Telegram)
        if (c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_GROUP_ID) {
          await sendTelegramNotification(
            c.env.TELEGRAM_BOT_TOKEN,
            c.env.TELEGRAM_GROUP_ID,
            order,
            currentView,
            currentLike
          );
        }
        
        // Mark as notified
        await c.env.DB.prepare(`
          UPDATE orders SET notified = 'yes' WHERE id = ?
        `).bind(order.id).run();
        
        completedCount++;
      }
    }
    
    return c.json({
      success: true,
      message: `เช็คแล้ว ${checkedCount} งาน, เสร็จ ${completedCount} งาน`
    });
  } catch (err) {
    console.error('Check orders error:', err);
    return c.json({ error: 'Failed to check orders' }, 500);
  }
});

// ==================== TELEGRAM NOTIFICATION ====================
async function sendTelegramNotification(token, groupId, order, currentView, currentLike) {
  try {
    let text = '🎉 <b>งานเสร็จแล้ว!</b>\n\n';
    
    if (order.view_target > 0) {
      text += `📊 วิว: ${currentView.toLocaleString()} / ${order.view_target.toLocaleString()}\n`;
    }
    if (order.like_target > 0) {
      text += `👍 ไลค์: ${currentLike.toLocaleString()} / ${order.like_target.toLocaleString()}\n`;
    }
    if (order.line_id) {
      text += `\n👤 Line ID: ${order.line_id}`;
    }
    
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
            { text: '▶️ เปิดดูคลิปบน YouTube', url: order.url }
          ]]
        }
      })
    });
  } catch (err) {
    console.error('Telegram notification error:', err);
  }
}

// ==================== DASHBOARD DATA ====================
app.get('/dashboard', async (c) => {
  try {
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM orders
    `).first();
    
    const runningResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'running'
    `).first();
    
    const doneResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'done'
    `).first();
    
    const nearCompletion = await c.env.DB.prepare(`
      SELECT * FROM orders 
      WHERE status = 'running'
      AND (
        (view_target > 0 AND view_current >= view_target * 0.9)
        OR (like_target > 0 AND like_current >= like_target * 0.9)
      )
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    
    return c.json({
      totalOrders: totalResult.count || 0,
      running: runningResult.count || 0,
      done: doneResult.count || 0,
      nearCompletion: nearCompletion.results || [],
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return c.json({ error: 'Failed to fetch dashboard data' }, 500);
  }
});

export const monitorRoutes = app;
