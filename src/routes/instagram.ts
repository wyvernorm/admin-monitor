import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  APIFY3_TOKEN: string;
  ENSEMBLE_IG_TOKEN: string;
  ADMIN_MONITOR_CACHE: KVNamespace;
};

export const instagramRoutes = new Hono<{ Bindings: Bindings }>();

// ============= HELPER FUNCTIONS =============

function extractInstagramUsername(url: string): string {
  const match = url.match(/instagram\.com\/([^\/\?]+)/);
  return match ? match[1] : url;
}

function isProfileUrl(url: string): boolean {
  return !url.includes('/p/') && 
         !url.includes('/reel/') && 
         !url.includes('/stories/') &&
         !url.includes('/tv/');
}

function extractPostShortcode(url: string): string | null {
  const match = url.match(/\/(p|reel|tv)\/([^\/\?]+)/);
  return match ? match[2] : null;
}

// ============= TYPES =============

type IgPostStats = {
  likes: number;
  comments: number;
  views: number;
};

type IgProfileStats = {
  username: string;
  fullName: string;
  followers: number;
  following: number;
  posts: number;
  profileUrl: string;
};

// ============= ENSEMBLEDATA API =============
// Endpoint ใช้ shortcode (code) ไม่ใช่ URL
// Response structure (ทดสอบแล้ว):
//   likes    → data.edge_media_preview_like.count
//   comments → data.edge_media_to_parent_comment.count
//   views    → data.video_play_count (Reel/Video) หรือ data.play_count

const ENSEMBLE_BASE = 'https://ensembledata.com/apis';

async function ensemblePostInfo(shortcode: string, token: string): Promise<IgPostStats | null> {
  try {
    const res = await fetch(`${ENSEMBLE_BASE}/instagram/post/details?code=${encodeURIComponent(shortcode)}&token=${token}`);
    if (!res.ok) {
      console.error(`[Ensemble IG] HTTP ${res.status} for ${shortcode}`);
      return null;
    }
    const json = await res.json() as any;
    const d = json?.data;
    if (!d) return null;

    return {
      likes: Number(d.edge_media_preview_like?.count ?? 0),
      comments: Number(d.edge_media_to_parent_comment?.count ?? d.edge_media_preview_comment?.count ?? 0),
      views: Number(d.video_play_count ?? d.play_count ?? d.video_view_count ?? 0),
    };
  } catch (e) {
    console.error('[Ensemble IG] Post error:', e);
    return null;
  }
}

async function ensembleUserInfo(username: string, token: string): Promise<IgProfileStats | null> {
  try {
    const res = await fetch(`${ENSEMBLE_BASE}/instagram/user/info?username=${encodeURIComponent(username)}&token=${token}`);
    if (!res.ok) {
      console.error(`[Ensemble IG] User HTTP ${res.status} for ${username}`);
      return null;
    }
    const json = await res.json() as any;
    const d = json?.data;
    if (!d) return null;

    return {
      username: d.username || username,
      fullName: d.full_name || '',
      followers: Number(d.follower_count ?? d.edge_followed_by?.count ?? 0),
      following: Number(d.following_count ?? d.edge_follow?.count ?? 0),
      posts: Number(d.media_count ?? d.edge_owner_to_timeline_media?.count ?? 0),
      profileUrl: `https://www.instagram.com/${d.username || username}/`,
    };
  } catch (e) {
    console.error('[Ensemble IG] User error:', e);
    return null;
  }
}

// ============= APIFY API (FALLBACK) =============

async function apifyPostInfo(url: string, token: string): Promise<IgPostStats | null> {
  try {
    const ACTOR_ID = 'apify~instagram-scraper';
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=120`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directUrls: [url],
          resultsType: 'posts',
          resultsLimit: 1,
          searchType: 'hashtag',
          searchLimit: 1,
        }),
      }
    );
    const runJson = await runRes.json() as any;
    const datasetId = runJson?.data?.defaultDatasetId;
    if (!datasetId) return null;

    await new Promise(resolve => setTimeout(resolve, 8000));

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
    );
    const items = await dataRes.json() as any[];
    if (!items || items.length === 0) return null;

    const item = items[0];
    return {
      likes: Number(item.likesCount || item.likes || 0),
      comments: Number(item.commentsCount || item.comments || 0),
      views: Number(item.videoViewCount || item.videoPlayCount || item.views || 0),
    };
  } catch (e) {
    console.error('[Apify IG] Post error:', e);
    return null;
  }
}

async function apifyUserInfo(username: string, token: string): Promise<IgProfileStats | null> {
  try {
    const ACTOR_ID = 'apify~instagram-profile-scraper';
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=180`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernames: [username],
          resultsLimit: 1,
        }),
      }
    );
    const runJson = await runRes.json() as any;
    const datasetId = runJson?.data?.defaultDatasetId;
    if (!datasetId) return null;

    await new Promise(resolve => setTimeout(resolve, 3000));

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
    );
    const items = await dataRes.json() as any[];
    if (!items || items.length === 0) return null;

    const item = items[0];
    return {
      username: item.username || username,
      fullName: item.fullName || '',
      followers: Number(item.followersCount || item.followers || 0),
      following: Number(item.followingCount || item.following || 0),
      posts: Number(item.postsCount || item.posts || 0),
      profileUrl: `https://www.instagram.com/${item.username || username}/`,
    };
  } catch (e) {
    console.error('[Apify IG] User error:', e);
    return null;
  }
}

