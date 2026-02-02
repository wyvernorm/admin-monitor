# Admin Monitor v2.0 - Cloudflare Workers

Social Media Stats Dashboard สำหรับ YouTube, TikTok, Facebook, Instagram

## 🚀 Features

### YouTube
- ✅ ดูสถิติวิดีโอ/ช่อง (Views, Likes, Subscribers)
- ✅ สรุปงาน (3in1 HQ, Normal, Minute, Subscriber)

### TikTok  
- ✅ ดูสถิติวิดีโอ (Views, Likes, Shares, Saves)
- ✅ สรุปงานเดี่ยว
- ✅ สรุปงานรวม (หลายประเภท)
- ✅ Follower Summary

### Facebook
- ✅ ดูสถิติโพสต์/เพจ (Reactions, Views, Shares)
- ✅ สรุปงานเดี่ยว
- ✅ สรุปหลายรายการ (Batch)

### Instagram
- ✅ ดูสถิติโพสต์/โปรไฟล์ (Likes, Comments, Views, Followers)
- ✅ สรุปงานเดี่ยว
- ✅ สรุปหลายรายการ (Batch)

### Monitor System
- ✅ YouTube Order Tracking
- ✅ Auto-check completion
- ✅ Telegram notifications
- ✅ Dashboard overview

### Templates
- ✅ บันทึก/โหลด Template
- ✅ รองรับทุก Platform

## 📦 Tech Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **Database:** Cloudflare D1
- **Cache:** Cloudflare KV
- **APIs:** YouTube Data API, Apify, RapidAPI

## 🛠️ Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create D1 Database
```bash
wrangler d1 create admin_monitor_db
```
Copy the `database_id` to `wrangler.toml`

### 3. Create KV Namespace
```bash
wrangler kv:namespace create ADMIN_MONITOR_CACHE
```
Copy the `id` to `wrangler.toml`

### 4. Run Migration
```bash
wrangler d1 execute admin_monitor_db --file=./schema.sql
```

### 5. Set Secrets
```bash
wrangler secret put YOUTUBE_API_KEY
wrangler secret put APIFY_TOKEN
wrangler secret put APIFY2_TOKEN
wrangler secret put APIFY3_TOKEN
wrangler secret put RAPIDAPI_KEY
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_GROUP_ID
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put SESSION_SECRET
```

### 6. Deploy
```bash
npm run deploy
```

## 🔧 Development

```bash
npm run dev
```

## 📁 Project Structure

```
admin-monitor/
├── src/
│   ├── index.ts          # Main entry
│   ├── routes/
│   │   ├── youtube.ts    # YouTube APIs
│   │   ├── tiktok.ts     # TikTok APIs
│   │   ├── facebook.ts   # Facebook APIs
│   │   ├── instagram.ts  # Instagram APIs
│   │   ├── monitor.ts    # Monitor APIs
│   │   ├── templates.ts  # Templates APIs
│   │   └── auth.ts       # Google OAuth
│   └── views/
│       └── index.ts      # HTML Template
├── schema.sql            # D1 Schema
├── wrangler.toml         # Config
├── package.json
└── tsconfig.json
```

## 🔑 API Endpoints

### YouTube
- `POST /api/youtube/stats` - Get video/channel stats
- `POST /api/youtube/summary` - Generate summary

### TikTok
- `POST /api/tiktok/stats` - Get video stats
- `POST /api/tiktok/follower` - Get follower count
- `POST /api/tiktok/summary` - Generate single summary
- `POST /api/tiktok/summary-all` - Generate all-in-one summary
- `POST /api/tiktok/follower-summary` - Generate follower summary

### Facebook
- `POST /api/facebook/stats` - Get post/page stats
- `POST /api/facebook/summary` - Generate summary
- `POST /api/facebook/batch-summary` - Generate batch summary

### Instagram
- `POST /api/instagram/stats` - Get post/profile stats
- `POST /api/instagram/summary` - Generate summary
- `POST /api/instagram/batch-summary` - Generate batch summary

### Monitor
- `GET /api/monitor/orders` - Get all orders
- `POST /api/monitor/orders` - Add new order
- `DELETE /api/monitor/orders/:id` - Delete order
- `POST /api/monitor/check-all` - Check all orders
- `GET /api/monitor/dashboard` - Get dashboard data

### Templates
- `GET /api/templates/:platform` - Get templates by platform
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

## 📝 License

MIT
