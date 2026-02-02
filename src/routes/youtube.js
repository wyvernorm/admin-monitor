import { Hono } from 'hono';

const app = new Hono();

// ==================== EXTRACT IDs ====================
function extractVideoId(url) {
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

function extractChannelId(url) {
  if (url.includes('/channel/')) {
    const match = url.match(/\/channel\/([^\/\?]+)/);
    return match ? match[1] : null;
  }
  return null;
}

// ==================== GET VIDEO STATS ====================
app.post('/stats', async (c) => {
  const { url } = await c.req.json();
  
  if (!url) {
    return c.json({ error: 'URL is required' }, 400);
  }
  
  const videoId = extractVideoId(url);
  if (!videoId) {
    return c.json({ error: 'Invalid YouTube URL' }, 400);
  }
  
  try {
    // Check cache first (KV)
    const cacheKey = `youtube_stats_${videoId}`;
    if (c.env.CACHE) {
      const cached = await c.env.CACHE.get(cacheKey, 'json');
      if (cached) {
        return c.json({ ...cached, cached: true });
      }
    }
    
    // Fetch from YouTube API
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${c.env.YOUTUBE_API_KEY}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return c.json({ error: 'Video not found' }, 404);
    }
    
    const item = data.items[0];
    const result = {
      videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      views: Number(item.statistics.viewCount || 0),
      likes: Number(item.statistics.likeCount || 0),
      comments: Number(item.statistics.commentCount || 0),
      thumbnail: item.snippet.thumbnails.medium.url,
    };
    
    // Cache for 5 minutes
    if (c.env.CACHE) {
      await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
    }
    
    return c.json(result);
  } catch (err) {
    console.error('YouTube API error:', err);
    return c.json({ error: 'Failed to fetch YouTube stats' }, 500);
  }
});

// ==================== GET CHANNEL SUBSCRIBERS ====================
app.post('/subscribers', async (c) => {
  const { url } = await c.req.json();
  
  if (!url) {
    return c.json({ error: 'URL is required' }, 400);
  }
  
  const channelId = extractChannelId(url);
  if (!channelId) {
    return c.json({ error: 'Invalid YouTube channel URL' }, 400);
  }
  
  try {
    // Check cache
    const cacheKey = `youtube_subs_${channelId}`;
    if (c.env.CACHE) {
      const cached = await c.env.CACHE.get(cacheKey, 'json');
      if (cached) {
        return c.json({ ...cached, cached: true });
      }
    }
    
    // Fetch from YouTube API
    const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${c.env.YOUTUBE_API_KEY}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return c.json({ error: 'Channel not found' }, 404);
    }
    
    const item = data.items[0];
    const result = {
      channelId,
      channelTitle: item.snippet.title,
      channelUrl: `https://www.youtube.com/channel/${channelId}`,
      subscribers: Number(item.statistics.subscriberCount || 0),
      views: Number(item.statistics.viewCount || 0),
      videos: Number(item.statistics.videoCount || 0),
    };
    
    // Cache for 5 minutes
    if (c.env.CACHE) {
      await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
    }
    
    return c.json(result);
  } catch (err) {
    console.error('YouTube API error:', err);
    return c.json({ error: 'Failed to fetch YouTube channel info' }, 500);
  }
});

export const youtubeRoutes = app;
