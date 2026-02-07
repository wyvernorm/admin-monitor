import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';

export const facebookRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============= HELPER FUNCTIONS =============

function extractFacebookInfo(url: string): { type: string; id: string | null } {
  // Video: facebook.com/watch/?v=123456789
  if (url.includes('/watch/') && url.includes('v=')) {
    const match = url.match(/v=(\d+)/);
    return { type: 'video', id: match ? match[1] : null };
  }

  // Video: facebook.com/username/videos/123456789
  if (url.includes('/videos/')) {
    const match = url.match(/\/videos\/(\d+)/);
    return { type: 'video', id: match ? match[1] : null };
  }

  // Reel
  if (url.includes('/reel/')) {
    const match = url.match(/\/reel\/(\d+)/);
    return { type: 'reel', id: match ? match[1] : null };
  }

  // Post: facebook.com/username/posts/123456789
  if (url.includes('/posts/')) {
    const match = url.match(/\/posts\/([^\/\?]+)/);
    return { type: 'post', id: match ? match[1] : null };
  }

  // Post: facebook.com/permalink.php?story_fbid=xxx&id=yyy
  if (url.includes('story_fbid=')) {
    const match = url.match(/story_fbid=([^&]+)/);
    return { type: 'post', id: match ? match[1] : null };
  }

  // Page
  const pageMatch = url.match(/facebook\.com\/([^\/\?]+)/);
  if (pageMatch && !['watch', 'videos', 'posts', 'reel'].includes(pageMatch[1])) {
    return { type: 'page', id: pageMatch[1] };
  }

  return { type: 'unknown', id: null };
}

// Parse view count from string like "1.2M views" or "500K"
function parseViewCount(views: any): number {
  if (typeof views === 'number') return views;
  if (!views) return 0;
  
  const str = String(views).toLowerCase().replace(/,/g, '').replace('views', '').trim();
  
  if (str.includes('k')) {
    return Math.round(parseFloat(str) * 1000);
  }
  if (str.includes('m')) {
    return Math.round(parseFloat(str) * 1000000);
  }
  if (str.includes('b')) {
    return Math.round(parseFloat(str) * 1000000000);
  }
  
  return parseInt(str) || 0;
}

