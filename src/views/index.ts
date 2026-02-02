import { styles } from './styles';
import { scripts } from './scripts';

export function renderIndex(): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Monitor</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>${styles}</style>
</head>
<body>
  <div id="login-page" class="login">
    <div class="login-box">
      <div class="login-logo">📊</div>
      <h1 style="font-size:28px;font-weight:800;margin-bottom:8px">Admin Monitor</h1>
      <p style="color:var(--muted);font-size:14px;margin-bottom:36px">ระบบจัดการและติดตามงาน Social Media</p>
      <button class="btn-google" onclick="location.href='/api/auth/login'">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        เข้าสู่ระบบด้วย Google
      </button>
    </div>
  </div>

  <div id="main-app" class="app hidden">
    <!-- Mobile Header -->
    <div class="mobile-header">
      <div class="mobile-logo"><div class="mobile-logo-icon">📊</div><span>Admin Monitor</span></div>
      <button class="hamburger" onclick="toggleMobileNav()"><span></span><span></span><span></span></button>
    </div>
    <!-- Mobile Nav -->
    <div class="mobile-nav" id="mobile-nav">
      <div class="user-box"><div class="avatar" id="mobile-avatar">?</div><div style="flex:1;min-width:0"><div id="mobile-user-name" class="user-name">Loading...</div><div id="mobile-user-email" class="user-email"></div></div><button onclick="logout()" class="logout-btn">ออก</button></div>
      <div class="menu-item active" data-page="dashboard" onclick="mobileGoTo('dashboard')"><span class="menu-icon">📊</span>Dashboard</div>
      <div class="menu-item" data-page="monitor" onclick="mobileGoTo('monitor')"><span class="menu-icon">🧠</span>งานตรวจสอบ<span id="mobile-monitor-badge" class="menu-badge hidden">0</span></div>
      <div class="menu-item" data-page="youtube" onclick="mobileGoTo('youtube')"><span class="menu-icon">📺</span>YouTube</div>
      <div class="menu-item" data-page="tiktok" onclick="mobileGoTo('tiktok')"><span class="menu-icon">🎵</span>TikTok</div>
      <div class="menu-item" data-page="facebook" onclick="mobileGoTo('facebook')"><span class="menu-icon">📘</span>Facebook</div>
      <div class="menu-item" data-page="instagram" onclick="mobileGoTo('instagram')"><span class="menu-icon">📷</span>Instagram</div>
      <div class="menu-item" data-page="logs" onclick="mobileGoTo('logs')"><span class="menu-icon">📜</span>Activity Logs</div>
      <div class="menu-item" data-page="calendar" onclick="mobileGoTo('calendar')"><span class="menu-icon">📅</span>ปฏิทินแจ้งเตือน</div>
      <div class="menu-item" data-page="botorder" onclick="mobileGoTo('botorder')"><span class="menu-icon">🤖</span>บอทออเดอร์</div>
    </div>
    <aside class="sidebar">
      <div class="logo-box"><div class="logo-icon">📊</div><div><div class="logo-text">Admin Monitor</div><div class="logo-ver">v3.0</div></div></div>
      <div class="user-box">
        <div class="avatar" id="user-avatar">?</div>
        <div style="flex:1;min-width:0">
          <div id="user-name" class="user-name">Loading...</div>
          <div id="user-email" class="user-email"></div>
          <div class="user-level">
            <span id="user-level-badge" class="level-badge">Lv.1</span>
            <div class="xp-bar"><div id="user-xp-fill" class="xp-fill" style="width:0%"></div></div>
          </div>
        </div>
        <button onclick="logout()" class="logout-btn">ออก</button>
      </div>
      <div id="user-badges" class="user-badges"></div>
      <div class="menu-group"><div class="menu-label">หน้าหลัก</div>
        <div class="menu-item active" data-page="dashboard"><span class="menu-icon">📊</span>Dashboard</div>
        <div class="menu-item" data-page="monitor"><span class="menu-icon">🧠</span>งานตรวจสอบ<span id="monitor-badge" class="menu-badge hidden">0</span></div>
      </div>
      <div class="menu-group"><div class="menu-label">แพลตฟอร์ม</div>
        <div class="menu-item" data-page="youtube"><span class="menu-icon">📺</span>YouTube</div>
        <div class="menu-item" data-page="tiktok"><span class="menu-icon">🎵</span>TikTok</div>
        <div class="menu-item" data-page="facebook"><span class="menu-icon">📘</span>Facebook</div>
        <div class="menu-item" data-page="instagram"><span class="menu-icon">📷</span>Instagram</div>
      </div>
      <div class="menu-group"><div class="menu-label">ระบบ</div>
        <div class="menu-item" data-page="logs"><span class="menu-icon">📜</span>Activity Logs</div>
        <div class="menu-item" data-page="calendar"><span class="menu-icon">📅</span>ปฏิทินแจ้งเตือน</div>
        <div class="menu-item" data-page="botorder"><span class="menu-icon">🤖</span>บอทออเดอร์</div>
      </div>
    </aside>
    <main class="main">
      <!-- Dashboard -->
      <div id="page-dashboard" class="page page-dashboard active">
        <div class="hero"><div class="hero-title">👋 Welcome back!</div><div class="hero-sub">Admin Monitor Dashboard - จัดการและติดตามงานทั้งหมด</div></div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-icon c1">📦</div><div class="stat-val" id="stat-total" style="color:var(--accent)">0</div><div class="stat-lbl">ออเดอร์ทั้งหมด</div></div>
          <div class="stat-card"><div class="stat-icon c2">⏳</div><div class="stat-val" id="stat-running" style="color:var(--blue)">0</div><div class="stat-lbl">กำลังทำงาน</div><div class="live-badge"><span class="live-dot"></span>Live</div></div>
          <div class="stat-card"><div class="stat-icon c3">✅</div><div class="stat-val" id="stat-done" style="color:var(--purple)">0</div><div class="stat-lbl">เสร็จแล้ว</div></div>
          <div class="stat-card"><div class="stat-icon c4">📈</div><div class="stat-val" id="stat-rate" style="color:var(--pink)">0%</div><div class="stat-lbl">อัตราสำเร็จ</div></div>
        </div>
        <div class="section-header"><div class="section-title"><span class="live-dot"></span>งานล่าสุด</div><button class="refresh-btn" onclick="refreshOrders()">🔄 รีเฟรช</button></div>
        <div id="dash-orders"></div>
      </div>

      <!-- Monitor -->
      <div id="page-monitor" class="page">
        <div class="hero"><div class="hero-title">🧠 งานที่กำลังตรวจสอบ</div><div class="hero-sub">ติดตาม YouTube views และ likes แบบ real-time</div></div>
        <div class="monitor-grid">
          <div class="form-box">
            <div class="form-title">➕ เพิ่มงานใหม่</div>
            <div class="inp-grp"><span class="inp-icon">🔗</span><input class="inp" id="m-url" placeholder="https://www.youtube.com/watch?v=..." /></div>
            <div class="inp-grp"><span class="inp-icon">💬</span><input class="inp" id="m-line" placeholder="LINE ID (optional)" /></div>
            <div class="chk-row">
              <label class="chk-card"><input type="checkbox" id="m-chk-v" checked onchange="document.getElementById('m-view').disabled=!this.checked"><span class="checkbox-label">👀 วิว</span></label>
              <label class="chk-card"><input type="checkbox" id="m-chk-l" onchange="document.getElementById('m-like').disabled=!this.checked"><span class="checkbox-label">👍 ไลค์</span></label>
            </div>
            <div class="tgt-row">
              <div class="inp-grp"><span class="inp-icon">👀</span><input class="inp" id="m-view" type="number" placeholder="100" /></div>
              <div class="inp-grp"><span class="inp-icon">👍</span><input class="inp" id="m-like" type="number" placeholder="เป้าไลค์" disabled /></div>
            </div>
            <button class="submit-btn" onclick="handleAddMonitor()">🚀 เพิ่มงาน</button>
            <div id="m-status" class="status-box hidden"></div>
          </div>
          <div>
            <div class="section-header"><div class="section-title"><span class="live-dot"></span>รายการงาน</div><button class="refresh-btn" onclick="refreshOrders()">🔄 รีเฟรช</button></div>
            <div class="filter-bar">
              <div class="search-box"><span class="search-icon">🔍</span><input id="order-search" placeholder="ค้นหา URL, LINE ID..." oninput="filterOrders()"/></div>
              <select id="order-filter" class="filter-select" onchange="filterOrders()">
                <option value="all">📋 ทั้งหมด</option>
                <option value="running">⏳ กำลังทำงาน</option>
                <option value="done">✅ เสร็จแล้ว</option>
                <option value="pending">⏸️ รอดำเนินการ</option>
              </select>
            </div>
            <div id="order-count" class="order-count"></div>
            <div id="orders-list"></div>
          </div>
        </div>
      </div>

      <!-- YouTube (Tabs) -->
      <div id="page-youtube" class="page">
        <div class="hero" style="background:linear-gradient(135deg,rgba(255,0,0,.1),rgba(255,0,0,.02))">
          <div class="hero-title">📺 YouTube</div>
          <div class="hero-sub">ดูสถิติและสรุปงาน YouTube</div>
        </div>
        <div class="tabs">
          <button class="tab active" onclick="switchTab('youtube','stats')">🔍 ดูสถิติ</button>
          <button class="tab" onclick="switchTab('youtube','summary')">🧾 สรุปงาน</button>
        </div>
        <div id="youtube-tab-stats" class="tab-content active">
          <div class="card">
            <div class="card-title">🔍 ดูสถิติ YouTube</div>
            <div class="form-group"><label class="form-label">YouTube URL</label><input id="yt-s-url" placeholder="URL วิดีโอ/ช่อง" /></div>
            <button class="btn" onclick="handleGetYTStats()">🔍 ดึงข้อมูล</button>
            <div id="yt-s-result" class="status-box hidden"></div>
          </div>
        </div>
        <div id="youtube-tab-summary" class="tab-content">
          <div class="card">
            <div class="card-title">🧾 สรุปงาน YouTube</div>
            <div class="form-group"><label class="form-label">YouTube URL</label><input id="yt-url" placeholder="URL วิดีโอ" /></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">รูปแบบงาน</label><select id="yt-type" onchange="updateYTPkg()"><option value="3in1-hq">3 in 1 (HQ)</option><option value="3in1-normal">3 in 1 (ทั่วไป)</option><option value="hq">HQ</option><option value="normal">ทั่วไป</option><option value="minute">นาที</option><option value="subscriber">Subscriber #1</option></select></div>
              <div class="form-group"><label class="form-label">แพ็คเกจ</label><select id="yt-pkg"></select></div>
            </div>
            <div class="form-row">
              <button class="btn" onclick="handleGenYT()">🧾 สรุปงาน</button>
              <button class="btn btn-secondary" id="yt-add-btn" onclick="addYTToMonitor()" style="display:none">➕ เพิ่มไป Monitor</button>
            </div>
            <div id="yt-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('yt-text')">📋</button></div><div id="yt-content" class="summary-content"></div></div>
            <textarea id="yt-text" class="hidden"></textarea>
          </div>
        </div>
      </div>

      <!-- TikTok (Tabs) -->
      <div id="page-tiktok" class="page">
        <div class="hero" style="background:linear-gradient(135deg,rgba(0,217,255,.1),rgba(0,217,255,.02))">
          <div class="hero-title">🎵 TikTok</div>
          <div class="hero-sub">สรุปงาน TikTok ทุกรูปแบบ</div>
        </div>
        <div class="tabs">
          <button class="tab active" onclick="switchTab('tiktok','single')">🎵 สรุปเดี่ยว</button>
          <button class="tab" onclick="switchTab('tiktok','all')">🎁 สรุปรวม</button>
          <button class="tab" onclick="switchTab('tiktok','follower')">👥 Follower</button>
        </div>
        <div id="tiktok-tab-single" class="tab-content active">
          <div class="card">
            <div class="card-title">🎵 สรุปงาน TikTok (เดี่ยว)</div>
            <div class="form-group"><label class="form-label">TikTok URL</label><textarea id="tt-urls" rows="3" placeholder="ใส่ URL ได้หลายบรรทัด"></textarea></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">ประเภท</label><select id="tt-type"><option value="view">วิว</option><option value="like">ไลค์</option><option value="save">เซฟ</option><option value="share">แชร์</option></select></div>
              <div class="form-group"><label class="form-label">จำนวน</label><input id="tt-amt" type="number" placeholder="1000" /></div>
            </div>
            <button class="btn" onclick="handleGenTT()">🧾 สรุปงาน</button>
            <div id="tt-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('tt-text')">📋</button></div><div id="tt-content" class="summary-content"></div></div>
            <textarea id="tt-text" class="hidden"></textarea>
          </div>
        </div>
        <div id="tiktok-tab-all" class="tab-content">
          <div class="card">
            <div class="card-title">🎁 สรุปงาน TikTok (รวม)</div>
            <div class="form-group"><label class="form-label">TikTok URL</label><textarea id="tta-urls" rows="3" placeholder="ใส่ URL ได้หลายบรรทัด"></textarea></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label"><input type="checkbox" id="tta-v" checked> 👀 View</label><select id="tta-vt" class="mt-2"><option value="">คละ</option><option value="th">#TH</option></select><input id="tta-va" type="number" placeholder="5000" class="mt-2" /></div>
              <div class="form-group"><label class="form-label"><input type="checkbox" id="tta-l" checked> 👍 Like</label><select id="tta-lt" class="mt-2"><option value="1">#1</option><option value="hq">#HQ</option><option value="th">#TH</option></select><input id="tta-la" type="number" placeholder="4000" class="mt-2" /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label"><input type="checkbox" id="tta-sv"> 💾 Save</label><input id="tta-sva" type="number" placeholder="200" class="mt-2" /></div>
              <div class="form-group"><label class="form-label"><input type="checkbox" id="tta-sh"> 🔗 Share</label><input id="tta-sha" type="number" placeholder="300" class="mt-2" /></div>
            </div>
            <button class="btn" onclick="handleGenTTAll()">🎁 สรุปงาน</button>
            <div id="tta-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('tta-text')">📋</button></div><div id="tta-content" class="summary-content"></div></div>
            <textarea id="tta-text" class="hidden"></textarea>
          </div>
        </div>
        <div id="tiktok-tab-follower" class="tab-content">
          <div class="card">
            <div class="card-title">👥 Follower TikTok</div>
            <div class="form-group"><label class="form-label">TikTok Profile URL</label><textarea id="ttf-urls" rows="3" placeholder="https://www.tiktok.com/@username"></textarea></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">ชนิด</label><select id="ttf-type"><option value="normal">#1</option><option value="hq">#HQ</option><option value="th">#TH</option></select></div>
              <div class="form-group"><label class="form-label">จำนวน</label><input id="ttf-amt" type="number" placeholder="1000" /></div>
            </div>
            <button class="btn" onclick="handleGenTTF()">🧾 สรุปงาน</button>
            <div id="ttf-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('ttf-text')">📋</button></div><div id="ttf-content" class="summary-content"></div></div>
            <textarea id="ttf-text" class="hidden"></textarea>
          </div>
        </div>
      </div>

      <!-- Facebook (Tabs) -->
      <div id="page-facebook" class="page">
        <div class="hero" style="background:linear-gradient(135deg,rgba(24,119,242,.1),rgba(24,119,242,.02))">
          <div class="hero-title">📘 Facebook</div>
          <div class="hero-sub">ดูสถิติและสรุปงาน Facebook</div>
        </div>
        <div class="tabs">
          <button class="tab active" onclick="switchTab('facebook','stats')">🔍 ดูสถิติ</button>
          <button class="tab" onclick="switchTab('facebook','summary')">🧾 สรุปงาน</button>
          <button class="tab" onclick="switchTab('facebook','batch')">📋 สรุปหลายรายการ</button>
        </div>
        <div id="facebook-tab-stats" class="tab-content active">
          <div class="card">
            <div class="card-title">🔍 ดูสถิติ Facebook</div>
            <div class="form-group"><label class="form-label">Facebook URL</label><input id="fb-s-url" placeholder="URL โพสต์/เพจ/วิดีโอ/Reel" /></div>
            <p style="font-size:11px;color:var(--dim);margin-bottom:16px">💡 รองรับ: โพสต์, เพจ, /videos/, /reel/, /watch?v=, fb.watch</p>
            <button class="btn" onclick="handleGetFBStats()">🔍 ดึงข้อมูล</button>
            <div id="fb-s-result" class="status-box hidden"></div>
            <div id="fb-s-card" class="video-result-card hidden">
              <div class="video-thumb" id="fb-s-thumb"></div>
              <div class="video-info">
                <div class="video-title" id="fb-s-title"></div>
                <div class="video-meta" id="fb-s-meta"></div>
                <div class="video-stats-grid">
                  <div class="video-stat"><span class="video-stat-icon">👀</span><span class="video-stat-val" id="fb-s-views">0</span><span class="video-stat-lbl">Views</span></div>
                  <div class="video-stat"><span class="video-stat-icon">👍</span><span class="video-stat-val" id="fb-s-likes">0</span><span class="video-stat-lbl">Likes</span></div>
                  <div class="video-stat"><span class="video-stat-icon">💬</span><span class="video-stat-val" id="fb-s-comments">0</span><span class="video-stat-lbl">Comments</span></div>
                  <div class="video-stat"><span class="video-stat-icon">🔄</span><span class="video-stat-val" id="fb-s-shares">0</span><span class="video-stat-lbl">Shares</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="facebook-tab-summary" class="tab-content">
          <div class="card">
            <div class="card-title">🧾 สรุปงาน Facebook</div>
            <div class="form-group"><label class="form-label">Facebook URL</label><input id="fb-url" placeholder="URL โพสต์/เพจ" /></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">รูปแบบ</label><select id="fb-type"><option value="post-like-mix">ไลค์ (คละ)</option><option value="post-like-th1">ไลค์ #TH1</option><option value="post-like-th2">ไลค์ #TH2</option><option value="post-share">แชร์</option><option value="video-view">วิว</option><option value="page-follower-mix">ผู้ติดตาม</option></select></div>
              <div class="form-group"><label class="form-label">จำนวน</label><input id="fb-amt" type="number" placeholder="1000" /></div>
            </div>
            <div class="form-group"><label class="form-label">เริ่มต้น (ไม่จำเป็น)</label><input id="fb-start" type="number" placeholder="ดึงอัตโนมัติ" /></div>
            <button class="btn" onclick="handleGenFB()">🧾 สรุปงาน</button>
            <div id="fb-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('fb-text')">📋</button></div><div id="fb-content" class="summary-content"></div></div>
            <textarea id="fb-text" class="hidden"></textarea>
          </div>
        </div>
        <div id="facebook-tab-batch" class="tab-content">
          <div class="card">
            <div class="card-title">📋 สรุปหลายรายการ Facebook</div>
            <div class="form-group"><label class="form-label">Facebook URL</label><input id="fbb-url" placeholder="URL โพสต์" /></div>
            <div id="fbb-items"></div>
            <button class="btn btn-secondary" onclick="addFBItem()" style="margin-bottom:16px">➕ เพิ่มรายการ</button>
            <button class="btn" onclick="handleGenFBBatch()">🧾 สรุปงาน</button>
            <div id="fbb-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('fbb-text')">📋</button></div><div id="fbb-content" class="summary-content"></div></div>
            <textarea id="fbb-text" class="hidden"></textarea>
          </div>
        </div>
      </div>

      <!-- Instagram (Tabs) -->
      <div id="page-instagram" class="page">
        <div class="hero" style="background:linear-gradient(135deg,rgba(225,48,108,.1),rgba(225,48,108,.02))">
          <div class="hero-title">📷 Instagram</div>
          <div class="hero-sub">ดูสถิติและสรุปงาน Instagram</div>
        </div>
        <div class="tabs">
          <button class="tab active" onclick="switchTab('instagram','stats')">🔍 ดูสถิติ</button>
          <button class="tab" onclick="switchTab('instagram','summary')">🧾 สรุปงาน</button>
          <button class="tab" onclick="switchTab('instagram','batch')">📋 สรุปหลายรายการ</button>
        </div>
        <div id="instagram-tab-stats" class="tab-content active">
          <div class="card">
            <div class="card-title">🔍 ดูสถิติ Instagram</div>
            <div class="form-group"><label class="form-label">Instagram URL</label><input id="ig-s-url" placeholder="URL โพสต์/โปรไฟล์/Reel" /></div>
            <button class="btn" onclick="handleGetIGStats()">🔍 ดึงข้อมูล</button>
            <div id="ig-s-result" class="status-box hidden"></div>
          </div>
        </div>
        <div id="instagram-tab-summary" class="tab-content">
          <div class="card">
            <div class="card-title">🧾 สรุปงาน Instagram</div>
            <div class="form-group"><label class="form-label">Instagram URL</label><input id="ig-url" placeholder="URL" /></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">รูปแบบ</label><select id="ig-type"><option value="like">Like</option><option value="follower">Follower</option><option value="view">View</option></select></div>
              <div class="form-group"><label class="form-label">จำนวน</label><input id="ig-amt" type="number" placeholder="1000" /></div>
            </div>
            <button class="btn" onclick="handleGenIG()">🧾 สรุปงาน</button>
            <div id="ig-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('ig-text')">📋</button></div><div id="ig-content" class="summary-content"></div></div>
            <textarea id="ig-text" class="hidden"></textarea>
          </div>
        </div>
        <div id="instagram-tab-batch" class="tab-content">
          <div class="card">
            <div class="card-title">📋 สรุปหลายรายการ Instagram</div>
            <div class="form-group"><label class="form-label">Instagram URL</label><input id="igb-url" placeholder="https://www.instagram.com/reel/xxx" /></div>
            <p style="font-size:11px;color:var(--dim);margin-bottom:16px">💡 /reel/ จะแปลงเป็น /p/ | เลือกได้สูงสุด 2 รายการ</p>
            <div id="igb-items"></div>
            <button class="btn btn-secondary" onclick="addIGItem()" style="margin-bottom:16px">➕ เพิ่มรายการ</button>
            <button class="btn" onclick="handleGenIGBatch()">🧾 สรุปงาน</button>
            <div id="igb-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('igb-text')">📋</button></div><div id="igb-content" class="summary-content"></div></div>
            <textarea id="igb-text" class="hidden"></textarea>
          </div>
        </div>
      </div>

      <!-- Activity Logs -->
      <div id="page-logs" class="page">
        <div class="hero" style="background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(236,72,153,.08))">
          <div class="hero-title">📜 Activity Logs</div>
          <div class="hero-sub">ดูประวัติการใช้งานของทีม - คลิกที่ผู้ใช้เพื่อดูรายละเอียด</div>
        </div>
        <div class="logs-stats">
          <div class="logs-stat-card">
            <div class="logs-stat-icon" style="background:linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.05))">📊</div>
            <div class="logs-stat-info"><div class="logs-stat-value" id="logs-total">0</div><div class="logs-stat-label">กิจกรรมทั้งหมด</div></div>
          </div>
          <div class="logs-stat-card">
            <div class="logs-stat-icon" style="background:linear-gradient(135deg,rgba(59,130,246,.2),rgba(59,130,246,.05))">👥</div>
            <div class="logs-stat-info"><div class="logs-stat-value" id="logs-users">0</div><div class="logs-stat-label">ผู้ใช้งาน</div></div>
          </div>
          <div class="logs-stat-card">
            <div class="logs-stat-icon" style="background:linear-gradient(135deg,rgba(139,92,246,.2),rgba(139,92,246,.05))">📅</div>
            <div class="logs-stat-info"><div class="logs-stat-value" id="logs-today">0</div><div class="logs-stat-label">วันนี้</div></div>
          </div>
          <div class="logs-stat-card">
            <div class="logs-stat-icon" style="background:linear-gradient(135deg,rgba(236,72,153,.2),rgba(236,72,153,.05))">🔥</div>
            <div class="logs-stat-info"><div class="logs-stat-value" id="logs-week">0</div><div class="logs-stat-label">สัปดาห์นี้</div></div>
          </div>
        </div>
        <div class="logs-grid">
          <div class="card">
            <div class="card-header"><h3 style="font-size:15px;font-weight:600">📊 สถิติตาม Platform</h3></div>
            <div id="platform-stats"></div>
          </div>
          <div class="card">
            <div class="card-header"><h3 style="font-size:15px;font-weight:600">🏆 Top Contributors</h3><button class="btn btn-sm btn-secondary" onclick="refreshLogs()">🔄</button></div>
            <div id="leaderboard"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 style="font-size:15px;font-weight:600">📜 กิจกรรมล่าสุด</h3>
            <div class="logs-filters">
              <button class="filter-chip active" data-filter="all" onclick="filterLogs('all')">ทั้งหมด</button>
              <button class="filter-chip" data-filter="monitor" onclick="filterLogs('monitor')">🧠 Monitor</button>
              <button class="filter-chip" data-filter="youtube" onclick="filterLogs('youtube')">📺 YouTube</button>
              <button class="filter-chip" data-filter="tiktok" onclick="filterLogs('tiktok')">🎵 TikTok</button>
              <button class="filter-chip" data-filter="facebook" onclick="filterLogs('facebook')">📘 Facebook</button>
              <button class="filter-chip" data-filter="instagram" onclick="filterLogs('instagram')">📷 Instagram</button>
            </div>
          </div>
          <div class="logs-table-wrap">
            <table class="logs-table">
              <thead><tr><th style="width:180px">ผู้ใช้</th><th style="width:100px">Platform</th><th>กิจกรรม</th><th style="width:140px">เวลา</th></tr></thead>
              <tbody id="logs-tbody"></tbody>
            </table>
          </div>
          <div id="logs-empty" class="empty hidden"><div class="empty-icon">📜</div><div class="empty-title">ยังไม่มีกิจกรรม</div><div class="empty-desc">เริ่มใช้งานเพื่อบันทึกกิจกรรม</div></div>
        </div>
      </div>

    <!-- Calendar (External Link) -->
      <div id="page-calendar" class="page">
        <div class="hero" style="background:linear-gradient(135deg,rgba(251,146,60,.15),rgba(251,146,60,.05))">
          <div class="hero-title">📅 ปฏิทินแจ้งเตือน</div>
          <div class="hero-sub">ติดตามวันหมดอายุและกำหนดการต่างๆ</div>
        </div>
        <div class="calendar-link-card">
          <div class="calendar-icon">📅</div>
          <h3>Expiry Admin</h3>
          <p>ระบบจัดการวันหมดอายุสำหรับติดตามบริการต่างๆ</p>
          <div class="calendar-features">
            <span class="feature-tag">⏰ แจ้งเตือนอัตโนมัติ</span>
            <span class="feature-tag">📊 ดูสถิติ</span>
            <span class="feature-tag">🔔 LINE Notify</span>
          </div>
          <a href="https://expiry-admin-git.pages.dev/" target="_blank" class="btn calendar-btn">
            <span>เปิดปฏิทินแจ้งเตือน</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
          </a>
        </div>
      </div>

    <!-- Bot Order (External Link) -->
      <div id="page-botorder" class="page">
        <div class="hero" style="background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(99,102,241,.05))">
          <div class="hero-title">🤖 บอทออเดอร์</div>
          <div class="hero-sub">ระบบจัดการออเดอร์อัตโนมัติ</div>
        </div>
        <div class="calendar-link-card">
          <div class="calendar-icon">🤖</div>
          <h3>Bot Order Dashboard</h3>
          <p>ระบบจัดการออเดอร์และติดตามสถานะอัตโนมัติ</p>
          <a href="https://t.me/iPVS_Orders_Ai_bot" target="_blank" class="telegram-link">📱 @iPVS_Orders_Ai_bot</a>
          <div class="calendar-features">
            <span class="feature-tag">📦 จัดการออเดอร์</span>
            <span class="feature-tag">📊 Dashboard</span>
            <span class="feature-tag">⚡ อัตโนมัติ</span>
          </div>
          <a href="https://script.google.com/macros/s/AKfycbzBsBTVnNW4rWjQBh_JU70_A-JZ1WBtuXf_RRStnBTI8u3EcpU_2yLxbAS796LYrniDTg/exec?page=Dashboard" target="_blank" class="btn calendar-btn" style="background:linear-gradient(135deg,#6366f1,#4f46e5)">
            <span>เปิดบอทออเดอร์</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
          </a>
        </div>
      </div>

    </main>
  </div>

  <!-- User Detail Modal -->
  <div id="user-modal" class="modal-overlay hidden" onclick="if(event.target===this)closeUserModal()">
    <div class="modal-box"><div id="user-modal-content"></div></div>
  </div>

  ${scripts}
</body>
</html>`;
}
