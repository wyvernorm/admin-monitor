import { Hono } from 'hono';
import type { Bindings } from '../types';

export const tiktokRoutes = new Hono<{ Bindings: Bindings }>();

// ============= HELPER FUNCTIONS =============

function cleanTiktokUrl(url: string): string {
  if (url.includes('?')) url = url.split('?')[0];
  if (url.includes('#')) url = url.split('#')[0];
  return url;
}

async function expandTiktokUrl(url: string): Promise<string> {
  url = cleanTiktokUrl(url);
  if (url.includes('tiktok.com/@')) return url;
  if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      const location = response.headers.get('location');
      if (location) return cleanTiktokUrl(location);
    } catch (e) {
      console.error('Error expanding TikTok URL:', e);
    }
  }
  return url;
}

function extractUsername(url: string): string | null {
  const match = url.match(/@([^\/\?]+)/);
  return match ? match[1] : null;
}

// ============= ENSEMBLEDATA API =============

const ENSEMBLE_BASE = 'https://ensembledata.com/apis';

type TiktokStats = {
  views: number;
  likes: number;
  shares: number;
  bookmarks: number;
  comments: number;
  authorFollowers: number;
};

type TiktokUserInfo = {
  username: string;
  nickname: string;
  followers: number;
  profileUrl: string;
};

// ดึงข้อมูลวิดีโอผ่าน EnsembleData (<2 วินาที, 2 units/call)
async function ensemblePostInfo(url: string, token: string): Promise<TiktokStats | null> {
  try {
    const res = await fetch(`${ENSEMBLE_BASE}/tt/post/info?url=${encodeURIComponent(url)}&token=${token}`);
    if (!res.ok) {
      console.error(`[Ensemble] HTTP ${res.status} for ${url}`);
      return null;
    }
    const data = await res.json() as any;
    const item = data?.data?.['0'] || data?.data;
    if (!item || !item.statistics) return null;

    const s = item.statistics;
    const a = item.author || {};
    return {
      views: Number(s.play_count || 0),
      likes: Number(s.digg_count || 0),
      shares: Number(s.share_count || 0),
      bookmarks: Number(s.collect_count || 0),
      comments: Number(s.comment_count || 0),
      authorFollowers: Number(a.follower_count || 0),
    };
  } catch (e) {
    console.error('[Ensemble] Error:', e);
    return null;
  }
}

// ดึง user info ผ่าน EnsembleData
async function ensembleUserInfo(username: string, token: string): Promise<TiktokUserInfo | null> {
  try {
    const res = await fetch(`${ENSEMBLE_BASE}/tt/user/info?username=${encodeURIComponent(username)}&token=${token}`);
    if (!res.ok) return null;
    const data = await res.json() as any;
    const user = data?.data?.user || data?.data?.userInfo?.user || {};
    const stats = data?.data?.stats || data?.data?.userInfo?.stats || {};
    return {
      username: '@' + (user.uniqueId || user.unique_id || username),
      nickname: user.nickname || username,
      followers: Number(stats.followerCount || user.follower_count || 0),
      profileUrl: 'https://www.tiktok.com/@' + (user.uniqueId || user.unique_id || username),
    };
  } catch (e) {
    console.error('[Ensemble] User error:', e);
    return null;
  }
}

// ============= APIFY API (FALLBACK) =============

// ดึงข้อมูลวิดีโอผ่าน Apify (10-30 วินาที, ช้าแต่ไม่จำกัด)
async function apifyPostInfo(url: string, token: string): Promise<TiktokStats | null> {
  try {
    const ACTOR_ID = 'clockworks~tiktok-scraper';
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=120`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postURLs: [url] }),
      }
    );
    const runJson = await runRes.json() as any;
    const datasetId = runJson?.data?.defaultDatasetId;
    if (!datasetId) return null;

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`
    );
    const items = await dataRes.json() as any[];
    if (!items || items.length === 0) return null;

    const item = items[0];
    return {
      views: Number(item.playCount || item.stats?.playCount || 0),
      likes: Number(item.diggCount || item.stats?.diggCount || 0),
      shares: Number(item.shareCount || item.stats?.shareCount || 0),
      bookmarks: Number(item.collectCount || item.stats?.collectCount || 0),
      comments: Number(item.commentCount || item.stats?.commentCount || 0),
      authorFollowers: Number(item.authorMeta?.fans || item.authorMeta?.followerCount || 0),
    };
  } catch (e) {
    console.error('[Apify] Error:', e);
    return null;
  }
}