// ============= SMART FETCH: Ensemble ก่อน → Apify fallback =============

async function smartFetchPost(url: string, shortcode: string, ensembleToken: string, apifyToken: string): Promise<{ stats: IgPostStats; source: string } | null> {
  // Ensemble ใช้ shortcode
  if (ensembleToken && shortcode) {
    const stats = await ensemblePostInfo(shortcode, ensembleToken);
    if (stats) return { stats, source: 'ensemble' };
    console.log('[SmartFetch IG] Ensemble failed, falling back to Apify...');
  }
  // Apify ใช้ full URL
  if (apifyToken) {
    const stats = await apifyPostInfo(url, apifyToken);
    if (stats) return { stats, source: 'apify' };
  }
  return null;
}

async function smartFetchUser(username: string, ensembleToken: string, apifyToken: string): Promise<{ user: IgProfileStats; source: string } | null> {
  if (ensembleToken) {
    const user = await ensembleUserInfo(username, ensembleToken);
    if (user) return { user, source: 'ensemble' };
    console.log('[SmartFetch IG] Ensemble user failed, falling back to Apify...');
  }
  if (apifyToken) {
    const user = await apifyUserInfo(username, apifyToken);
    if (user) return { user, source: 'apify' };
  }
  return null;
}

// ============= GET INSTAGRAM STATS =============
instagramRoutes.post('/stats', async (c) => {
  try {
    let { url } = await c.req.json();
    if (!url) return c.json({ error: 'URL is required' }, 400);

    const ensembleToken = c.env.ENSEMBLE_IG_TOKEN;
    const apifyToken = c.env.APIFY3_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    if (isProfileUrl(url)) {
      return getInstagramProfileStats(url, ensembleToken, apifyToken, cache, c);
    }
    return getInstagramPostStats(url, ensembleToken, apifyToken, cache, c);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GET POST STATS =============
async function getInstagramPostStats(url: string, ensembleToken: string, apifyToken: string, cache: KVNamespace | undefined, c: any) {
  // Ensemble ต้องการ shortcode — ดึงจาก /p/ หรือ /reel/
  const shortcode = extractPostShortcode(url);
  if (!shortcode) return c.json({ error: 'Invalid Instagram post URL' }, 400);

  const cacheKey = `ig_post_${shortcode}`;
  const cached = await cache?.get(cacheKey);
  if (cached) return c.json({ ...JSON.parse(cached), fromCache: true, url });

  const result = await smartFetchPost(url, shortcode, ensembleToken, apifyToken);
  if (!result) return c.json({ error: 'ไม่พบข้อมูลโพสต์ - อาจเป็นโพสต์ส่วนตัว' }, 404);

  const data = { type: 'post', stats: result.stats };
  await cache?.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 });

  return c.json({ ...data, url, source: result.source });
}

// ============= GET PROFILE STATS =============
async function getInstagramProfileStats(url: string, ensembleToken: string, apifyToken: string, cache: KVNamespace | undefined, c: any) {
  const username = extractInstagramUsername(url);

  const cacheKey = `ig_profile_${username}`;
  const cached = await cache?.get(cacheKey);
  if (cached) return c.json({ ...JSON.parse(cached), fromCache: true });

  const result = await smartFetchUser(username, ensembleToken, apifyToken);
  if (!result) return c.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, 404);

  const data = { type: 'profile', ...result.user };
  await cache?.put(cacheKey, JSON.stringify(data), { expirationTtl: 1800 });

  return c.json({ ...data, source: result.source });
}

