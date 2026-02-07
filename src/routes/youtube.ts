import { Hono } from 'hono';
import { extractVideoId, extractChannelId, isChannelUrl } from '../utils';
import type { Bindings, Variables } from '../types';

export const youtubeRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============= GET VIDEO STATS =============
youtubeRoutes.post('/stats', async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    const API_KEY = c.env.YOUTUBE_API_KEY;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    // Check if it's a channel URL
    if (isChannelUrl(url)) {
      return getChannelStats(url, API_KEY, cache, c);
    }

    // Video stats
    const videoId = extractVideoId(url);
    if (!videoId) {
      return c.json({ error: 'Invalid YouTube URL' }, 400);
    }

    // Check cache first (5 minutes)
    const cacheKey = `youtube_video_${videoId}`;
    const cached = await cache?.get(cacheKey);
    if (cached) {
      return c.json({ ...JSON.parse(cached), fromCache: true });
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`;
    const res = await fetch(apiUrl);
    const data = await res.json() as any;

    if (!data.items || data.items.length === 0) {
      return c.json({ error: 'Video not found' }, 404);
    }

    const item = data.items[0];
    const result = {
      type: 'video',
      videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      views: Number(item.statistics.viewCount || 0),
      likes: Number(item.statistics.likeCount || 0),
      comments: Number(item.statistics.commentCount || 0),
    };

    // Cache for 5 minutes
    await cache?.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GET CHANNEL STATS (SUBSCRIBERS) =============
async function getChannelStats(url: string, API_KEY: string, cache: KVNamespace | undefined, c: any) {
  let channelId = extractChannelId(url);

  // If it's @username or /c/ format, we need to resolve it
  if (!channelId) {
    // Try to extract username
    let username = '';
    if (url.includes('/@')) {
      const match = url.match(/\/@([^\/\?]+)/);
      username = match ? match[1] : '';
    } else if (url.includes('/c/')) {
      const match = url.match(/\/c\/([^\/\?]+)/);
      username = match ? match[1] : '';
    }

    if (username) {
      // Search for channel by username
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${API_KEY}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json() as any;

      if (searchData.items && searchData.items.length > 0) {
        channelId = searchData.items[0].snippet.channelId;
      }
    }
  }

  if (!channelId) {
    return c.json({ error: 'Cannot extract channel ID' }, 400);
  }

  // Check cache
  const cacheKey = `youtube_channel_${channelId}`;
  const cached = await cache?.get(cacheKey);
  if (cached) {
    return c.json({ ...JSON.parse(cached), fromCache: true });
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;
  const res = await fetch(apiUrl);
  const data = await res.json() as any;

  if (!data.items || data.items.length === 0) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  const item = data.items[0];
  const result = {
    type: 'channel',
    channelId,
    channelUrl: `https://www.youtube.com/channel/${channelId}`,
    channelTitle: item.snippet.title,
    subscribers: Number(item.statistics.subscriberCount || 0),
    videoCount: Number(item.statistics.videoCount || 0),
    viewCount: Number(item.statistics.viewCount || 0),
  };

  // Cache for 5 minutes
  await cache?.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });

  return c.json(result);
}

