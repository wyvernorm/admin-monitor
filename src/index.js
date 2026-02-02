import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { authMiddleware, googleAuth } from './auth';
import { youtubeRoutes } from './routes/youtube';
import { monitorRoutes } from './routes/monitor';
import { logRoutes } from './routes/logs';
import { renderPage } from './views/pages';

const app = new Hono();

// CORS
app.use('/*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ==================== AUTH ROUTES ====================
// Google OAuth login
app.get('/auth/google', (c) => googleAuth.login(c));

// Google OAuth callback
app.get('/auth/google/callback', async (c) => {
  return await googleAuth.callback(c);
});

// Logout
app.get('/auth/logout', (c) => googleAuth.logout(c));

// Check auth status
app.get('/auth/me', authMiddleware, (c) => {
  return c.json({ user: c.get('user') });
});

// ==================== PROTECTED ROUTES ====================
// Protected routes ต้อง login ก่อน
app.use('/api/*', authMiddleware);
app.use('/pages/*', authMiddleware);

// API Routes
app.route('/api/youtube', youtubeRoutes);
app.route('/api/monitor', monitorRoutes);
app.route('/api/logs', logRoutes);

// ==================== PAGE ROUTES ====================
// Homepage (redirect to monitor if logged in)
app.get('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.html(renderPage('login', {}));
  }
  return c.redirect('/pages/monitor');
});

// Monitor page
app.get('/pages/monitor', authMiddleware, async (c) => {
  return c.html(renderPage('monitor', { user: c.get('user') }));
});

// Dashboard page
app.get('/pages/dashboard', authMiddleware, async (c) => {
  return c.html(renderPage('dashboard', { user: c.get('user') }));
});

// YouTube stats page
app.get('/pages/youtube-stats', authMiddleware, async (c) => {
  return c.html(renderPage('youtube-stats', { user: c.get('user') }));
});

// Logs page
app.get('/pages/logs', authMiddleware, async (c) => {
  return c.html(renderPage('logs', { user: c.get('user') }));
});

// ==================== 404 ====================
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// ==================== ERROR HANDLER ====================
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

export default app;