// ============= GENERATE SINGLE SUMMARY =============
instagramRoutes.post('/summary', async (c) => {
  try {
    const { url, type, packageKey, amount, startValue } = await c.req.json();
    if (!url || !type) return c.json({ error: 'Missing required fields' }, 400);

    const cache = c.env.ADMIN_MONITOR_CACHE;

    const typeConfig: Record<string, { field: string; label: string; labelTh: string }> = {
      'like-1': { field: 'likes', label: 'Like #1', labelTh: '📷 Like #1' },
      'like-2': { field: 'likes', label: 'Like #2', labelTh: '📷 Like #2' },
      'like-th': { field: 'likes', label: 'Like TH', labelTh: '📷 Like #TH' },
      'follower-1': { field: 'followers', label: 'Follower #1', labelTh: '📷 Follower #1' },
      'follower-2': { field: 'followers', label: 'Follower #2', labelTh: '📷 Follower #2' },
      'follower-3': { field: 'followers', label: 'Follower #3', labelTh: '📷 Follower #3' },
      'follower-ads': { field: 'followers', label: 'Follower #ADS', labelTh: '📷 Follower #ADS' },
      'follower-th': { field: 'followers', label: 'Follower TH', labelTh: '📷 Follower #TH' },
      'view': { field: 'views', label: 'View / Reel', labelTh: '📷 View / Reel' },
    };

    const config = typeConfig[type];
    if (!config) return c.json({ error: 'Invalid type' }, 400);

    let currentValue = startValue;

    if (currentValue === undefined || currentValue === null) {
      if (isProfileUrl(url)) {
        const username = extractInstagramUsername(url);
        const cached = await cache?.get(`ig_profile_${username}`);
        if (cached) currentValue = JSON.parse(cached)[config.field] || 0;
      } else {
        const shortcode = extractPostShortcode(url);
        if (shortcode) {
          const cached = await cache?.get(`ig_post_${shortcode}`);
          if (cached) {
            const data = JSON.parse(cached);
            currentValue = data.stats?.[config.field] ?? data[config.field] ?? 0;
          }
        }
      }
    }

    currentValue = currentValue || 0;
    const addAmount = amount || Number(packageKey) || 0;
    const targetValue = currentValue + addAmount;

    const text = `${config.labelTh}
🔗 ${url}

📊 เริ่มต้น: ${currentValue.toLocaleString()}
➕ เพิ่ม: +${addAmount.toLocaleString()}
🎯 เป้าหมาย: ${targetValue.toLocaleString()}`;

    return c.json({
      platform: 'Instagram',
      type: config.label,
      typeTh: config.labelTh,
      url,
      startValue: currentValue,
      amount: addAmount,
      targetValue,
      text,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GENERATE BATCH SUMMARY =============
instagramRoutes.post('/batch-summary', async (c) => {
  try {
    const { url, items } = await c.req.json();
    if (!url || !items || items.length === 0) return c.json({ error: 'Missing required fields' }, 400);

    const cache = c.env.ADMIN_MONITOR_CACHE;
    let stats: any = {};

    if (isProfileUrl(url)) {
      const username = extractInstagramUsername(url);
      const cached = await cache?.get(`ig_profile_${username}`);
      if (cached) stats = JSON.parse(cached);
    } else {
      const shortcode = extractPostShortcode(url);
      if (shortcode) {
        const cached = await cache?.get(`ig_post_${shortcode}`);
        if (cached) {
          const data = JSON.parse(cached);
          stats = data.stats || data;
        }
      }
    }

    const typeLabels: Record<string, { field: string; labelTh: string }> = {
      'like': { field: 'likes', labelTh: 'ไลค์' },
      'view': { field: 'views', labelTh: 'วิว' },
      'follower': { field: 'followers', labelTh: 'ผู้ติดตาม' },
      'comment': { field: 'comments', labelTh: 'คอมเมนต์' },
    };

    let text = `📋 Instagram - สรุปงานหลายรายการ
🔗 ${url}

`;

    const summaryItems: any[] = [];

    for (const item of items) {
      if (!item.type || !item.amount) continue;
      const config = typeLabels[item.type];
      if (!config) continue;

      const startValue = item.startValue || stats[config.field] || 0;
      const targetValue = startValue + Number(item.amount);

      text += `📊 ${config.labelTh} ${item.subType ? `(${item.subType})` : ''}
   เริ่มต้น: ${startValue.toLocaleString()}
   ➕ เพิ่ม: +${Number(item.amount).toLocaleString()}
   🎯 เป้าหมาย: ${targetValue.toLocaleString()}

`;

      summaryItems.push({
        type: item.type,
        subType: item.subType,
        startValue,
        amount: Number(item.amount),
        targetValue,
      });
    }

    return c.json({ platform: 'Instagram', type: 'Batch', url, stats, items: summaryItems, text });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= CLEAR CACHE =============
instagramRoutes.post('/clear-cache', async (c) => {
  try {
    const { url } = await c.req.json();
    const cache = c.env.ADMIN_MONITOR_CACHE;
    if (url) {
      if (isProfileUrl(url)) {
        const username = extractInstagramUsername(url);
        await cache?.delete(`ig_profile_${username}`);
      } else {
        const shortcode = extractPostShortcode(url);
        if (shortcode) await cache?.delete(`ig_post_${shortcode}`);
      }
    }
    return c.json({ success: true, message: 'Cache cleared' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
