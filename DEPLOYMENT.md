# 🚀 Deployment Guide

คู่มือการ deploy Admin Monitor ไปบน Cloudflare Workers แบบ step-by-step

## 📋 Prerequisites

1. **Node.js** (v18+) และ npm
2. **Git** installed
3. **Cloudflare Account** (สมัครฟรีที่ https://dash.cloudflare.com/)
4. **Google Cloud Account** (สำหรับ OAuth)
5. **YouTube API Key** (จาก Google Cloud Console)

---

## 🎯 Step 1: Setup Project

### 1.1 Clone Repository

```bash
git clone https://github.com/yourusername/admin-monitor.git
cd admin-monitor
```

### 1.2 Install Dependencies

```bash
npm install
```

---

## ☁️ Step 2: Setup Cloudflare

### 2.1 Login to Cloudflare

```bash
npx wrangler login
```

เปิด browser และ authorize Wrangler

### 2.2 สร้าง D1 Database

```bash
npx wrangler d1 create admin_monitor_db
```

จะได้ output คล้ายๆ นี้:

```
✅ Successfully created DB 'admin_monitor_db'!

[[d1_databases]]
binding = "DB"
database_name = "admin_monitor_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**คัดลอก `database_id`** แล้วไปแก้ไขใน `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "admin_monitor_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← ใส่ ID ที่ได้จริง
```

### 2.3 รัน Database Schema

```bash
npx wrangler d1 execute admin_monitor_db --file=./schema.sql
```

ตรวจสอบว่าสร้างตารางสำเร็จ:

```bash
npx wrangler d1 execute admin_monitor_db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

ต้องเห็น: `orders`, `logs`, `users`

### 2.4 สร้าง KV Namespace (สำหรับ cache)

```bash
npx wrangler kv:namespace create "CACHE"
```

จะได้ output:

```
✅ Successfully created KV namespace 'CACHE'!

[[kv_namespaces]]
binding = "CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**คัดลอก `id`** แล้วไปแก้ไขใน `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # ← ใส่ ID ที่ได้จริง
```

---

## 🔑 Step 3: Setup Google OAuth

### 3.1 สร้าง Google Cloud Project

1. ไปที่ https://console.cloud.google.com/
2. คลิก "Select a project" → "New Project"
3. ตั้งชื่อ: `Admin Monitor`
4. คลิก "Create"

### 3.2 Enable YouTube Data API

1. ไปที่ "APIs & Services" → "Enable APIs and Services"
2. ค้นหา "YouTube Data API v3"
3. คลิก "Enable"

### 3.3 สร้าง API Key (สำหรับ YouTube)

1. ไปที่ "APIs & Services" → "Credentials"
2. คลิก "Create Credentials" → "API Key"
3. **คัดลอก API Key** (จะใช้ภายหลัง)
4. (Optional) คลิก "Restrict Key" เพื่อจำกัดการใช้งาน:
   - API restrictions: YouTube Data API v3
   - Website restrictions: ใส่ domain ของคุณ

### 3.4 สร้าง OAuth 2.0 Credentials

1. ไปที่ "APIs & Services" → "Credentials"
2. คลิก "Create Credentials" → "OAuth 2.0 Client ID"
3. ถ้ายังไม่ได้ตั้ง OAuth consent screen:
   - คลิก "Configure Consent Screen"
   - เลือก "External"
   - กรอกข้อมูล:
     - App name: `Admin Monitor`
     - User support email: your email
     - Developer contact: your email
   - Scopes: เลือก `email`, `profile`, `openid`
   - คลิก "Save and Continue"

4. กลับมาสร้าง OAuth Client ID:
   - Application type: **Web application**
   - Name: `Admin Monitor`
   - Authorized redirect URIs:
     ```
     http://localhost:8787/auth/google/callback
     https://your-worker-name.workers.dev/auth/google/callback
     ```
     (แก้ `your-worker-name` เป็นชื่อ worker จริงของคุณ)
   
5. คลิก "Create"
6. **คัดลอก Client ID และ Client Secret**

---

## 🔐 Step 4: Setup Secrets

ตั้งค่า secrets ทั้งหมดด้วย Wrangler:

### 4.1 YouTube API Key

```bash
npx wrangler secret put YOUTUBE_API_KEY
```

ใส่ API Key ที่ได้จาก Step 3.3

### 4.2 Google OAuth Credentials

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
```

ใส่ Client ID ที่ได้จาก Step 3.4

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

ใส่ Client Secret ที่ได้จาก Step 3.4

### 4.3 Session Secret

```bash
npx wrangler secret put SESSION_SECRET
```

ใส่ random string อย่างน้อย 32 ตัวอักษร เช่น:

```
my-super-secret-key-2024-abcdef1234567890
```

### 4.4 Telegram (Optional)

ถ้าต้องการแจ้งเตือนผ่าน Telegram:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

ใส่ bot token จาก @BotFather

```bash
npx wrangler secret put TELEGRAM_GROUP_ID
```

ใส่ group ID หรือ chat ID

---

## 🧪 Step 5: Test Locally

### 5.1 แก้ไข wrangler.toml

ตรวจสอบว่าไฟล์ `wrangler.toml` ถูกต้อง:

```toml
name = "youtube-monitor"  # แก้เป็นชื่อที่ต้องการ
main = "src/index.js"
compatibility_date = "2024-01-31"

[[d1_databases]]
binding = "DB"
database_name = "admin_monitor_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ID จริง

[[kv_namespaces]]
binding = "CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # ID จริง

[vars]
ENVIRONMENT = "production"
```

### 5.2 รัน Local Development Server

```bash
npm run dev
```

เปิด browser: http://localhost:8787

### 5.3 ทดสอบ Features

1. **Login**: คลิก "เข้าสู่ระบบด้วย Google"
2. **Add Order**: เพิ่ม YouTube URL พร้อม target
3. **View Orders**: ดูรายการงาน
4. **Dashboard**: เช็คสถิติ

---

## 🚀 Step 6: Deploy to Production

### 6.1 Deploy Worker

```bash
npm run deploy
```

จะได้ output:

```
✅ Uploaded youtube-monitor
✅ Deployed youtube-monitor
   https://admin-monitor.your-subdomain.workers.dev
```

**คัดลอก URL ที่ได้**

### 6.2 อัพเดท OAuth Redirect URI

1. กลับไปที่ Google Cloud Console
2. "APIs & Services" → "Credentials"
3. แก้ไข OAuth 2.0 Client ID
4. เพิ่ม Authorized redirect URI:
   ```
   https://admin-monitor.your-subdomain.workers.dev/auth/google/callback
   ```
5. คลิก "Save"

### 6.3 ทดสอบ Production

เปิด browser: `https://admin-monitor.your-subdomain.workers.dev`

---

## 🔄 Step 7: Setup Auto-Check (CRON) - Optional

### 7.1 แก้ไข wrangler.toml

เพิ่ม CRON trigger:

```toml
[triggers]
crons = ["*/5 * * * *"]  # ทุก 5 นาที
```

### 7.2 แก้ไข src/index.js

เพิ่ม scheduled handler:

```javascript
export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  
  async scheduled(event, env, ctx) {
    // Auto check orders
    try {
      const monitorModule = await import('./routes/monitor.js');
      // เรียกฟังก์ชัน check ที่นี่
      console.log('CRON: Checking orders...');
    } catch (err) {
      console.error('CRON error:', err);
    }
  }
};
```

### 7.3 Re-deploy

```bash
npm run deploy
```

---

## 📊 Step 8: Monitor & Maintain

### 8.1 View Live Logs

```bash
npm run tail
```

### 8.2 Check Database

```bash
# ดูจำนวน orders
npx wrangler d1 execute admin_monitor_db --command "SELECT COUNT(*) FROM orders"

# ดู logs ล่าสุด
npx wrangler d1 execute admin_monitor_db --command "SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10"
```

### 8.3 Update Secrets

```bash
npx wrangler secret put SECRET_NAME
```

### 8.4 Update Code

```bash
git pull origin main
npm run deploy
```

---

## 🔧 Common Issues & Solutions

### ❌ Error: "database_id not found"
→ ตรวจสอบว่า database_id ใน wrangler.toml ถูกต้อง

### ❌ Error: "OAuth redirect_uri_mismatch"
→ ตรวจสอบว่า redirect URI ใน Google Console ตรงกับ URL ที่ deploy

### ❌ Error: "YouTube API quota exceeded"
→ รอ 24 ชม. หรือขอ increase quota ใน Google Console

### ❌ Login loop / Cannot authenticate
→ ตรวจสอบ SESSION_SECRET และลองล้าง cookies

---

## 🎉 Done!

ตอนนี้ระบบ Admin Monitor ของคุณพร้อมใช้งานแล้ว! 🚀

### Next Steps:
- เพิ่ม users เข้าระบบ
- ตั้งค่า Telegram notification
- ปรับแต่ง UI ตามต้องการ
- เพิ่มฟีเจอร์ใหม่ๆ

---

## 📞 Support

หากมีปัญหา:
1. อ่าน README.md
2. เช็ค logs: `npm run tail`
3. ดู Cloudflare Dashboard: https://dash.cloudflare.com/
4. สอบถามใน GitHub Issues