// ดึง user info ผ่าน Apify
async function apifyUserInfo(username: string, token: string): Promise<TiktokUserInfo | null> {
  try {
    const ACTOR_ID = 'clockworks~tiktok-scraper';
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=120`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profiles: [`https://www.tiktok.com/@${username}`],
          resultsPerPage: 1,
          shouldDownloadCovers: false,
          shouldDownloadVideos: false,
          shouldDownloadSubtitles: false,
        }),
      }
    );
    const runJson = await runRes.json() as any;
    const datasetId = runJson?.data?.defaultDatasetId;
    if (!datasetId) return null;

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`
    );
    const items = await dataRes.json() as any[];
    if (!items || items.length === 0) return null;

    const author = items[0].authorMeta || {};
    return {
      username: '@' + username,
      nickname: author.name || author.nickName || username,
      followers: Number(author.fans || 0),
      profileUrl: 'https://www.tiktok.com/@' + username,
    };
  } catch (e) {
    console.error('[Apify] User error:', e);
    return null;
  }
}

// ============= SMART CACHE CONFIG =============
// Ensemble แพง (2 units/call) → cache นานขึ้น 30 นาที
// Apify ช้าแต่ถูกกว่า → cache 10 นาที
const CACHE_TTL_ENSEMBLE = 1800; // 30 นาที
const CACHE_TTL_APIFY = 600;    // 10 นาที

// Log API source ไป KV (ไม่ block response)
async function logApiSource(cache: KVNamespace | undefined, platform: string, endpoint: string, source: string, responseTime: number) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const logKey = `api_source_log_${today}`;
    const existing = await cache?.get(logKey);
    const logs: any[] = existing ? JSON.parse(existing) : [];
    logs.push({ platform, endpoint, source, responseTime, timestamp: new Date().toISOString() });
    await cache?.put(logKey, JSON.stringify(logs), { expirationTtl: 604800 });
  } catch (e) {
    console.error('[LogSource] Error:', e);
  }
}

// ============= SMART FETCH: Ensemble ก่อน → Apify ถ้าล้มเหลว =============

async function smartFetchPost(url: string, ensembleToken: string, apifyToken: string): Promise<{ stats: TiktokStats; source: string } | null> {
  // ลอง EnsembleData ก่อน (เร็ว)
  if (ensembleToken) {
    const stats = await ensemblePostInfo(url, ensembleToken);
    if (stats) return { stats, source: 'ensemble' };
    console.log('[SmartFetch] Ensemble failed, falling back to Apify...');
  }

  // Fallback ไป Apify (ช้าแต่เสถียร)
  if (apifyToken) {
    const stats = await apifyPostInfo(url, apifyToken);
    if (stats) return { stats, source: 'apify' };
  }

  return null;
}

async function smartFetchUser(username: string, ensembleToken: string, apifyToken: string): Promise<{ user: TiktokUserInfo; source: string } | null> {
  if (ensembleToken) {
    const user = await ensembleUserInfo(username, ensembleToken);
    if (user) return { user, source: 'ensemble' };
    console.log('[SmartFetch] Ensemble user failed, falling back to Apify...');
  }

  if (apifyToken) {
    const user = await apifyUserInfo(username, apifyToken);
    if (user) return { user, source: 'apify' };
  }

  return null;
}

// ============= GET TIKTOK STATS =============
tiktokRoutes.post('/stats', async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) return c.json({ error: 'URL is required' }, 400);

    const ensembleToken = c.env.ENSEMBLE_TOKEN;
    const apifyToken = c.env.APIFY_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    const fullUrl = await expandTiktokUrl(url);

    // Check cache
    const cacheKey = `tiktok_${btoa(fullUrl).substring(0, 50)}`;
    const cached = await cache?.get(cacheKey);
    if (cached) return c.json({ ...JSON.parse(cached), fromCache: true, url: fullUrl });

    // Smart fetch
    const startTime = Date.now();
    const result = await smartFetchPost(fullUrl, ensembleToken, apifyToken);
    if (!result) return c.json({ error: 'ไม่สามารถดึงข้อมูลได้ ลองใหม่อีกครั้ง' }, 500);
    const elapsed = Date.now() - startTime;

    // Smart cache: Ensemble แพง → cache นาน, Apify ถูก → cache สั้น
    const ttl = result.source === 'ensemble' ? CACHE_TTL_ENSEMBLE : CACHE_TTL_APIFY;
    await cache?.put(cacheKey, JSON.stringify(result.stats), { expirationTtl: ttl });

    // Log source (non-blocking)
    logApiSource(cache, 'tiktok', '/stats', result.source, elapsed);

    return c.json({ stats: result.stats, url: fullUrl, source: result.source });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GET TIKTOK FOLLOWER =============
tiktokRoutes.post('/follower', async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) return c.json({ error: 'URL or username is required' }, 400);

    const ensembleToken = c.env.ENSEMBLE_TOKEN;
    const apifyToken = c.env.APIFY_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    let username = url;
    if (url.includes('tiktok.com/@')) username = extractUsername(url) || url;
    else if (url.startsWith('@')) username = url.substring(1);

    const cacheKey = `tiktok_follower_${btoa(username).substring(0, 50)}`;
    const cached = await cache?.get(cacheKey);
    if (cached) return c.json({ ...JSON.parse(cached), fromCache: true });

    const startTime = Date.now();
    const result = await smartFetchUser(username, ensembleToken, apifyToken);
    if (!result) return c.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, 404);
    const elapsed = Date.now() - startTime;

    const ttl = result.source === 'ensemble' ? CACHE_TTL_ENSEMBLE : CACHE_TTL_APIFY;
    await cache?.put(cacheKey, JSON.stringify(result.user), { expirationTtl: ttl });
    logApiSource(cache, 'tiktok', '/follower', result.source, elapsed);

    return c.json({ ...result.user, source: result.source });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GENERATE SINGLE SUMMARY =============
tiktokRoutes.post('/summary', async (c) => {
  try {
    const { urls, type, subType, amount } = await c.req.json();
    if (!urls || !type || !amount) return c.json({ error: 'Missing required fields' }, 400);

    const ensembleToken = c.env.ENSEMBLE_TOKEN;
    const apifyToken = c.env.APIFY_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    const urlList = urls.split('\n').map((u: string) => u.trim()).filter((u: string) => u);
    const results: any[] = [];

    for (const url of urlList) {
      const fullUrl = await expandTiktokUrl(url);
      const cacheKey = `tiktok_${btoa(fullUrl).substring(0, 50)}`;
      let stats: any;

      const cached = await cache?.get(cacheKey);
      if (cached) {
        stats = JSON.parse(cached);
      } else {
        const result = await smartFetchPost(fullUrl, ensembleToken, apifyToken);
        if (result) {
          stats = result.stats;
          await cache?.put(cacheKey, JSON.stringify(stats), { expirationTtl: CACHE_TTL_ENSEMBLE });
        }
      }

      if (stats) results.push({ url: fullUrl, stats });
    }

    const typeLabels: Record<string, string> = { 'view': 'วิว', 'like': 'ไลค์', 'share': 'แชร์', 'save': 'เซฟ' };
    const subTypeLabels: Record<string, string> = { 'mix': 'คละประเทศ', 'th': '#TH (ไทย)', 'normal': '#1 (ปกติ)', 'hq': '#HQ' };

    let text = `🎵 TikTok - ${typeLabels[type] || type} ${subTypeLabels[subType] || ''}\n\n`;
    for (const r of results) {
      const startValue = type === 'view' ? r.stats.views : type === 'like' ? r.stats.likes : type === 'share' ? r.stats.shares : r.stats.bookmarks;
      const targetValue = startValue + Number(amount);
      text += `🔗 ${r.url}\n`;
      text += `📊 ${typeLabels[type]}เริ่มต้น: ${startValue.toLocaleString()}\n`;
      text += `➕ เพิ่ม: +${Number(amount).toLocaleString()}\n`;
      text += `🎯 เป้าหมาย: ${targetValue.toLocaleString()}\n\n`;
    }

    return c.json({ platform: 'TikTok', type: typeLabels[type], subType: subTypeLabels[subType], amount: Number(amount), results, text });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GENERATE ALL-IN-ONE SUMMARY =============
tiktokRoutes.post('/summary-all', async (c) => {
  try {
    const { urls, items } = await c.req.json();
    if (!urls || !items || items.length === 0) return c.json({ error: 'Missing required fields' }, 400);

    const ensembleToken = c.env.ENSEMBLE_TOKEN;
    const apifyToken = c.env.APIFY_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    const urlList = urls.split('\n').map((u: string) => u.trim()).filter((u: string) => u);
    const results: any[] = [];

    for (const url of urlList) {
      const fullUrl = await expandTiktokUrl(url);
      const cacheKey = `tiktok_${btoa(fullUrl).substring(0, 50)}`;
      let stats: any;

      const cached = await cache?.get(cacheKey);
      if (cached) {
        stats = JSON.parse(cached);
      } else {
        const result = await smartFetchPost(fullUrl, ensembleToken, apifyToken);
        if (result) {
          stats = result.stats;
          await cache?.put(cacheKey, JSON.stringify(stats), { expirationTtl: CACHE_TTL_ENSEMBLE });
        }
      }

      if (stats) results.push({ url: fullUrl, stats });
    }

    const subTypeLabels: Record<string, string> = { 'mix': 'คละประเทศ', 'th': '#TH (ไทย)', 'normal': '#1 (ปกติ)', 'hq': '#HQ' };
    let text = `🎁 TikTok - สรุปงานแบบรวม\n\n`;

    for (const r of results) {
      text += `🔗 ${r.url}\n\n`;
      for (const item of items) {
        if (!item.enabled || !item.amount) continue;
        const typeLabel = item.type === 'view' ? 'วิว' : item.type === 'like' ? 'ไลค์' : item.type === 'share' ? 'แชร์' : item.type === 'save' ? 'เซฟ' : item.type === 'follower' ? 'Follower' : item.type;
        const startValue = item.type === 'view' ? r.stats.views : item.type === 'like' ? r.stats.likes : item.type === 'share' ? r.stats.shares : item.type === 'save' ? r.stats.bookmarks : item.type === 'follower' ? r.stats.authorFollowers : 0;
        const targetValue = startValue + Number(item.amount);
        text += `📊 ${typeLabel} ${subTypeLabels[item.subType] || ''}\n`;
        text += `   เริ่มต้น: ${startValue.toLocaleString()}\n`;
        text += `   ➕ เพิ่ม: +${Number(item.amount).toLocaleString()}\n`;
        text += `   🎯 เป้าหมาย: ${targetValue.toLocaleString()}\n\n`;
      }
    }

    return c.json({ platform: 'TikTok', type: 'All-in-One', items, results, text });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GENERATE FOLLOWER SUMMARY =============
tiktokRoutes.post('/follower-summary', async (c) => {
  try {
    const { urls, type, amount } = await c.req.json();
    if (!urls || !amount) return c.json({ error: 'Missing required fields' }, 400);

    const ensembleToken = c.env.ENSEMBLE_TOKEN;
    const apifyToken = c.env.APIFY_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    const urlList = urls.split('\n').map((u: string) => u.trim()).filter((u: string) => u);
    const results: any[] = [];

    for (const url of urlList) {
      let username = url;
      if (url.includes('tiktok.com/@')) username = extractUsername(url) || url;
      else if (url.startsWith('@')) username = url.substring(1);

      const cacheKey = `tiktok_follower_${btoa(username).substring(0, 50)}`;
      let followerData: any;

      const cached = await cache?.get(cacheKey);
      if (cached) {
        followerData = JSON.parse(cached);
      } else {
        const result = await smartFetchUser(username, ensembleToken, apifyToken);
        if (result) {
          followerData = result.user;
          await cache?.put(cacheKey, JSON.stringify(followerData), { expirationTtl: CACHE_TTL_ENSEMBLE });
        }
      }

      if (followerData) results.push(followerData);
    }

    const typeLabels: Record<string, string> = { 'normal': '#1 (ปกติ)', 'hq': '#HQ', 'th': '#TH (ไทย)' };
    let text = `👥 TikTok - Follower ${typeLabels[type] || ''}\n\n`;

    for (const r of results) {
      const targetFollowers = r.followers + Number(amount);
      text += `🔗 ${r.profileUrl}\n`;
      text += `👤 ${r.nickname}\n`;
      text += `👥 ผู้ติดตามเริ่มต้น: ${r.followers.toLocaleString()}\n`;
      text += `➕ เพิ่ม: +${Number(amount).toLocaleString()}\n`;
      text += `🎯 เป้าหมาย: ${targetFollowers.toLocaleString()}\n\n`;
    }

    return c.json({ platform: 'TikTok', type: 'Follower', subType: typeLabels[type], amount: Number(amount), results, text });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= CLEAR CACHE =============
tiktokRoutes.post('/clear-cache', async (c) => {
  try {
    const { url } = await c.req.json();
    const cache = c.env.ADMIN_MONITOR_CACHE;
    if (url) {
      const fullUrl = await expandTiktokUrl(url);
      const cacheKey = `tiktok_${btoa(fullUrl).substring(0, 50)}`;
      await cache?.delete(cacheKey);
      const username = extractUsername(fullUrl);
      if (username) {
        const followerKey = `tiktok_follower_${btoa(username).substring(0, 50)}`;
        await cache?.delete(followerKey);
      }
    }
    return c.json({ success: true, message: 'Cache cleared' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
