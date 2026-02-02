# 🔄 GitHub Actions Auto-Deploy Setup

คู่มือการตั้งค่า GitHub Actions เพื่อ auto-deploy ทุกครั้งที่ push to main branch

## 📋 Prerequisites

- Repository บน GitHub
- Cloudflare Account พร้อม API Token

---

## 🔑 Step 1: Get Cloudflare API Token

### 1.1 ไปที่ Cloudflare Dashboard

https://dash.cloudflare.com/profile/api-tokens

### 1.2 สร้าง API Token ใหม่

1. คลิก "Create Token"
2. เลือก "Custom Token"
3. ตั้งค่า:
   - **Token name**: `GitHub Actions Deploy`
   - **Permissions**:
     - Account → Workers Scripts → Edit
     - Account → Workers KV Storage → Edit
     - Account → D1 → Edit
   - **Account Resources**: Include → Your account
   - **Zone Resources**: All zones (หรือเลือกเฉพาะ zone ที่ต้องการ)
4. คลิก "Continue to summary"
5. คลิก "Create Token"
6. **คัดลอก Token** (จะแสดงแค่ครั้งเดียว!)

### 1.3 Get Account ID

1. ไปที่ Cloudflare Dashboard: https://dash.cloudflare.com/
2. เลือก Workers & Pages (หรือ account ใดๆ)
3. ดู URL: `https://dash.cloudflare.com/{account_id}/...`
4. **คัดลอก Account ID** (ตัวเลขยาวๆ)

---

## 🔐 Step 2: Add Secrets to GitHub

### 2.1 ไปที่ Repository Settings

1. เปิด repository บน GitHub
2. ไปที่ "Settings" → "Secrets and variables" → "Actions"

### 2.2 Add Repository Secrets

คลิก "New repository secret" และเพิ่ม:

#### Secret 1: CLOUDFLARE_API_TOKEN
- Name: `CLOUDFLARE_API_TOKEN`
- Value: (ใส่ API Token ที่ได้จาก Step 1.2)

#### Secret 2: CLOUDFLARE_ACCOUNT_ID
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Value: (ใส่ Account ID ที่ได้จาก Step 1.3)

---

## 📝 Step 3: Verify Workflow File

ตรวจสอบว่าไฟล์ `.github/workflows/deploy.yml` มีอยู่และถูกต้อง:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Notify deployment
        run: |
          echo "✅ Deployment completed successfully!"
```

---

## 🚀 Step 4: Test Auto-Deploy

### 4.1 Commit & Push

```bash
git add .
git commit -m "Setup GitHub Actions auto-deploy"
git push origin main
```

### 4.2 Check Workflow Status

1. ไปที่ repository บน GitHub
2. คลิกที่ "Actions" tab
3. จะเห็น workflow "Deploy to Cloudflare Workers" กำลังทำงาน
4. คลิกเข้าไปดู logs

### 4.3 Verify Deployment

ถ้า deployment สำเร็จ จะเห็น:
- ✅ สีเขียว
- ข้อความ "Deployment completed successfully!"

เปิดเว็บไซต์: `https://your-worker.workers.dev`

---

## 🔄 Workflow Triggers

Workflow จะทำงานเมื่อ:
- ✅ Push to `main` branch
- ✅ Merge Pull Request เข้า `main`

**ไม่ทำงานเมื่อ:**
- Push to branch อื่นๆ (dev, feature/*)
- Draft Pull Requests

---

## ⚙️ Advanced: Customize Workflow

### Deploy เฉพาะเมื่อมีการแก้ไขไฟล์สำคัญ

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'wrangler.toml'
      - 'package.json'
```

### Deploy to Staging & Production

```yaml
on:
  push:
    branches:
      - main
      - staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # ... (same as above)
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
```

### เพิ่ม Slack/Discord Notification

```yaml
      - name: Notify Slack
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Deployment to Cloudflare Workers successful!"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 🐛 Troubleshooting

### ❌ Error: "Authentication error"
→ ตรวจสอบ CLOUDFLARE_API_TOKEN ใน GitHub Secrets

### ❌ Error: "Account not found"
→ ตรวจสอบ CLOUDFLARE_ACCOUNT_ID ใน GitHub Secrets

### ❌ Error: "Wrangler configuration error"
→ ตรวจสอบ wrangler.toml (ต้องมี database_id, kv id ที่ถูกต้อง)

### ❌ Workflow ไม่ทำงาน
→ ตรวจสอบว่า:
1. Push ไป `main` branch จริงๆ
2. ไฟล์ `.github/workflows/deploy.yml` อยู่ใน main branch
3. Repository มี Actions enabled (Settings → Actions → Allow all actions)

---

## 📊 Monitor Deployments

### View Deployment History

1. GitHub: "Actions" tab
2. เห็น history ของทุก deployment
3. คลิกเข้าไปดู logs แต่ละ deployment

### View Live Logs

เปิด Terminal และรัน:

```bash
npm run tail
```

---

## 🎉 Done!

ตอนนี้ทุกครั้งที่คุณ push code ไป main branch ระบบจะ auto-deploy ไปบน Cloudflare Workers อัตโนมัติ! 🚀

### Workflow:
1. แก้ไขโค้ด locally
2. `git add .`
3. `git commit -m "Update feature"`
4. `git push origin main`
5. ✅ GitHub Actions จะ deploy ให้อัตโนมัติ
6. 🎊 เว็บไซต์อัพเดทใน ~1 นาที

---

## 💡 Best Practices

1. **Always test locally first**: `npm run dev`
2. **Use branches**: สร้าง feature branches แล้วค่อย merge เข้า main
3. **Review logs**: เช็ค Actions tab หลัง deploy
4. **Monitor errors**: ตั้ง notification ถ้ามี deployment failures
5. **Protect main branch**: Settings → Branches → Add rule (require PR reviews)

---

## 📞 Support

หากมีปัญหา:
1. อ่าน Troubleshooting section
2. เช็ค GitHub Actions logs
3. เช็ค Cloudflare Dashboard
4. สอบถามใน GitHub Issues