// ============= GET FACEBOOK STATS =============
facebookRoutes.post('/stats', async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    const token = c.env.APIFY2_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;
    const info = extractFacebookInfo(url);

    // Check cache
    const cacheKey = `fb_${info.type}_${btoa(url).substring(0, 50)}`;
    const cached = await cache?.get(cacheKey);
    if (cached) {
      const cachedData = JSON.parse(cached);
      // Return in consistent format
      if (info.type === 'page') {
        return c.json({ ...cachedData, fromCache: true, url });
      } else {
        return c.json({ stats: cachedData, fromCache: true, url });
      }
    }

    // Handle different types
    if (info.type === 'page') {
      return getFacebookPageStats(url, token, cache, c);
    }

    // Video/Reel/Post
    return getFacebookPostStats(url, token, cache, c);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GET VIDEO/REEL STATS (NEW) =============
facebookRoutes.post('/video-stats', async (c) => {
  const { url } = await c.req.json();
  
  if (!url) {
    return c.json({ error: 'URL is required' }, 400);
  }

  // ตรวจสอบว่าเป็น Facebook video URL หรือไม่
  const isFBVideo = url.includes('facebook.com') || url.includes('fb.watch');
  if (!isFBVideo) {
    return c.json({ error: 'Invalid Facebook video URL' }, 400);
  }

  try {
    const token = c.env.APIFY2_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;
    
    // Check cache first
    const cacheKey = `fb_video_${btoa(url).substring(0, 50)}`;
    const cached = await cache?.get(cacheKey);
    if (cached) {
      return c.json({ ...JSON.parse(cached), fromCache: true });
    }

    // ตรวจสอบ URL type
    const isReel = url.includes('/reel/');
    const isVideo = url.includes('/videos/') || url.includes('/watch');
    
    let result = null;

    // ลอง Method 1: Facebook Posts Scraper (ใช้ได้กับหลาย URL type)
    result = await tryPostsScraper(url, token);
    
    // ถ้าไม่ได้ผล ลอง Method 2: Facebook Reels Scraper (สำหรับ Reel โดยเฉพาะ)
    if (!result && isReel) {
      result = await tryReelsScraper(url, token);
    }

    // ถ้าไม่ได้ผล ลอง Method 3: Facebook Videos Watch Scraper
    if (!result) {
      result = await tryVideosScraper(url, token);
    }

    if (result) {
      // Cache for 5 minutes
      await cache?.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
      return c.json(result);
    }

    return c.json({ error: 'ไม่สามารถดึงข้อมูลได้ วิดีโออาจเป็นส่วนตัวหรือ URL ไม่ถูกต้อง' }, 404);

  } catch (error: any) {
    console.error('FB Video Stats Error:', error);
    return c.json({ error: error.message || 'Failed to fetch video stats' }, 500);
  }
});

// Method 1: Facebook Posts Scraper
async function tryPostsScraper(url: string, token: string): Promise<any> {
  try {
    const ACTOR_ID = 'apify~facebook-posts-scraper';
    
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=180`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url }],
          maxPosts: 1,
          scrapePostComments: false,
          scrapePostDetails: true
        })
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
    const views = parseViewCount(item.viewsCount || item.views || item.playCount || item.videoViewCount || 0);
    const likes = Number(item.likes || item.likesCount || item.reactionsCount || 0);
    
    // ถ้าไม่มีข้อมูลเลย ถือว่าไม่สำเร็จ
    if (views === 0 && likes === 0) return null;

    return {
      title: item.text?.substring(0, 100) || 'Facebook Video',
      author: item.pageName || item.userName || item.ownerName || '',
      views: views,
      likes: likes,
      comments: Number(item.comments || item.commentsCount || 0),
      shares: Number(item.shares || item.sharesCount || 0),
      duration: '',
      thumbnail: item.photoUrl || item.thumbnailUrl || '',
      publishedAt: item.time || item.date || '',
      url: url
    };
  } catch (e) {
    console.error('Posts Scraper Error:', e);
    return null;
  }
}

// Method 2: Facebook Reels Scraper (สำหรับ Reel โดยเฉพาะ)
async function tryReelsScraper(url: string, token: string): Promise<any> {
  try {
    // ดึง Page URL จาก Reel URL
    // เช่น https://www.facebook.com/reel/565531932748461 -> ต้องหา page
    const ACTOR_ID = 'apify~facebook-reels-scraper';
    
    // Facebook Reels Scraper ต้องการ Page URL ไม่ใช่ Reel URL โดยตรง
    // ลองใช้ approach อื่น
    const ACTOR_ID_2 = 'louisdeconinck~facebook-reel-stats-scraper';
    
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID_2}/runs?token=${token}&waitForFinish=120`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url }]
        })
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

    const reel = items[0];
    
    return {
      title: reel.description?.substring(0, 100) || reel.text?.substring(0, 100) || 'Facebook Reel',
      author: reel.ownerName || reel.pageName || '',
      views: parseViewCount(reel.views || reel.playCount || reel.viewCount || 0),
      likes: Number(reel.likes || reel.reactions || 0),
      comments: Number(reel.comments || reel.commentCount || 0),
      shares: Number(reel.shares || reel.shareCount || 0),
      duration: reel.duration || reel.videoLength || '',
      thumbnail: reel.thumbnail || reel.thumbnailUrl || '',
      publishedAt: reel.time || reel.date || '',
      url: reel.canonicalUrl || url
    };
  } catch (e) {
    console.error('Reels Scraper Error:', e);
    return null;
  }
}

