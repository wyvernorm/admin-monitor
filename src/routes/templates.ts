import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Bindings, Variables } from '../types';

export const templateRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============= GET ALL TEMPLATES =============
templateRoutes.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const sessionToken = getCookie(c, 'session');
    let email = '';
    if (sessionToken) {
      try { email = JSON.parse(atob(sessionToken)).email; } catch(e) {}
    }

    const result = await db.prepare(`
      SELECT * FROM templates 
      WHERE admin_email = ?
      ORDER BY platform ASC, name ASC
    `).bind(email).all();

    return c.json({ templates: result.results || [] });
  } catch (error: any) {
    return c.json({ error: error.message, templates: [] }, 500);
  }
});

// ============= CREATE TEMPLATE =============
templateRoutes.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const name = body.name || '';
    const platform = body.platform || 'youtube';
    const url = body.url || '';
    const settings = body.settings || {};
    
    const sessionToken = getCookie(c, 'session');
    let email = '';
    if (sessionToken) {
      try { email = JSON.parse(atob(sessionToken)).email; } catch(e) {}
    }
    
    if (!name) {
      return c.json({ error: 'กรุณากรอกชื่อ Template' }, 400);
    }
    
    if (!email) {
      return c.json({ error: 'กรุณาเข้าสู่ระบบ' }, 401);
    }

    await db.prepare(`
      INSERT INTO templates (admin_email, name, platform, url, settings, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(email, name, platform, url, JSON.stringify(settings)).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============= DELETE TEMPLATE =============
templateRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    await db.prepare('DELETE FROM templates WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
