import { createMiddleware } from 'hono/factory';

// ==================== SESSION UTILITIES ====================
const SESSION_COOKIE_NAME = 'admin_monitor_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function generateSessionId() {
  return crypto.randomUUID();
}

async function createSessionToken(user, secret) {
  const payload = {
    sub: user.email,
    name: user.name,
    picture: user.picture,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const token = btoa(JSON.stringify(payload)) + '.' + btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return token;
}

async function verifySessionToken(token, secret) {
  try {
    const [payloadB64, signatureB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    // Verify signature
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, signature, data);
    
    if (!valid) return null;
    
    return {
      email: payload.sub,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    console.error('Session verification error:', err);
    return null;
  }
}

// ==================== AUTH MIDDLEWARE ====================
export const authMiddleware = createMiddleware(async (c, next) => {
  // Get cookie from header
  const cookieHeader = c.req.header('cookie');
  let sessionToken = null;
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith(SESSION_COOKIE_NAME + '='));
    if (sessionCookie) {
      sessionToken = sessionCookie.split('=')[1];
    }
  }
  
  if (!sessionToken) {
    return c.redirect('/auth/google');
  }
  
  const user = await verifySessionToken(sessionToken, c.env.SESSION_SECRET);
  
  if (!user) {
    return c.redirect('/auth/google');
  }
  
  // Set user in context
  c.set('user', user);
  
  // Log activity
  await logActivity(c.env.DB, user.email, 'page_view', c.req.path, c.req.header('cf-connecting-ip') || 'unknown', c.req.header('user-agent') || 'unknown');
  
  await next();
});

// ==================== GOOGLE OAUTH ====================
export const googleAuth = {
  // Step 1: Redirect to Google OAuth
  login: (c) => {
    const redirectUri = `${new URL(c.req.url).origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const state = generateSessionId(); // Anti-CSRF
    
    console.log('🔐 Starting OAuth login...');
    console.log('Client ID:', c.env.GOOGLE_CLIENT_ID ? 'Set ✅' : 'Missing ❌');
    console.log('Redirect URI:', redirectUri);
    
    if (!c.env.GOOGLE_CLIENT_ID) {
      return c.html(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>❌ Configuration Error</h1>
            <p>GOOGLE_CLIENT_ID is not set</p>
            <p style="color: #9ca3af;">Please run: npx wrangler secret put GOOGLE_CLIENT_ID</p>
          </body>
        </html>
      `);
    }
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', c.env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'online');
    authUrl.searchParams.set('prompt', 'select_account');
    
    console.log('Redirecting to Google OAuth...');
    
    return c.redirect(authUrl.toString());
  },
  
  // Step 2: Handle OAuth callback
  callback: async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    
    if (!code) {
      return c.html(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>❌ Authorization Failed</h1>
            <p>No authorization code received</p>
            <a href="/" style="color: #22c55e;">← Back to Home</a>
          </body>
        </html>
      `);
    }
    
    try {
      // Exchange code for tokens
      const redirectUri = `${new URL(c.req.url).origin}/auth/google/callback`;
      
      console.log('🔄 Exchanging code for token...');
      console.log('Redirect URI:', redirectUri);
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          code,
          client_id: c.env.GOOGLE_CLIENT_ID,
          client_secret: c.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });
      
      const tokenText = await tokenResponse.text();
      console.log('Token response status:', tokenResponse.status);
      console.log('Token response:', tokenText);
      
      let tokens;
      try {
        tokens = JSON.parse(tokenText);
      } catch (e) {
        throw new Error('Failed to parse token response: ' + tokenText);
      }
      
      if (!tokens.access_token) {
        console.error('Token error:', tokens);
        throw new Error(tokens.error_description || tokens.error || 'Failed to get access token');
      }
      
      console.log('✅ Got access token');
      
      // Get user info
      console.log('🔄 Fetching user info...');
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json',
        },
      });
      
      const userInfoText = await userInfoResponse.text();
      console.log('User info response:', userInfoText);
      
      let userInfo;
      try {
        userInfo = JSON.parse(userInfoText);
      } catch (e) {
        throw new Error('Failed to parse user info: ' + userInfoText);
      }
      
      if (!userInfo.email) {
        throw new Error('Failed to get user email from Google');
      }
      
      console.log('✅ Got user info:', userInfo.email);
      
      // Create session
      const user = {
        email: userInfo.email,
        name: userInfo.name || userInfo.email,
        picture: userInfo.picture || '',
      };
      
      const sessionToken = await createSessionToken(user, c.env.SESSION_SECRET);
      
      // Save user to database
      try {
        await saveUser(c.env.DB, user);
      } catch (dbErr) {
        console.error('DB save error:', dbErr);
        // Continue anyway - login is more important than DB save
      }
      
      // Log login
      try {
        await logActivity(c.env.DB, user.email, 'login', 'Google OAuth', c.req.header('cf-connecting-ip') || 'unknown', c.req.header('user-agent') || 'unknown');
      } catch (logErr) {
        console.error('Log error:', logErr);
        // Continue anyway
      }
      
      console.log('✅ Login successful for:', user.email);
      
      // Set cookie and redirect
      return c.html(`
        <html>
          <head>
            <meta http-equiv="refresh" content="0; url=/pages/monitor">
          </head>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>✅ Login Successful!</h1>
            <p>Redirecting...</p>
            <script>
              document.cookie = "${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax; Secure";
              setTimeout(() => window.location.href = '/pages/monitor', 100);
            </script>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('❌ OAuth callback error:', err);
      console.error('Error stack:', err.stack);
      
      return c.html(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>❌ Authentication Failed</h1>
            <p style="color: #ef4444;">${err.message}</p>
            <pre style="background: #0a0e13; color: #22c55e; padding: 20px; border-radius: 8px; text-align: left; overflow-x: auto;">${err.stack || 'No stack trace'}</pre>
            <a href="/" style="color: #22c55e; margin-top: 20px; display: inline-block;">← Try Again</a>
          </body>
        </html>
      `);
    }
  },
  
  // Logout
  logout: (c) => {
    c.header('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return c.redirect('/');
  },
};

// ==================== DATABASE HELPERS ====================
async function saveUser(db, user) {
  try {
    await db.prepare(`
      INSERT INTO users (email, name, picture, last_login)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        picture = excluded.picture,
        last_login = CURRENT_TIMESTAMP
    `).bind(user.email, user.name, user.picture).run();
  } catch (err) {
    console.error('Error saving user:', err);
  }
}

async function logActivity(db, userEmail, action, details, ip, userAgent) {
  try {
    await db.prepare(`
      INSERT INTO logs (user_email, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).bind(userEmail, action, details, ip, userAgent).run();
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}
