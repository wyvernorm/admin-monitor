import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  APIFY3_TOKEN: string;
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

// ============= GET INSTAGRAM STATS =============
instagramRoutes.post('/stats', async (c) => {
  try {
    let { url } = await c.req.json();
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    // แปลง /reel/ → /p/ เพื่อให้ดึงข้อมูลได้
    url = url.replace('/reel/', '/p/');

    const token = c.env.APIFY3_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    if (isProfileUrl(url)) {
      return getInstagramProfileStats(url, token, cache, c);
    }

    return getInstagramPostStats(url, token, cache, c);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GET POST STATS =============
async function getInstagramPostStats(url: string, token: string, cache: KVNamespace | undefined, c: any) {
  const shortcode = extractPostShortcode(url);
  if (!shortcode) {
    return c.json({ error: 'Invalid Instagram post URL' }, 400);
  }

  const cacheKey = `ig_post_${shortcode}`;
  const cached = await cache?.get(cacheKey);
  if (cached) {
    return c.json({ ...JSON.parse(cached), fromCache: true, url });
  }

  // ใช้ instagram-scraper แทน instagram-post-scraper
  const ACTOR_ID = 'apify~instagram-scraper';

  try {
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
          searchLimit: 1
        }),
      }
    );

    const runJson = await runRes.json() as any;
    const datasetId = runJson?.data?.defaultDatasetId;

    if (!datasetId) {
      return c.json({ error: 'Failed to start Apify actor' }, 500);
    }

    // รอให้ทำงานเสร็จ
    await new Promise(resolve => setTimeout(resolve, 8000));

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
    );

    const items = await dataRes.json() as any[];
    if (!items || items.length === 0) {
      return c.json({ error: 'ไม่พบข้อมูลโพสต์ - อาจเป็นโพสต์ส่วนตัว' }, 404);
    }

    const item = items[0];
    const result = {
      type: 'post',
      stats: {
        likes: Number(item.likesCount || item.likes || 0),
        comments: Number(item.commentsCount || item.comments || 0),
        views: Number(item.videoViewCount || item.videoPlayCount || item.views || 0),
      }
    };

    await cache?.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 }); // 5 นาที

    return c.json({ ...result, url });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

// ============= GET PROFILE STATS =============
async function getInstagramProfileStats(url: string, token: string, cache: KVNamespace | undefined, c: any) {
  const username = extractInstagramUsername(url);

  const cacheKey = `ig_profile_${username}`;
  const cached = await cache?.get(cacheKey);
  if (cached) {
    return c.json({ ...JSON.parse(cached), fromCache: true });
  }

  const ACTOR_ID = 'apify~instagram-profile-scraper';

  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=180`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernames: [username],
          resultsLimit: 1
        }),
      }
    );

    const runJson = await runRes.json() as any;
    const datasetId = runJson?.data?.defaultDatasetId;

    if (!datasetId) {
      return c.json({ error: 'Failed to start Apify actor' }, 500);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
    );

    const items = await dataRes.json() as any[];
    if (!items || items.length === 0) {
      return c.json({ error: 'No data found' }, 404);
    }

    const item = items[0];
    const result = {
      type: 'profile',
      username: item.username || username,
      fullName: item.fullName || '',
      followers: Number(item.followersCount || item.followers || 0),
      following: Number(item.followingCount || item.following || 0),
      posts: Number(item.postsCount || item.posts || 0),
      profileUrl: `https://www.instagram.com/${item.username || username}/`,
    };

    await cache?.put(cacheKey, JSON.stringify(result), { expirationTtl: 1800 });

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

// ============= GENERATE SINGLE SUMMARY =============
instagramRoutes.post('/summary', async (c) => {
  try {
    const { url, type, packageKey, amount, startValue } = await c.req.json();

    if (!url || !type) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const token = c.env.APIFY3_TOKEN;
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
    if (!config) {
      return c.json({ error: 'Invalid type' }, 400);
    }

    let currentValue = startValue;

    if (currentValue === undefined || currentValue === null) {
      // Try to fetch stats
      if (isProfileUrl(url)) {
        const username = extractInstagramUsername(url);
        const cacheKey = `ig_profile_${username}`;
        const cached = await cache?.get(cacheKey);

        if (cached) {
          const stats = JSON.parse(cached);
          currentValue = stats[config.field] || 0;
        }
      } else {
        const shortcode = extractPostShortcode(url);
        if (shortcode) {
          const cacheKey = `ig_post_${shortcode}`;
          const cached = await cache?.get(cacheKey);

          if (cached) {
            const stats = JSON.parse(cached);
            currentValue = stats[config.field] || 0;
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

    if (!url || !items || items.length === 0) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const cache = c.env.ADMIN_MONITOR_CACHE;

    let stats: any = {};

    if (isProfileUrl(url)) {
      const username = extractInstagramUsername(url);
      const cacheKey = `ig_profile_${username}`;
      const cached = await cache?.get(cacheKey);
      if (cached) {
        stats = JSON.parse(cached);
      }
    } else {
      const shortcode = extractPostShortcode(url);
      if (shortcode) {
        const cacheKey = `ig_post_${shortcode}`;
        const cached = await cache?.get(cacheKey);
        if (cached) {
          stats = JSON.parse(cached);
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

    return c.json({
      platform: 'Instagram',
      type: 'Batch',
      url,
      stats,
      items: summaryItems,
      text,
    });
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
        if (shortcode) {
          await cache?.delete(`ig_post_${shortcode}`);
        }
      }
    }

    return c.json({ success: true, message: 'Cache cleared' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
