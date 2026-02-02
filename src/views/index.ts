import { styles } from './styles';
import { scripts } from './scripts';

export function renderIndex(): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Monitor</title>
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
    <aside class="sidebar">
      <div class="logo-box"><div class="logo-icon">📊</div><div><div class="logo-text">Admin Monitor</div><div class="logo-ver">v2.5</div></div></div>
      <div class="user-box"><div class="avatar" id="user-avatar">?</div><div style="flex:1;min-width:0"><div id="user-name" class="user-name">Loading...</div><div id="user-email" class="user-email"></div></div><button onclick="logout()" class="logout-btn">ออก</button></div>
      <div class="menu-group"><div class="menu-label">หน้าหลัก</div>
        <div class="menu-item active" data-page="dashboard"><span class="menu-icon">📊</span>Dashboard</div>
        <div class="menu-item" data-page="monitor"><span class="menu-icon">🧠</span>งานตรวจสอบ</div>
      </div>
      <div class="menu-group"><div class="menu-label">YouTube</div>
        <div class="menu-item" data-page="yt-stats"><span class="menu-icon">📊</span>ดูสถิติ</div>
        <div class="menu-item" data-page="yt-summary"><span class="menu-icon">🧾</span>สรุปงาน</div>
      </div>
      <div class="menu-group"><div class="menu-label">TikTok</div>
        <div class="menu-item" data-page="tt-single"><span class="menu-icon">🎵</span>สรุปงาน (เดี่ยว)</div>
        <div class="menu-item" data-page="tt-all"><span class="menu-icon">🎁</span>สรุปงาน (รวม)</div>
        <div class="menu-item" data-page="tt-follower"><span class="menu-icon">👥</span>Follower</div>
      </div>
      <div class="menu-group"><div class="menu-label">Facebook</div>
        <div class="menu-item" data-page="fb-stats"><span class="menu-icon">📘</span>ดูสถิติ</div>
        <div class="menu-item" data-page="fb-summary"><span class="menu-icon">📝</span>สรุปงาน</div>
        <div class="menu-item" data-page="fb-batch"><span class="menu-icon">📋</span>สรุปหลายรายการ</div>
      </div>
      <div class="menu-group"><div class="menu-label">Instagram</div>
        <div class="menu-item" data-page="ig-stats"><span class="menu-icon">📷</span>ดูสถิติ</div>
        <div class="menu-item" data-page="ig-summary"><span class="menu-icon">📝</span>สรุปงาน</div>
        <div class="menu-item" data-page="ig-batch"><span class="menu-icon">📋</span>สรุปหลายรายการ</div>
      </div>
      <div class="menu-group"><div class="menu-label">ระบบ</div>
        <div class="menu-item" data-page="logs"><span class="menu-icon">📜</span>Activity Logs</div>
      </div>
    </aside>
    <main class="main">
      <!-- Dashboard -->
      <div id="page-dashboard" class="page active">
        <div class="hero"><div class="hero-title">👋 Welcome back!</div><div class="hero-sub">Admin Monitor Dashboard - จัดการและติดตามงานทั้งหมด</div></div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-icon c1">📦</div><div class="stat-val" id="stat-total" style="color:var(--accent)">0</div><div class="stat-lbl">ออเดอร์ทั้งหมด</div></div>
          <div class="stat-card"><div class="stat-icon c2">⏳</div><div class="stat-val" id="stat-running" style="color:var(--blue)">0</div><div class="stat-lbl">กำลังทำงาน</div><div class="live-badge"><span class="live-dot"></span>Live</div></div>
          <div class="stat-card"><div class="stat-icon c3">✅</div><div class="stat-val" id="stat-done" style="color:var(--purple)">0</div><div class="stat-lbl">เสร็จแล้ว</div></div>
          <div class="stat-card"><div class="stat-icon c4">📈</div><div class="stat-val" id="stat-rate" style="color:var(--pink)">0%</div><div class="stat-lbl">อัตราสำเร็จ</div></div>
        </div>
        <div class="actions-row">
          <div class="action-card" onclick="goTo('yt-summary')"><div class="action-icon">📺</div><div class="action-label">YouTube</div></div>
          <div class="action-card" onclick="goTo('tt-all')"><div class="action-icon">🎵</div><div class="action-label">TikTok</div></div>
          <div class="action-card" onclick="goTo('fb-summary')"><div class="action-icon">📘</div><div class="action-label">Facebook</div></div>
          <div class="action-card" onclick="goTo('ig-summary')"><div class="action-icon">📷</div><div class="action-label">Instagram</div></div>
          <div class="action-card" onclick="goTo('monitor')"><div class="action-icon">➕</div><div class="action-label">เพิ่มงาน</div></div>
          <div class="action-card" onclick="loadOrders();loadDash();toast('รีเฟรช!')"><div class="action-icon">🔄</div><div class="action-label">รีเฟรช</div></div>
        </div>
        <div class="section-header"><div class="section-title"><span class="live-dot"></span>งานล่าสุด</div><button class="refresh-btn" onclick="loadOrders()">🔄 รีเฟรช</button></div>
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
            <button class="submit-btn" onclick="addMonitor()">🚀 เพิ่มงาน</button>
            <div id="m-status" class="status-box hidden"></div>
          </div>
          <div>
            <div class="section-header"><div class="section-title"><span class="live-dot"></span>รายการงาน</div><button class="refresh-btn" onclick="loadOrders()">🔄 รีเฟรช</button></div>
            <div id="orders-list"></div>
          </div>
        </div>
      </div>

      <!-- YouTube Stats -->
      <div id="page-yt-stats" class="page">
        <div class="hero"><div class="hero-title">📊 ดูสถิติ YouTube</div><div class="hero-sub">ดึงข้อมูล views, likes จากวิดีโอหรือช่อง</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">YouTube URL</label><input id="yt-s-url" placeholder="URL วิดีโอ/ช่อง" /></div>
          <button class="btn" onclick="getYTStats()">🔍 ดึงข้อมูล</button>
          <div id="yt-s-result" class="status-box hidden"></div>
        </div>
      </div>

      <!-- YouTube Summary -->
      <div id="page-yt-summary" class="page">
        <div class="hero"><div class="hero-title">🧾 สรุปงาน YouTube</div><div class="hero-sub">สร้างสรุปงานสำหรับลูกค้า</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">YouTube URL</label><input id="yt-url" placeholder="URL วิดีโอ" /></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">รูปแบบงาน</label><select id="yt-type" onchange="updateYTPkg()"><option value="3in1-hq">3 in 1 (HQ)</option><option value="3in1-normal">3 in 1 (ทั่วไป)</option><option value="hq">HQ</option><option value="normal">ทั่วไป</option><option value="minute">นาที</option><option value="subscriber">Subscriber #1</option></select></div>
            <div class="form-group"><label class="form-label">แพ็คเกจ</label><select id="yt-pkg"></select></div>
          </div>
          <div class="form-row">
            <button class="btn" onclick="genYT()">🧾 สรุปงาน</button>
            <button class="btn btn-secondary" id="yt-add-btn" onclick="addYTToMonitor()" style="display:none">➕ เพิ่มไป Monitor</button>
          </div>
          <div id="yt-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('yt-text')">📋</button></div><div id="yt-content" class="summary-content"></div></div>
          <textarea id="yt-text" class="hidden"></textarea>
        </div>
      </div>

      <!-- TikTok Single -->
      <div id="page-tt-single" class="page">
        <div class="hero"><div class="hero-title">🎵 สรุปงาน TikTok (เดี่ยว)</div><div class="hero-sub">สรุปงานวิว/ไลค์/เซฟ/แชร์แบบเดี่ยว</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">TikTok URL</label><textarea id="tt-urls" rows="3" placeholder="ใส่ URL ได้หลายบรรทัด"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">ประเภท</label><select id="tt-type"><option value="view">วิว</option><option value="like">ไลค์</option><option value="save">เซฟ</option><option value="share">แชร์</option></select></div>
            <div class="form-group"><label class="form-label">จำนวน</label><input id="tt-amt" type="number" placeholder="1000" /></div>
          </div>
          <button class="btn" onclick="genTT()">🧾 สรุปงาน</button>
          <div id="tt-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('tt-text')">📋</button></div><div id="tt-content" class="summary-content"></div></div>
          <textarea id="tt-text" class="hidden"></textarea>
        </div>
      </div>

      <!-- TikTok All -->
      <div id="page-tt-all" class="page">
        <div class="hero"><div class="hero-title">🎁 สรุปงาน TikTok (รวม)</div><div class="hero-sub">สรุปงานหลายประเภทพร้อมกัน</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">TikTok URL</label><textarea id="tta-urls" rows="3" placeholder="ใส่ URL ได้หลายบรรทัด"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label"><input type="checkbox" id="tta-v" checked> 👀 View</label><select id="tta-vt" class="mt-2"><option value="">คละ</option><option value="th">#TH</option></select><input id="tta-va" type="number" placeholder="5000" class="mt-2" /></div>
            <div class="form-group"><label class="form-label"><input type="checkbox" id="tta-l" checked> 👍 Like</label><select id="tta-lt" class="mt-2"><option value="1">#1</option><option value="hq">#HQ</option><option value="th">#TH</option></select><input id="tta-la" type="number" placeholder="4000" class="mt-2" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label"><input type="checkbox" id="tta-sv"> 💾 Save</label><input id="tta-sva" type="number" placeholder="200" class="mt-2" /></div>
            <div class="form-group"><label class="form-label"><input type="checkbox" id="tta-sh"> 🔗 Share</label><input id="tta-sha" type="number" placeholder="300" class="mt-2" /></div>
          </div>
          <button class="btn" onclick="genTTAll()">🎁 สรุปงาน</button>
          <div id="tta-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('tta-text')">📋</button></div><div id="tta-content" class="summary-content"></div></div>
          <textarea id="tta-text" class="hidden"></textarea>
        </div>
      </div>

      <!-- TikTok Follower -->
      <div id="page-tt-follower" class="page">
        <div class="hero"><div class="hero-title">👥 Follower TikTok</div><div class="hero-sub">สรุปงาน Follower TikTok</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">TikTok Profile URL</label><textarea id="ttf-urls" rows="3" placeholder="https://www.tiktok.com/@username"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">ชนิด</label><select id="ttf-type"><option value="normal">#1</option><option value="hq">#HQ</option><option value="th">#TH</option></select></div>
            <div class="form-group"><label class="form-label">จำนวน</label><input id="ttf-amt" type="number" placeholder="1000" /></div>
          </div>
          <button class="btn" onclick="genTTF()">🧾 สรุปงาน</button>
          <div id="ttf-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('ttf-text')">📋</button></div><div id="ttf-content" class="summary-content"></div></div>
          <textarea id="ttf-text" class="hidden"></textarea>
        </div>
      </div>

      <!-- Facebook Stats -->
      <div id="page-fb-stats" class="page">
        <div class="hero"><div class="hero-title">📘 ดูสถิติ Facebook</div><div class="hero-sub">ดึงข้อมูลจากโพสต์หรือเพจ</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">Facebook URL</label><input id="fb-s-url" placeholder="URL โพสต์/เพจ" /></div>
          <button class="btn" onclick="getFBStats()">🔍 ดึงข้อมูล</button>
          <div id="fb-s-result" class="status-box hidden"></div>
        </div>
      </div>

      <!-- Facebook Summary -->
      <div id="page-fb-summary" class="page">
        <div class="hero"><div class="hero-title">📝 สรุปงาน Facebook</div><div class="hero-sub">สร้างสรุปงานสำหรับลูกค้า</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">Facebook URL</label><input id="fb-url" placeholder="URL โพสต์/เพจ" /></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">รูปแบบ</label><select id="fb-type"><option value="post-like-mix">ไลค์ (คละ)</option><option value="post-like-th1">ไลค์ #TH1</option><option value="post-like-th2">ไลค์ #TH2</option><option value="post-share">แชร์</option><option value="video-view">วิว</option><option value="page-follower-mix">ผู้ติดตาม</option></select></div>
            <div class="form-group"><label class="form-label">จำนวน</label><input id="fb-amt" type="number" placeholder="1000" /></div>
          </div>
          <div class="form-group"><label class="form-label">เริ่มต้น (ไม่จำเป็น)</label><input id="fb-start" type="number" placeholder="ดึงอัตโนมัติ" /></div>
          <button class="btn" onclick="genFB()">🧾 สรุปงาน</button>
          <div id="fb-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('fb-text')">📋</button></div><div id="fb-content" class="summary-content"></div></div>
          <textarea id="fb-text" class="hidden"></textarea>
        </div>
      </div>

      <!-- Facebook Batch -->
      <div id="page-fb-batch" class="page">
        <div class="hero"><div class="hero-title">📋 สรุปหลายรายการ Facebook</div><div class="hero-sub">สรุปงานหลายประเภทพร้อมกัน</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">Facebook URL</label><input id="fbb-url" placeholder="URL โพสต์" /></div>
          <div id="fbb-items"></div>
          <button class="btn btn-secondary" onclick="addFBItem()" style="margin-bottom:16px">➕ เพิ่มรายการ</button>
          <button class="btn" onclick="genFBBatch()">🧾 สรุปงาน</button>
          <div id="fbb-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('fbb-text')">📋</button></div><div id="fbb-content" class="summary-content"></div></div>
          <textarea id="fbb-text" class="hidden"></textarea>
        </div>
      </div>

      <!-- Instagram Stats -->
      <div id="page-ig-stats" class="page">
        <div class="hero"><div class="hero-title">📷 ดูสถิติ Instagram</div><div class="hero-sub">ดึงข้อมูลจากโพสต์หรือโปรไฟล์</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">Instagram URL</label><input id="ig-s-url" placeholder="URL โพสต์/โปรไฟล์/Reel" /></div>
          <button class="btn" onclick="getIGStats()">🔍 ดึงข้อมูล</button>
          <div id="ig-s-result" class="status-box hidden"></div>
        </div>
      </div>

      <!-- Instagram Summary -->
      <div id="page-ig-summary" class="page">
        <div class="hero"><div class="hero-title">📝 สรุปงาน Instagram</div><div class="hero-sub">สร้างสรุปงานสำหรับลูกค้า</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">Instagram URL</label><input id="ig-url" placeholder="URL" /></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">รูปแบบ</label><select id="ig-type"><option value="like">Like</option><option value="follower">Follower</option><option value="view">View</option></select></div>
            <div class="form-group"><label class="form-label">จำนวน</label><input id="ig-amt" type="number" placeholder="1000" /></div>
          </div>
          <button class="btn" onclick="genIG()">🧾 สรุปงาน</button>
          <div id="ig-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('ig-text')">📋</button></div><div id="ig-content" class="summary-content"></div></div>
          <textarea id="ig-text" class="hidden"></textarea>
        </div>
      </div>

      <!-- Instagram Batch -->
      <div id="page-ig-batch" class="page">
        <div class="hero"><div class="hero-title">📋 สรุปหลายรายการ Instagram</div><div class="hero-sub">สรุปงานหลายประเภทพร้อมกัน</div></div>
        <div class="card">
          <div class="form-group"><label class="form-label">Instagram URL</label><input id="igb-url" placeholder="https://www.instagram.com/reel/xxx" /></div>
          <p style="font-size:11px;color:var(--dim);margin-bottom:16px">💡 /reel/ จะแปลงเป็น /p/ | เลือกได้สูงสุด 2 รายการ</p>
          <div id="igb-items"></div>
          <button class="btn btn-secondary" onclick="addIGItem()" style="margin-bottom:16px">➕ เพิ่มรายการ</button>
          <button class="btn" onclick="genIGBatch()">🧾 สรุปงาน</button>
          <div id="igb-card" class="summary-card hidden"><div class="summary-actions"><button class="icon-btn" onclick="copy('igb-text')">📋</button></div><div id="igb-content" class="summary-content"></div></div>
          <textarea id="igb-text" class="hidden"></textarea>
        </div>
      </div>

      <!-- Activity Logs -->
      <div id="page-logs" class="page">
        <!-- Overview Section -->
        <div id="logs-overview">
          <div class="hero" style="background:linear-gradient(135deg,rgba(139,92,246,.1),rgba(236,72,153,.05))"><div class="hero-title">📜 Activity Logs</div><div class="hero-sub">ดูประวัติการใช้งานของทีม - คลิกที่ผู้ใช้เพื่อดูรายละเอียด</div></div>
          <div class="stats-row" style="grid-template-columns:repeat(4,1fr)">
            <div class="stat-card"><div class="stat-icon c1">📊</div><div class="stat-val" id="logs-val" style="color:var(--accent)">0</div><div class="stat-lbl">กิจกรรมทั้งหมด</div></div>
            <div class="stat-card"><div class="stat-icon c2">👥</div><div class="stat-val" id="log-users" style="color:var(--blue)">0</div><div class="stat-lbl">ผู้ใช้งาน</div></div>
            <div class="stat-card"><div class="stat-icon c3">📅</div><div class="stat-val" id="log-today" style="color:var(--purple)">0</div><div class="stat-lbl">วันนี้</div></div>
            <div class="stat-card"><div class="stat-icon c4">🧾</div><div class="stat-val" id="log-summary" style="color:var(--pink)">0</div><div class="stat-lbl">สรุปงาน</div></div>
          </div>
          <div class="card"><div class="card-header"><h3 style="font-size:16px">📊 สถิติตาม Platform</h3></div><div id="platform-chart"></div></div>
          <div class="card">
            <div class="card-header"><h3 style="font-size:16px">👥 ผู้ใช้งานทั้งหมด</h3><button class="btn btn-sm btn-secondary" onclick="loadLogs()">🔄 รีเฟรช</button></div>
            <div id="user-stats"></div>
          </div>
        </div>

        <!-- User Detail Section (Hidden by default) -->
        <div id="logs-user-detail" class="hidden">
          <div class="back-header" onclick="showLogsOverview()"><span style="cursor:pointer;display:flex;align-items:center;gap:8px">← กลับ</span></div>
          <div id="user-detail-content"></div>
        </div>
      </div>

    </main>
  </div>
  ${scripts}
</body>
</html>`;
}
