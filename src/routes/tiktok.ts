import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  APIFY_TOKEN: string;
  ENSEMBLE_TOKEN: string;
  ADMIN_MONITOR_CACHE: KVNamespace;
};

export const tiktokRoutes = new Hono<{ Bindings: Bindings }>();

// ============= HELPER FUNCTIONS =============

function cleanTiktokUrl(url: string): string {
  if (url.includes('?')) {
    url = url.split('?')[0];
  }
  if (url.includes('#')) {
    url = url.split('#')[0];
  }
  return url;
}

async function expandTiktokUrl(url: string): Promise<string> {
  url = cleanTiktokUrl(url);

  if (url.includes('tiktok.com/@')) {
    return url;
  }

  // Short links need expansion
  if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      const location = response.headers.get('location');
      if (location) {
        return cleanTiktokUrl(location);
      }
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

// ============= ENSEMBLEDATA API HELPERS =============

const ENSEMBLE_BASE = 'https://ensembledata.com/apis';

// ดึงข้อมูลวิดีโอ TikTok ผ่าน EnsembleData (เร็ว <2 วินาที)
async function fetchTiktokPostInfo(url: string, token: string): Promise<{
  views: number;
  likes: number;
  shares: number;
  bookmarks: number;
  comments: number;
  authorFollowers: number;
  nickname: string;
  username: string;
} | null> {
  try {
    const apiUrl = `${ENSEMBLE_BASE}/tt/post/info?url=${encodeURIComponent(url)}&token=${token}`;
    const res = await fetch(apiUrl);
    
    if (!res.ok) {
      console.error(`[EnsembleData] HTTP ${res.status} for ${url}`);
      return null;
    }

    const data = await res.json() as any;
    
    // Response structure: data["0"].statistics / data["0"].author
    const item = data?.data?.['0'] || data?.data;
    if (!item) return null;

    const stats = item.statistics || {};
    const author = item.author || {};

    return {
      views: Number(stats.play_count || 0),
      likes: Number(stats.digg_count || 0),
      shares: Number(stats.share_count || 0),
      bookmarks: Number(stats.collect_count || 0),
      comments: Number(stats.comment_count || 0),
      authorFollowers: Number(author.follower_count || 0),
      nickname: author.nickname || '',
      username: author.unique_id || '',
    };
  } catch (e) {
    console.error('[EnsembleData] Fetch error:', e);
    return null;
  }
}

// ดึงข้อมูล user TikTok ผ่าน EnsembleData
async function fetchTiktokUserInfo(username: string, token: string): Promise<{
  followers: number;
  nickname: string;
  username: string;
} | null> {
  try {
    const apiUrl = `${ENSEMBLE_BASE}/tt/user/info?username=${encodeURIComponent(username)}&token=${token}`;
    const res = await fetch(apiUrl);
    
    if (!res.ok) {
      console.error(`[EnsembleData] User HTTP ${res.status} for ${username}`);
      return null;
    }

    const data = await res.json() as any;
    const user = data?.data?.user || data?.data?.userInfo?.user || {};
    const userStats = data?.data?.stats || data?.data?.userInfo?.stats || {};

    return {
      followers: Number(userStats.followerCount || user.follower_count || 0),
      nickname: user.nickname || user.uniqueId || username,
      username: user.uniqueId || user.unique_id || username,
    };
  } catch (e) {
    console.error('[EnsembleData] User fetch error:', e);
    return null;
  }
}

// ============= GET TIKTOK STATS =============
tiktokRoutes.post('/stats', async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    const token = c.env.ENSEMBLE_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    // Expand short URL
    const fullUrl = await expandTiktokUrl(url);

    // Check cache
    const cacheKey = `tiktok_${btoa(fullUrl).substring(0, 50)}`;
    const cached = await cache?.get(cacheKey);
    if (cached) {
      return c.json({ ...JSON.parse(cached), fromCache: true, url: fullUrl });
    }

    // Call EnsembleData
    const postInfo = await fetchTiktokPostInfo(fullUrl, token);
    
    if (!postInfo) {
      return c.json({ error: 'ไม่สามารถดึงข้อมูลได้ ลองใหม่อีกครั้ง' }, 500);
    }

    const result = {
      views: postInfo.views,
      likes: postInfo.likes,
      shares: postInfo.shares,
      bookmarks: postInfo.bookmarks,
      comments: postInfo.comments,
      authorFollowers: postInfo.authorFollowers,
    };

    // Cache for 5 minutes
    await cache?.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });

    return c.json({ stats: result, url: fullUrl });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GET TIKTOK FOLLOWER =============
