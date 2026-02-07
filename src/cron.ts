// ============= CRON / SCHEDULED HANDLERS =============
// แยกจาก index.ts เพื่อให้โค้ดสะอาดขึ้น

import type { Bindings, Order, ApiError, CronResult } from './types';
import { extractVideoId, sendTelegramNotification, sendReportBot } from './utils';

// ============= CHECK ALL ORDERS (ทุก 30 นาที) =============
export async function checkAllOrdersScheduled(env: Bindings): Promise<CronResult> {
  const db = env.DB;
  const API_KEY = env.YOUTUBE_API_KEY;
  const TG_TOKEN = env.TELEGRAM_BOT_TOKEN;
  const TG_GROUP = env.TELEGRAM_GROUP_ID;

  console.log('[CRON] Starting checkAllOrders...');

  try {
    const result = await db.prepare(`
      SELECT * FROM orders WHERE status = 'running'
    `).all();

    const orders = (result.results || []) as Order[];
    console.log(`[CRON] Found ${orders.length} running orders`);

    let completedCount = 0;
    const apiErrors: ApiError[] = [];

    for (const order of orders) {
      try {
        const videoId = extractVideoId(order.url as string);
        if (!videoId) continue;

        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`;
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
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

        await db.prepare(`
          UPDATE orders SET view_current = ?, like_current = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(currentView, currentLike, order.id).run();

        try {
          await db.prepare(`
            INSERT INTO order_snapshots (order_id, view_current, like_current, checked_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(order.id, currentView, currentLike).run();
        } catch (e) {
          console.error(`[CRON] Snapshot error for order ${order.id}:`, e);
        }

        const viewTarget = Number(order.view_target) || 0;
        const likeTarget = Number(order.like_target) || 0;
        const viewDone = viewTarget === 0 || currentView >= viewTarget;
        const likeDone = likeTarget === 0 || currentLike >= likeTarget;

        if (viewDone && likeDone && order.notified !== 'yes') {
          await db.prepare(`
            UPDATE orders SET status = 'done', notified = 'yes', completed_at = datetime('now')
            WHERE id = ?
          `).bind(order.id).run();

          let videoTitle = '';
          try {
            const apiUrl2 = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
            const res2 = await fetch(apiUrl2);
            const data2 = await res2.json() as any;
            if (data2.items && data2.items.length > 0) {
              videoTitle = data2.items[0].snippet.title || '';
            }
          } catch (e) {}

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

    try {
      await env.ADMIN_MONITOR_CACHE.put('last_cron_check', new Date().toISOString());
    } catch (e) {
      console.error('[CRON] Failed to save last check time:', e);
    }

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

    try {
      await env.ADMIN_MONITOR_CACHE.put('cron_health', JSON.stringify({
        lastRun: new Date().toISOString(),
        checked: orders.length,
        completed: completedCount,
        errors: apiErrors.length,
      }));
    } catch (e) {}

    // API QUOTA ALERT
    if (apiErrors.length > 0) {
      try {
        const REPORT_TOKEN = env.REPORT_BOT_TOKEN;
        const REPORT_CHAT = env.REPORT_CHAT_ID;
        if (REPORT_TOKEN && REPORT_CHAT) {
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

// ============= STALE ORDERS ALERT =============
export async function checkStaleOrders(env: Bindings) {
  const db = env.DB;
  const REPORT_TOKEN = env.REPORT_BOT_TOKEN;
  const REPORT_CHAT = env.REPORT_CHAT_ID;

  if (!REPORT_TOKEN || !REPORT_CHAT) return;

  try {
    const result = await db.prepare(`
      SELECT * FROM orders 
      WHERE status = 'running' 
      AND created_at < datetime('now', '-48 hours')
    `).all();

    const staleOrders = (result.results || []) as Order[];
    if (staleOrders.length === 0) return;

    const lastStaleAlert = await env.ADMIN_MONITOR_CACHE.get('last_stale_alert');
    const now = new Date();
    
    if (lastStaleAlert) {
      const lastTime = new Date(lastStaleAlert);
      const hoursDiff = (now.getTime() - lastTime.getTime()) / 3600000;
      if (hoursDiff < 6) return;
    }

    let text = `⚠️ <b>งานค้างเกิน 48 ชั่วโมง!</b>\n`;
    text += `📋 พบ <b>${staleOrders.length}</b> งานที่ยังไม่เสร็จ\n\n`;

    for (const order of staleOrders) {
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

// ============= DAILY REPORT (09:00 เวลาไทย) =============
export async function sendDailyReport(env: Bindings) {
  const db = env.DB;
  const REPORT_TOKEN = env.REPORT_BOT_TOKEN;
  const REPORT_CHAT = env.REPORT_CHAT_ID;

  if (!REPORT_TOKEN || !REPORT_CHAT) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const lastReport = await env.ADMIN_MONITOR_CACHE.get('last_daily_report');
    if (lastReport === today) return;

    const running = await db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'running'").first<{ c: number }>();
    const done = await db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'done'").first<{ c: number }>();
    const stale = await db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'running' AND created_at < datetime('now', '-48 hours')").first<{ c: number }>();
    const nearComplete = await db.prepare(`
      SELECT COUNT(*) as c FROM orders WHERE status = 'running'
      AND (
        (view_target > 0 AND like_target > 0 AND 
         CAST(view_current AS REAL)/view_target >= 0.9 AND CAST(like_current AS REAL)/like_target >= 0.9)
        OR (view_target > 0 AND like_target = 0 AND CAST(view_current AS REAL)/view_target >= 0.9)
        OR (view_target = 0 AND like_target > 0 AND CAST(like_current AS REAL)/like_target >= 0.9)
      )
    `).first<{ c: number }>();

    const completedYesterday = await db.prepare(`
      SELECT COUNT(*) as c FROM orders 
      WHERE status = 'done' AND completed_at >= datetime('now', '-24 hours')
    `).first<{ c: number }>();

    const addedYesterday = await db.prepare(`
      SELECT COUNT(*) as c FROM orders 
      WHERE created_at >= datetime('now', '-24 hours')
    `).first<{ c: number }>();

    const todayLogs = await db.prepare(`
      SELECT COUNT(*) as c FROM activity_logs 
      WHERE created_at >= datetime('now', '-24 hours')
    `).first<{ c: number }>();

    const activeUsers = await db.prepare(`
      SELECT COUNT(DISTINCT admin_email) as c FROM activity_logs 
      WHERE created_at >= datetime('now', '-24 hours')
    `).first<{ c: number }>();

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

// ============= CRON HEALTH CHECK =============
export async function cronHealthCheck(env: Bindings) {
  const REPORT_TOKEN = env.REPORT_BOT_TOKEN;
  const REPORT_CHAT = env.REPORT_CHAT_ID;
  if (!REPORT_TOKEN || !REPORT_CHAT) return;

  try {
    const lastCheck = await env.ADMIN_MONITOR_CACHE.get('last_cron_check');
    if (!lastCheck) return;

    const lastTime = new Date(lastCheck);
    const now = new Date();
    const hoursSinceLast = (now.getTime() - lastTime.getTime()) / 3600000;

    if (hoursSinceLast >= 2) {
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
export async function checkEnsembleCredits(env: Bindings) {
  const REPORT_TOKEN = env.REPORT_BOT_TOKEN;
  const REPORT_CHAT = env.REPORT_CHAT_ID;
  const cache = env.ADMIN_MONITOR_CACHE;

  if (!REPORT_TOKEN || !REPORT_CHAT) return;

  const ALERT_THRESHOLD = 10;
  const DAILY_LIMIT = 50;

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

        if (remaining <= 0) {
          alerts.push(`⚠️ ${label}: <b>หมดแล้ว!</b> ระบบจะใช้ Apify แทน (ช้ากว่า)`);
        }
      } catch (e) {
        console.error(`[EnsembleAlert] Error checking ${key}:`, e);
      }
    }

    if (alerts.length === 0) return;

    const alertKey = `ensemble_alert_${today}`;
    const lastAlert = await cache?.get(alertKey);
    
    if (lastAlert) {
      const lastTime = new Date(lastAlert).getTime();
      const now = Date.now();
      if (now - lastTime < 6 * 60 * 60 * 1000) return;
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
