# ⚡ Quick Start Guide

คู่มือเริ่มต้นใช้งานแบบเร็ว สำหรับคนที่ต้องการ deploy ทันที!

---

## 🎯 ขั้นตอนที่ 1: เตรียมข้อมูล (5 นาที)

### สิ่งที่ต้องมี:
- ✅ Cloudflare Account (ฟรี)
- ✅ Google Cloud Account (ฟรี)
- ✅ YouTube API Key
- ✅ Git & Node.js installed

---

## 🚀 ขั้นตอนที่ 2: Setup โปรเจค (10 นาที)

### 1. Clone & Install

```bash
git clone <your-repo>
cd admin-monitor
npm install
```

### 2. Login Cloudflare

```bash
npx wrangler login
```

### 3. สร้าง Database

```bash
# สร้าง D1
npx wrangler d1 create admin_monitor_db

# คัดลอก database_id ไปใส่ใน wrangler.toml

# รัน schema
npx wrangler d1 execute admin_monitor_db --file=./schema.sql
```

### 4. สร้าง KV (Cache)

```bash
npx wrangler kv:namespace create "CACHE"

# คัดลอก id ไปใส่ใน wrangler.toml
```

---

## 🔑 ขั้นตอนที่ 3: Setup Keys (10 นาที)

### 1. Google Cloud Console

https://console.cloud.google.com/

1. สร้าง project ใหม่
2. Enable YouTube Data API v3
3. สร้าง API Key → คัดลอก
4. สร้าง OAuth 2.0 Client ID:
   - Web application
   - Redirect URI: `http://localhost:8787/auth/google/callback`
   - คัดลอก Client ID + Secret

### 2. ตั้งค่า Secrets

```bash
# YouTube
npx wrangler secret put YOUTUBE_API_KEY
# ← paste YouTube API Key

# Google OAuth
npx wrangler secret put GOOGLE_CLIENT_ID
# ← paste Client ID

npx wrangler secret put GOOGLE_CLIENT_SECRET
# ← paste Client Secret

# Session
npx wrangler secret put SESSION_SECRET
# ← paste random string (32+ chars)
```

### 3. Telegram (Optional)

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_GROUP_ID
```

---

## 🧪 ขั้นตอนที่ 4: ทดสอบ Local (5 นาที)

```bash
npm run dev
```

เปิด: http://localhost:8787

ทดสอบ:
- ✅ Login ด้วย Google
- ✅ เพิ่ม YouTube URL
- ✅ ดูรายการงาน

---

## 🌐 ขั้นตอนที่ 5: Deploy Production (2 นาที)

```bash
npm run deploy
```

จะได้ URL: `https://admin-monitor.xxx.workers.dev`

### อัพเดท OAuth Redirect

1. กลับไป Google Cloud Console
2. แก้ไข OAuth Client
3. เพิ่ม redirect URI: `https://admin-monitor.xxx.workers.dev/auth/google/callback`

---

## 🎉 เสร็จแล้ว!

เข้าใช้งานที่: `https://admin-monitor.xxx.workers.dev`

---

## 📖 Next Steps

### Setup GitHub Auto-Deploy

อ่าน: `GITHUB_SETUP.md`

### Setup CRON Auto-Check

แก้ไข `wrangler.toml`:

```toml
[triggers]
crons = ["*/5 * * * *"]
```

### ดู Logs

```bash
npm run tail
```

---

## 🆘 ติดปัญหา?

1. อ่าน `README.md` (ละเอียด)
2. อ่าน `DEPLOYMENT.md` (step by step)
3. เช็ค logs: `npm run tail`
4. เช็ค Cloudflare Dashboard

---

## 📊 สรุปเวลา

- ⏱️ Setup: ~30 นาที
- ⏱️ Deploy: ~2 นาที
- ⏱️ Total: **~35 นาที**

---

## 🎯 Features

✅ Google OAuth Login  
✅ YouTube Stats Monitor  
✅ Auto-check CRON  
✅ Telegram Notifications  
✅ Activity Logs  
✅ Modern Dark UI  
✅ Git Deploy Workflow  

---

Made with ❤️ by Claude