// Method 3: Facebook Videos Watch Scraper
async function tryVideosScraper(url: string, token: string): Promise<any> {
  try {
    const ACTOR_ID = 'lexis-solutions~facebook-videos-watch-scraper';
    
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=120`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: [url],
          maxItems: 1
        })
      }
    );

    const runJson = await runRes.json() as any;
    const datasetId = runJson?.data?.defaultDatasetId;
    if (!datasetId) return null;

    await new Promise(resolve => setTimeout(resolve, 2000));

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
    );
    const items = await dataRes.json() as any[];
    
    if (!items || items.length === 0) return null;

    const video = items[0];
    
    return {
      title: video.title || video.description?.substring(0, 100) || 'Facebook Video',
      author: video.ownerName || video.pageTitle || video.pageName || '',
      views: parseViewCount(video.views || video.viewCount || video.video_view_count || video.playCount || 0),
      likes: Number(video.likes || video.reactions || video.likesCount || 0),
      comments: Number(video.comments || video.commentCount || video.commentsCount || 0),
      shares: Number(video.shares || video.shareCount || video.sharesCount || 0),
      duration: video.duration || video.videoDuration || '',
      thumbnail: video.thumbnail || video.thumbnailUrl || video.photoUrl || '',
      publishedAt: video.publishedAt || video.date || video.time || '',
      url: video.url || url
    };
  } catch (e) {
    console.error('Videos Scraper Error:', e);
    return null;
  }
}

// Fallback function - ใช้ posts scraper (เก็บไว้เพื่อ backward compatibility)
async function getFBVideoFallback(url: string, token: string, cache: KVNamespace | undefined) {
  return await tryPostsScraper(url, token);
}

// ============= GET PAGE STATS =============
async function getFacebookPageStats(url: string, token: string, cache: KVNamespace | undefined, c: any) {
  const ACTOR_ID = 'apify~facebook-pages-scraper';

  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=120`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url }],
          maxPosts: 0
        }),
      }
    );

    const runJson = await runRes.json() as any;
    const datasetId = runJson?.data?.defaultDatasetId;

    if (!datasetId) {
      return c.json({ error: 'Failed to start Apify actor' }, 500);
    }

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`
    );

    const items = await dataRes.json() as any[];
    if (!items || items.length === 0) {
      return c.json({ error: 'No data found' }, 404);
    }

    const page = items[0];
    const result = {
      type: 'page',
      pageUrl: url,
      pageName: page.name || page.title || page.pageName || '',
      likes: Number(page.likes || page.fanCount || page.pageInfo?.likes || 0),
      followers: Number(page.followers || page.followersCount || page.pageInfo?.followers || 0),
    };

    // Cache for 5 minutes
    const cacheKey = `fb_page_${btoa(url).substring(0, 50)}`;
    await cache?.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

// ============= GET POST/VIDEO/REEL STATS =============
async function getFacebookPostStats(url: string, token: string, cache: KVNamespace | undefined, c: any) {
  const ACTOR_ID = 'apify~facebook-posts-scraper';

  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=180`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url }],
          maxPosts: 1,
          scrapePostComments: false,
          scrapePostDetails: true
        }),
      }
    );

    const runJson = await runRes.json() as any;
    const datasetId = runJson?.data?.defaultDatasetId;

    if (!datasetId) {
      return c.json({ error: 'Failed to start Apify actor' }, 500);
    }

    // Wait a bit for data
    await new Promise(resolve => setTimeout(resolve, 2000));

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
    );

    const items = await dataRes.json() as any[];
    if (!items || items.length === 0) {
      return c.json({ error: 'No data found. Try manual input for Videos/Reels.' }, 404);
    }

    const item = items[0];
    const info = extractFacebookInfo(url);

    const result = {
      type: info.type,
      views: Number(item.viewsCount || item.views || item.playCount || item.video?.viewCount || 0),
      reactions: Number(item.likes || item.likesCount || 0),
      reactionLike: Number(item.reactionLikeCount || 0),
      reactionLove: Number(item.reactionLoveCount || 0),
      reactionHaha: Number(item.reactionHahaCount || 0),
      reactionWow: Number(item.reactionWowCount || 0),
      reactionSad: Number(item.reactionSadCount || 0),
      reactionAngry: Number(item.reactionAngryCount || 0),
      comments: Number(item.comments || item.commentsCount || 0),
      shares: Number(item.shares || item.sharesCount || 0),
    };

    // Cache for 5 minutes
    const cacheKey = `fb_${info.type}_${btoa(url).substring(0, 50)}`;
    await cache?.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });

    return c.json({ stats: result, url });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

