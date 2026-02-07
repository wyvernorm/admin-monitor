import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { createSessionToken, verifySessionTokenCompat } from '../utils';
import type { Bindings } from '../types';

export const authRoutes = new Hono<{ Bindings: Bindings }>();

const REDIRECT_URI = 'https://admin-monitor.iplusview.workers.dev/api/auth/callback';
const ALLOWED_EMAILS = [
  // Add allowed admin emails here
];

// ============= LOGIN - REDIRECT TO GOOGLE =============
authRoutes.get('/login', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'email profile');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  return c.redirect(authUrl.toString());
});

// ============= CALLBACK - HANDLE GOOGLE RESPONSE =============
authRoutes.get('/callback', async (c) => {
  try {
    const code = c.req.query('code');

    if (!code) {
      return c.redirect('/?error=no_code');
    }

    const clientId = c.env.GOOGLE_CLIENT_ID;
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json() as any;

    if (!tokenData.access_token) {
      return c.redirect('/?error=token_failed');
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json() as any;

    // Check if email is in team_members table (access control)
    // ถ้าตาราง team_members มีข้อมูล จะอนุญาตเฉพาะคนที่อยู่ในตาราง
    // ถ้าตารางว่าง จะอนุญาตทุกคน (first-time setup)
    try {
      const db = c.env.DB;
      const memberCount = await db.prepare('SELECT COUNT(*) as c FROM team_members').first() as any;
      if (memberCount?.c > 0) {
        const member = await db.prepare('SELECT email FROM team_members WHERE email = ?').bind(userData.email).first();
        if (!member) {
          console.log('[AUTH] Access denied for:', userData.email);
          return c.redirect('/?error=not_authorized');
        }
      }
    } catch (e) {
      // ถ้า table ยังไม่มี ให้ผ่านไปก่อน
      console.log('[AUTH] team_members check skipped:', e);
    }

    // Create HMAC-signed session token
    const sessionToken = await createSessionToken({
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }, c.env.SESSION_SECRET);

    // Set cookie
    setCookie(c, 'session', sessionToken, {
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('[AUTH] Session cookie set for:', userData.email);

    // Return HTML that saves to localStorage and redirects
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Logging in...</title>
        <style>
          body { background: #0a0a0a; color: #fff; font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .loader { text-align: center; }
          .spinner { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <div>กำลังเข้าสู่ระบบ...</div>
        </div>
        <script>
          localStorage.setItem('session', '${sessionToken}');
          window.location.href = '/';
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Auth error:', error);
    return c.redirect('/?error=auth_failed');
  }
});

// ============= LOGOUT =============
authRoutes.get('/logout', async (c) => {
  deleteCookie(c, 'session', { path: '/' });
  return c.redirect('/');
});

// ============= GET CURRENT USER =============
authRoutes.get('/me', async (c) => {
  try {
    let sessionToken = c.req.header('X-Session-Token') || getCookie(c, 'session');
    
    console.log('[AUTH] /me called, token exists:', !!sessionToken);

    if (!sessionToken) {
      return c.json({ user: null });
    }

    // Verify with HMAC (backward-compatible with old unsigned tokens)
    const session = await verifySessionTokenCompat(sessionToken, c.env.SESSION_SECRET);
    
    if (!session) {
      console.log('[AUTH] Session invalid or expired');
      return c.json({ user: null });
    }

    console.log('[AUTH] Session verified for:', session.email);

    return c.json({
      user: {
        email: session.email,
        name: session.name,
        picture: session.picture,
      }
    });
  } catch (error) {
    console.error('[AUTH] /me error:', error);
    return c.json({ user: null });
  }
});
