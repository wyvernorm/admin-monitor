export function dashboardPageHTML(data) {
  const user = data.user || {};
  
  return `
<div class="app-container">
  <!-- Sidebar (same as monitor page) -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">📊</div>
      <div class="sidebar-title">
        <h1>Admin Monitor</h1>
        <p>${user.name || 'User'}</p>
      </div>
    </div>

    <div class="menu-group">
      <div class="menu-label">Monitor</div>
      <a href="/pages/dashboard" class="menu-item active">
        <span class="menu-icon">📊</span>
        <span>Dashboard</span>
      </a>
      <a href="/pages/monitor" class="menu-item">
        <span class="menu-icon">🧠</span>
        <span>งานที่กำลังตรวจสอบ</span>
      </a>
    </div>

    <div class="menu-group">
      <div class="menu-label">YouTube</div>
      <a href="/pages/youtube-stats" class="menu-item">
        <span class="menu-icon">📊</span>
        <span>ดูสถิติ</span>
      </a>
    </div>

    <div class="menu-group">
      <div class="menu-label">System</div>
      <a href="/pages/logs" class="menu-item">
        <span class="menu-icon">📝</span>
        <span>Logs</span>
      </a>
      <a href="/auth/logout" class="menu-item">
        <span class="menu-icon">🚪</span>
        <span>Logout</span>
      </a>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <div class="page-header">
      <h1 class="page-title">
        <span>📊</span>
        Dashboard
      </h1>
      <p class="page-subtitle">ภาพรวมของระบบ Monitor</p>
    </div>

    <!-- Stats Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="card">
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">งานทั้งหมด</div>
        <div style="font-size: 32px; font-weight: 700;" id="totalOrders">-</div>
      </div>
      
      <div class="card">
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">กำลังทำ</div>
        <div style="font-size: 32px; font-weight: 700; color: var(--warning);" id="runningOrders">-</div>
      </div>
      
      <div class="card">
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">เสร็จแล้ว</div>
        <div style="font-size: 32px; font-weight: 700; color: var(--accent);" id="doneOrders">-</div>
      </div>
    </div>

    <!-- Near Completion -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">🎯 เกือบเสร็จ (90%+)</h2>
      </div>
      <div id="nearCompletion">
        <div style="padding: 24px; text-align: center; color: var(--text-dim);">กำลังโหลด...</div>
      </div>
    </div>
  </main>
</div>

<script>
async function loadDashboard() {
  try {
    const response = await fetch('/api/monitor/dashboard');
    const data = await response.json();
    
    document.getElementById('totalOrders').textContent = data.totalOrders || 0;
    document.getElementById('runningOrders').textContent = data.running || 0;
    document.getElementById('doneOrders').textContent = data.done || 0;
    
    const nearCompletion = document.getElementById('nearCompletion');
    
    if (!data.nearCompletion || data.nearCompletion.length === 0) {
      nearCompletion.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-dim);">ไม่มีงานที่เกือบเสร็จ</div>';
      return;
    }
    
    nearCompletion.innerHTML = data.nearCompletion.map(order => {
      const viewProgress = order.view_target > 0 
        ? Math.min(100, Math.floor((order.view_current / order.view_target) * 100))
        : 100;
      
      const likeProgress = order.like_target > 0
        ? Math.min(100, Math.floor((order.like_current / order.like_target) * 100))
        : 100;
      
      return \`
        <div style="padding: 16px; border-bottom: 1px solid var(--border);">
          <div style="font-size: 13px; margin-bottom: 8px;">
            <a href="\${order.url}" target="_blank" style="color: var(--accent-light);">\${order.url.substring(0, 80)}...</a>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px;">
            \${order.view_target > 0 ? \`
              <div>
                <span style="color: var(--text-muted);">วิว:</span>
                <span>\${order.view_current.toLocaleString()} / \${order.view_target.toLocaleString()}</span>
                <span style="color: var(--accent);">(\${viewProgress}%)</span>
              </div>
            \` : ''}
            \${order.like_target > 0 ? \`
              <div>
                <span style="color: var(--text-muted);">ไลค์:</span>
                <span>\${order.like_current.toLocaleString()} / \${order.like_target.toLocaleString()}</span>
                <span style="color: var(--accent);">(\${likeProgress}%)</span>
              </div>
            \` : ''}
          </div>
        </div>
      \`;
    }).join('');
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

loadDashboard();
setInterval(loadDashboard, 60000); // Refresh every minute
</script>
  `;
}