// ============= GENERATE SINGLE SUMMARY =============
facebookRoutes.post('/summary', async (c) => {
  try {
    const { url, type, packageKey, amount, startValue } = await c.req.json();

    if (!url || !type) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const token = c.env.APIFY2_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;
    const info = extractFacebookInfo(url);

    // Type configurations
    const typeConfig: Record<string, { field: string; label: string; labelTh: string }> = {
      'post-like-mix': { field: 'reactions', label: 'Post Like (Mix)', labelTh: 'ไลค์โพสต์ (คละประเทศ)' },
      'post-like-th1': { field: 'reactions', label: 'Post Like TH#1', labelTh: 'ไลค์โพสต์ (ไทย #TH1)' },
      'post-like-th2': { field: 'reactions', label: 'Post Like TH#2', labelTh: 'ไลค์โพสต์ (ไทย #TH2)' },
      'page-follower-mix': { field: 'followers', label: 'Page Follower (Mix)', labelTh: 'ผู้ติดตาม (คละประเทศ)' },
      'page-follower-th': { field: 'followers', label: 'Page Follower TH', labelTh: 'ผู้ติดตาม (บัญชีไทย)' },
      'post-share': { field: 'shares', label: 'Share', labelTh: 'แชร์' },
      'video-view': { field: 'views', label: 'Video View', labelTh: 'วิววิดีโอ/Reels' },
    };

    const config = typeConfig[type];
    if (!config) {
      return c.json({ error: 'Invalid type' }, 400);
    }

    // Get current stats or use manual input
    let currentValue = startValue;

    if (!currentValue && currentValue !== 0) {
      // Try to fetch automatically
      const cacheKey = `fb_${info.type}_${btoa(url).substring(0, 50)}`;
      const cached = await cache?.get(cacheKey);

      if (cached) {
        const stats = JSON.parse(cached);
        currentValue = stats[config.field] || 0;
      } else if (info.type === 'page') {
        // Fetch page stats
        const ACTOR_ID = 'apify~facebook-pages-scraper';
        const runRes = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=120`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startUrls: [{ url }], maxPosts: 0 }),
          }
        );

        const runJson = await runRes.json() as any;
        const datasetId = runJson?.data?.defaultDatasetId;

        if (datasetId) {
          const dataRes = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`
          );
          const items = await dataRes.json() as any[];

          if (items && items.length > 0) {
            const page = items[0];
            currentValue = Number(page.followers || page.followersCount || page.likes || 0);
          }
        }
      } else {
        // Try post scraper
        const ACTOR_ID = 'apify~facebook-posts-scraper';
        const runRes = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=180`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startUrls: [{ url }],
              maxPosts: 1,
              scrapePostComments: false,
              scrapePostDetails: true
            }),
          }
        );

        const runJson = await runRes.json() as any;
        const datasetId = runJson?.data?.defaultDatasetId;

        if (datasetId) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const dataRes = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
          );
          const items = await dataRes.json() as any[];

          if (items && items.length > 0) {
            const item = items[0];
            currentValue = config.field === 'reactions' ? Number(item.likes || item.likesCount || 0) :
                           config.field === 'views' ? Number(item.viewsCount || item.views || 0) :
                           config.field === 'shares' ? Number(item.shares || item.sharesCount || 0) : 0;
          }
        }
      }
    }

    currentValue = currentValue || 0;
    const addAmount = amount || Number(packageKey) || 0;
    const targetValue = currentValue + addAmount;

    // Build summary
    let text = `📘 Facebook - ${config.labelTh}
🔗 ${url}

📊 เริ่มต้น: ${currentValue.toLocaleString()}
➕ เพิ่ม: +${addAmount.toLocaleString()}
🎯 เป้าหมาย: ${targetValue.toLocaleString()}`;

    return c.json({
      platform: 'Facebook',
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
facebookRoutes.post('/batch-summary', async (c) => {
  try {
    const { url, items } = await c.req.json();

    if (!url || !items || items.length === 0) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const token = c.env.APIFY2_TOKEN;
    const cache = c.env.ADMIN_MONITOR_CACHE;
    const info = extractFacebookInfo(url);

    // Try to get current stats
    let stats: any = {};
    const cacheKey = `fb_${info.type}_${btoa(url).substring(0, 50)}`;
    const cached = await cache?.get(cacheKey);

    if (cached) {
      stats = JSON.parse(cached);
    } else {
      // Try to fetch
      if (info.type === 'page') {
        const ACTOR_ID = 'apify~facebook-pages-scraper';
        const runRes = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=120`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startUrls: [{ url }], maxPosts: 0 }),
          }
        );

        const runJson = await runRes.json() as any;
        const datasetId = runJson?.data?.defaultDatasetId;

        if (datasetId) {
          const dataRes = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`
          );
          const fetchedItems = await dataRes.json() as any[];

          if (fetchedItems && fetchedItems.length > 0) {
            const page = fetchedItems[0];
            stats = {
              followers: Number(page.followers || page.followersCount || 0),
              likes: Number(page.likes || page.fanCount || 0),
            };
          }
        }
      } else {
        // Post/Video/Reel
        const ACTOR_ID = 'apify~facebook-posts-scraper';
        const runRes = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}&waitForFinish=180`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startUrls: [{ url }],
              maxPosts: 1,
              scrapePostComments: false,
              scrapePostDetails: true
            }),
          }
        );

        const runJson = await runRes.json() as any;
        const datasetId = runJson?.data?.defaultDatasetId;

        if (datasetId) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const dataRes = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
          );
          const fetchedItems = await dataRes.json() as any[];

          if (fetchedItems && fetchedItems.length > 0) {
            const item = fetchedItems[0];
            stats = {
              reactions: Number(item.likes || item.likesCount || 0),
              views: Number(item.viewsCount || item.views || 0),
              shares: Number(item.shares || item.sharesCount || 0),
              comments: Number(item.comments || item.commentsCount || 0),
            };
          }
        }
      }

      // Cache
      if (Object.keys(stats).length > 0) {
        await cache?.put(cacheKey, JSON.stringify(stats), { expirationTtl: 300 });
      }
    }

    // Build batch summary
    const typeLabels: Record<string, { field: string; labelTh: string }> = {
      'like': { field: 'reactions', labelTh: 'ไลค์' },
      'view': { field: 'views', labelTh: 'วิว' },
      'share': { field: 'shares', labelTh: 'แชร์' },
      'follower': { field: 'followers', labelTh: 'ผู้ติดตาม' },
      'comment': { field: 'comments', labelTh: 'คอมเมนต์' },
    };

    let text = `📋 Facebook - สรุปงานหลายรายการ
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
      platform: 'Facebook',
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
facebookRoutes.post('/clear-cache', async (c) => {
  try {
    const { url } = await c.req.json();
    const cache = c.env.ADMIN_MONITOR_CACHE;

    if (url) {
      const info = extractFacebookInfo(url);
      const cacheKey = `fb_${info.type}_${btoa(url).substring(0, 50)}`;
      await cache?.delete(cacheKey);
    }

    return c.json({ success: true, message: 'Cache cleared' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