// ============= GET SUBSCRIBERS =============
youtubeRoutes.post('/subscribers', async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    const API_KEY = c.env.YOUTUBE_API_KEY;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    return getChannelStats(url, API_KEY, cache, c);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= GENERATE SUMMARY =============
youtubeRoutes.post('/summary', async (c) => {
  try {
    const { url, type, packageKey } = await c.req.json();

    if (!url || !type || !packageKey) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const API_KEY = c.env.YOUTUBE_API_KEY;
    const cache = c.env.ADMIN_MONITOR_CACHE;

    // Check if subscriber type
    if (type === 'subscriber') {
      // Get channel stats
      const channelResult = await getChannelStatsInternal(url, API_KEY, cache);
      if (!channelResult) {
        return c.json({ error: 'Cannot fetch channel data' }, 400);
      }

      const amount = Number(packageKey);
      const startCount = channelResult.subscribers;
      const targetCount = startCount + amount;

      const summary = {
        platform: 'YouTube',
        type: 'Subscriber #1',
        url: channelResult.channelUrl,
        channelTitle: channelResult.channelTitle,
        startCount,
        amount,
        targetCount,
        text: `📺 YouTube - Subscriber #1
🔗 ${channelResult.channelUrl}
📊 ${channelResult.channelTitle}

👥 ผู้ติดตามเริ่มต้น: ${startCount.toLocaleString()}
➕ เพิ่ม: +${amount.toLocaleString()}
🎯 เป้าหมาย: ${targetCount.toLocaleString()}`,
      };

      return c.json(summary);
    }

    // Video stats
    const videoId = extractVideoId(url);
    if (!videoId) {
      return c.json({ error: 'Invalid YouTube URL' }, 400);
    }

    // Get current stats
    const cacheKey = `youtube_video_${videoId}`;
    let stats: any;

    const cached = await cache?.get(cacheKey);
    if (cached) {
      stats = JSON.parse(cached);
    } else {
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`;
      const res = await fetch(apiUrl);
      const data = await res.json() as any;

      if (!data.items || data.items.length === 0) {
        return c.json({ error: 'Video not found' }, 404);
      }

      const item = data.items[0];
      stats = {
        title: item.snippet.title,
        views: Number(item.statistics.viewCount || 0),
        likes: Number(item.statistics.likeCount || 0),
      };

      await cache?.put(cacheKey, JSON.stringify(stats), { expirationTtl: 300 });
    }

    // Build summary based on type
    const summary = buildYouTubeSummary(url, type, packageKey, stats);
    return c.json(summary);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

async function getChannelStatsInternal(url: string, API_KEY: string, cache: KVNamespace | undefined): Promise<any> {
  let channelId = extractChannelId(url);

  if (!channelId) {
    let username = '';
    if (url.includes('/@')) {
      const match = url.match(/\/@([^\/\?]+)/);
      username = match ? match[1] : '';
    } else if (url.includes('/c/')) {
      const match = url.match(/\/c\/([^\/\?]+)/);
      username = match ? match[1] : '';
    }

    if (username) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${API_KEY}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json() as any;

      if (searchData.items && searchData.items.length > 0) {
        channelId = searchData.items[0].snippet.channelId;
      }
    }
  }

  if (!channelId) return null;

  const cacheKey = `youtube_channel_${channelId}`;
  const cached = await cache?.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;
  const res = await fetch(apiUrl);
  const data = await res.json() as any;

  if (!data.items || data.items.length === 0) return null;

  const item = data.items[0];
  const result = {
    channelId,
    channelUrl: `https://www.youtube.com/channel/${channelId}`,
    channelTitle: item.snippet.title,
    subscribers: Number(item.statistics.subscriberCount || 0),
  };

  await cache?.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
  return result;
}

function buildYouTubeSummary(url: string, type: string, packageKey: string, stats: any) {
  const packages: Record<string, any> = {
    'normal': {
      1000:   { views: 1000 },
      2000:   { views: 2000 },
      3000:   { views: 3000 },
      5000:   { views: 5000 },
      10000:  { views: 10000 },
      30000:  { views: 30000 },
      50000:  { views: 50000 },
      100000: { views: 100000 },
    },
    'hq': {
      1000:   { views: 1000 },
      2000:   { views: 2000 },
      3000:   { views: 3000 },
      5000:   { views: 5000 },
      10000:  { views: 10000 },
      30000:  { views: 30000 },
      50000:  { views: 50000 },
      100000: { views: 100000 },
    },
    'minute': {
      1000:   { views: 1000 },
      2000:   { views: 2000 },
      3000:   { views: 3000 },
      5000:   { views: 5000 },
      10000:  { views: 10000 },
      30000:  { views: 30000 },
      50000:  { views: 50000 },
      100000: { views: 100000 },
    },
    '3in1-normal': {
      1000:   { views: 1000,   likes: 50,   shares: 50 },
      2000:   { views: 2000,   likes: 50,   shares: 50 },
      3000:   { views: 3000,   likes: 50,   shares: 50 },
      5000:   { views: 5000,   likes: 100,  shares: 50 },
      10000:  { views: 10000,  likes: 200,  shares: 50 },
      30000:  { views: 30000,  likes: 500,  shares: 150 },
      50000:  { views: 50000,  likes: 1000, shares: 200 },
      100000: { views: 100000, likes: 3000, shares: 500 },
    },
    '3in1-hq': {
      1000:   { views: 1000,   likes: 50,   shares: 50 },
      2000:   { views: 2000,   likes: 50,   shares: 50 },
      3000:   { views: 3000,   likes: 50,   shares: 50 },
      5000:   { views: 5000,   likes: 100,  shares: 50 },
      10000:  { views: 10000,  likes: 200,  shares: 50 },
      30000:  { views: 30000,  likes: 500,  shares: 150 },
      50000:  { views: 50000,  likes: 1000, shares: 200 },
      100000: { views: 100000, likes: 3000, shares: 500 },
    },
  };

  const pkg = packages[type]?.[packageKey];
  if (!pkg) {
    return { error: 'Invalid package' };
  }

  const typeLabels: Record<string, string> = {
    'normal': 'วิว (ทั่วไป)',
    'hq': 'วิว #HQ',
    'minute': 'วิว #นาที',
    '3in1-normal': '3 in 1 (ทั่วไป)',
    '3in1-hq': '3 in 1 #HQ',
  };

  const startView = stats.views;
  const startLike = stats.likes;
  const targetView = startView + (pkg.views || 0);
  const targetLike = startLike + (pkg.likes || 0);

  let text = `📺 YouTube - ${typeLabels[type] || type}
🔗 ${url}

`;

  if (pkg.views) {
    text += `👀 วิวเริ่มต้น: ${startView.toLocaleString()}
➕ เพิ่ม: +${pkg.views.toLocaleString()}
🎯 เป้าหมาย: ${targetView.toLocaleString()}
`;
  }

  if (pkg.likes) {
    text += `
👍 ไลค์เริ่มต้น: ${startLike.toLocaleString()}
➕ เพิ่ม: +${pkg.likes.toLocaleString()}
🎯 เป้าหมาย: ${targetLike.toLocaleString()}
`;
  }

  if (pkg.shares) {
    text += `
🔗 แชร์: +${pkg.shares.toLocaleString()}
`;
  }

  return {
    platform: 'YouTube',
    type: typeLabels[type] || type,
    url,
    startView,
    startLike,
    targetView,
    targetLike,
    package: pkg,
    text,
  };
}

// ============= CLEAR CACHE =============
youtubeRoutes.post('/clear-cache', async (c) => {
  try {
    const { url } = await c.req.json();
    const cache = c.env.ADMIN_MONITOR_CACHE;

    if (url) {
      const videoId = extractVideoId(url);
      if (videoId) {
        await cache?.delete(`youtube_video_${videoId}`);
      }
      const channelId = extractChannelId(url);
      if (channelId) {
        await cache?.delete(`youtube_channel_${channelId}`);
      }
    }

    return c.json({ success: true, message: 'Cache cleared' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