tiktokRoutes.post('/follower', async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) {
      return c.json({ error: 'URL or username is required' }, 400);
    }

    const token = c.env.ENSEMBLE_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    // Extract username
    let username = url;
    if (url.includes('tiktok.com/@')) {
      username = extractUsername(url) || url;
    } else if (url.startsWith('@')) {
      username = url.substring(1);
    }

    // Check cache
    const cacheKey = `tiktok_follower_${btoa(username).substring(0, 50)}`;
    const cached = await cache?.get(cacheKey);
    if (cached) {
      return c.json({ ...JSON.parse(cached), fromCache: true });
    }

    // Call EnsembleData User Info
    const userInfo = await fetchTiktokUserInfo(username, token);

    if (!userInfo) {
      return c.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, 404);
    }

    const result = {
      username: '@' + username,
      profileUrl: 'https://www.tiktok.com/@' + username,
      followers: userInfo.followers,
      nickname: userInfo.nickname,
    };

    // Cache for 5 minutes
    await cache?.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GENERATE SINGLE SUMMARY =============
tiktokRoutes.post('/summary', async (c) => {
  try {
    const { urls, type, subType, amount } = await c.req.json();

    if (!urls || !type || !amount) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const token = c.env.ENSEMBLE_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    // Process multiple URLs
    const urlList = urls.split('\n').map((u: string) => u.trim()).filter((u: string) => u);
    const results: any[] = [];

    for (const url of urlList) {
      const fullUrl = await expandTiktokUrl(url);

      // Check cache
      const cacheKey = `tiktok_${btoa(fullUrl).substring(0, 50)}`;
      let stats: any;

      const cached = await cache?.get(cacheKey);
      if (cached) {
        stats = JSON.parse(cached);
      } else {
        const postInfo = await fetchTiktokPostInfo(fullUrl, token);
        if (postInfo) {
          stats = {
            views: postInfo.views,
            likes: postInfo.likes,
            shares: postInfo.shares,
            bookmarks: postInfo.bookmarks,
          };
          await cache?.put(cacheKey, JSON.stringify(stats), { expirationTtl: 300 });
        }
      }

      if (stats) {
        results.push({ url: fullUrl, stats });
      }
    }

    // Build summary
    const typeLabels: Record<string, string> = {
      'view': 'วิว',
      'like': 'ไลค์',
      'share': 'แชร์',
      'save': 'เซฟ',
    };

    const subTypeLabels: Record<string, string> = {
      'mix': 'คละประเทศ',
      'th': '#TH (ไทย)',
      'normal': '#1 (ปกติ)',
      'hq': '#HQ',
    };

    let text = `🎵 TikTok - ${typeLabels[type] || type} ${subTypeLabels[subType] || ''}\n\n`;

    for (const r of results) {
      const startValue = type === 'view' ? r.stats.views :
                         type === 'like' ? r.stats.likes :
                         type === 'share' ? r.stats.shares :
                         r.stats.bookmarks;

      const targetValue = startValue + Number(amount);

      text += `🔗 ${r.url}\n`;
      text += `📊 ${typeLabels[type]}เริ่มต้น: ${startValue.toLocaleString()}\n`;
      text += `➕ เพิ่ม: +${Number(amount).toLocaleString()}\n`;
      text += `🎯 เป้าหมาย: ${targetValue.toLocaleString()}\n\n`;
    }

    return c.json({
      platform: 'TikTok',
      type: typeLabels[type],
      subType: subTypeLabels[subType],
      amount: Number(amount),
      results,
      text,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GENERATE ALL-IN-ONE SUMMARY =============
tiktokRoutes.post('/summary-all', async (c) => {
  try {
    const { urls, items } = await c.req.json();

    if (!urls || !items || items.length === 0) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const token = c.env.ENSEMBLE_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    // Process URLs
    const urlList = urls.split('\n').map((u: string) => u.trim()).filter((u: string) => u);
    const results: any[] = [];

    for (const url of urlList) {
      const fullUrl = await expandTiktokUrl(url);

      // Check cache
      const cacheKey = `tiktok_${btoa(fullUrl).substring(0, 50)}`;
      let stats: any;

      const cached = await cache?.get(cacheKey);
      if (cached) {
        stats = JSON.parse(cached);
      } else {
        const postInfo = await fetchTiktokPostInfo(fullUrl, token);
        if (postInfo) {
          stats = {
            views: postInfo.views,
            likes: postInfo.likes,
            shares: postInfo.shares,
            bookmarks: postInfo.bookmarks,
            authorFollowers: postInfo.authorFollowers,
          };
          await cache?.put(cacheKey, JSON.stringify(stats), { expirationTtl: 300 });
        }
      }

      if (stats) {
        results.push({ url: fullUrl, stats });
      }
    }

    // Build all-in-one summary
    const subTypeLabels: Record<string, string> = {
      'mix': 'คละประเทศ',
      'th': '#TH (ไทย)',
      'normal': '#1 (ปกติ)',
      'hq': '#HQ',
    };

    let text = `🎁 TikTok - สรุปงานแบบรวม\n\n`;

    for (const r of results) {
      text += `🔗 ${r.url}\n\n`;

      for (const item of items) {
        if (!item.enabled || !item.amount) continue;

        const typeLabel = item.type === 'view' ? 'วิว' :
                          item.type === 'like' ? 'ไลค์' :
                          item.type === 'share' ? 'แชร์' :
                          item.type === 'save' ? 'เซฟ' :
                          item.type === 'follower' ? 'Follower' : item.type;

        const startValue = item.type === 'view' ? r.stats.views :
                           item.type === 'like' ? r.stats.likes :
                           item.type === 'share' ? r.stats.shares :
                           item.type === 'save' ? r.stats.bookmarks :
                           item.type === 'follower' ? r.stats.authorFollowers : 0;

        const targetValue = startValue + Number(item.amount);

        text += `📊 ${typeLabel} ${subTypeLabels[item.subType] || ''}\n`;
        text += `   เริ่มต้น: ${startValue.toLocaleString()}\n`;
        text += `   ➕ เพิ่ม: +${Number(item.amount).toLocaleString()}\n`;
        text += `   🎯 เป้าหมาย: ${targetValue.toLocaleString()}\n\n`;
      }
    }

    return c.json({
      platform: 'TikTok',
      type: 'All-in-One',
      items,
      results,
      text,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GENERATE FOLLOWER SUMMARY =============
tiktokRoutes.post('/follower-summary', async (c) => {
  try {
    const { urls, type, amount } = await c.req.json();

    if (!urls || !amount) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const token = c.env.ENSEMBLE_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    // Process URLs/usernames
    const urlList = urls.split('\n').map((u: string) => u.trim()).filter((u: string) => u);
    const results: any[] = [];

    for (const url of urlList) {
      let username = url;
      if (url.includes('tiktok.com/@')) {
        username = extractUsername(url) || url;
      } else if (url.startsWith('@')) {
        username = url.substring(1);
      }

      // Check cache
      const cacheKey = `tiktok_follower_${btoa(username).substring(0, 50)}`;
      let followerData: any;

      const cached = await cache?.get(cacheKey);
      if (cached) {
        followerData = JSON.parse(cached);
      } else {
        const userInfo = await fetchTiktokUserInfo(username, token);
        if (userInfo) {
          followerData = {
            username: '@' + username,
            profileUrl: 'https://www.tiktok.com/@' + username,
            followers: userInfo.followers,
            nickname: userInfo.nickname,
          };
          await cache?.put(cacheKey, JSON.stringify(followerData), { expirationTtl: 300 });
        }
      }

      if (followerData) {
        results.push(followerData);
      }
    }

    // Build summary
    const typeLabels: Record<string, string> = {
      'normal': '#1 (ปกติ)',
      'hq': '#HQ',
      'th': '#TH (ไทย)',
    };

    let text = `👥 TikTok - Follower ${typeLabels[type] || ''}\n\n`;

    for (const r of results) {
      const targetFollowers = r.followers + Number(amount);

      text += `🔗 ${r.profileUrl}\n`;
      text += `👤 ${r.nickname}\n`;
      text += `👥 ผู้ติดตามเริ่มต้น: ${r.followers.toLocaleString()}\n`;
      text += `➕ เพิ่ม: +${Number(amount).toLocaleString()}\n`;
      text += `🎯 เป้าหมาย: ${targetFollowers.toLocaleString()}\n\n`;
    }

    return c.json({
      platform: 'TikTok',
      type: 'Follower',
      subType: typeLabels[type],
      amount: Number(amount),
      results,
      text,
    });
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
