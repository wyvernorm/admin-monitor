export function monitorPageHTML(data) {
  const user = data.user || {};
  
  return `
<div class="app-container">
  <!-- Sidebar -->
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
      <a href="/pages/dashboard" class="menu-item">
        <span class="menu-icon">📊</span>
        <span>Dashboard</span>
      </a>
      <a href="/pages/monitor" class="menu-item active">
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
      <a href="/pages/youtube-summary" class="menu-item">
        <span class="menu-icon">🧾</span>
        <span>สรุปงาน</span>
      </a>
    </div>

    <div class="menu-group">
      <div class="menu-label">TikTok</div>
      <a href="/pages/tiktok-summary" class="menu-item">
        <span class="menu-icon">🎵</span>
        <span>สรุปงาน (เดี่ยว)</span>
      </a>
      <a href="/pages/tiktok-summary-all" class="menu-item">
        <span class="menu-icon">🎁</span>
        <span>สรุปงาน (รวม)</span>
      </a>
      <a href="/pages/tiktok-follower" class="menu-item">
        <span class="menu-icon">👥</span>
        <span>Follower</span>
      </a>
    </div>

    <div class="menu-group">
      <div class="menu-label">Facebook</div>
      <a href="/pages/facebook-stats" class="menu-item">
        <span class="menu-icon">📘</span>
        <span>ดูสถิติ</span>
      </a>
      <a href="/pages/facebook-summary" class="menu-item">
        <span class="menu-icon">📝</span>
        <span>สรุปงาน (เดี่ยว)</span>
      </a>
      <a href="/pages/facebook-batch" class="menu-item">
        <span class="menu-icon">📋</span>
        <span>สรุปงานหลายรายการ</span>
      </a>
    </div>

    <div class="menu-group">
      <div class="menu-label">Instagram</div>
      <a href="/pages/instagram-stats" class="menu-item">
        <span class="menu-icon">📷</span>
        <span>ดูสถิติ</span>
      </a>
      <a href="/pages/instagram-summary" class="menu-item">
        <span class="menu-icon">📝</span>
        <span>สรุปงาน (เดี่ยว)</span>
      </a>
      <a href="/pages/instagram-batch" class="menu-item">
        <span class="menu-icon">📋</span>
        <span>สรุปงานหลายรายการ</span>
      </a>
    </div>

    <div class="menu-group">
      <div class="menu-label">System</div>
      <a href="/pages/templates" class="menu-item">
        <span class="menu-icon">📋</span>
        <span>Templates</span>
      </a>
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
        <span>🧠</span>
        งานที่กำลังตรวจสอบ
      </h1>
      <p class="page-subtitle">ติดตามและจัดการงาน YouTube Monitor</p>
    </div>

    <!-- Add Order Card -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">เพิ่มงานใหม่</h2>
      </div>

      <form id="addOrderForm">
        <div class="form-group">
          <label class="form-label">URL คลิป YouTube</label>
          <input type="url" id="videoUrl" placeholder="https://www.youtube.com/watch?v=..." required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">จำนวนวิวที่ต้องการเพิ่ม</label>
            <input type="number" id="viewTarget" min="0" placeholder="0">
          </div>

          <div class="form-group">
            <label class="form-label">จำนวนไลค์ที่ต้องการเพิ่ม</label>
            <input type="number" id="likeTarget" min="0" placeholder="0">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Line ID (ถ้ามี)</label>
          <input type="text" id="lineId" placeholder="@lineusername">
        </div>

        <button type="submit" class="btn" id="addBtn">
          ➕ เพิ่มงาน
        </button>
      </form>

      <div id="addStatus" class="status-box hidden"></div>
    </div>

    <!-- Orders List Card -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">รายการงานทั้งหมด</h2>
        <button onclick="loadOrders()" class="btn-secondary" style="width: auto; padding: 8px 16px;">
          🔄 รีเฟรช
        </button>
      </div>

      <div class="data-table monitor-table" id="ordersTable">
        <div class="table-header">
          <div>URL / สถานะ</div>
          <div>วิว</div>
          <div>ไลค์</div>
          <div>จัดการ</div>
        </div>
        <div id="ordersBody">
          <div style="padding: 24px; text-align: center; color: var(--text-dim);">
            กำลังโหลด...
          </div>
        </div>
      </div>
    </div>
  </main>
</div>

<script>
// ==================== API HELPERS ====================
async function apiCall(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

// ==================== LOAD ORDERS ====================
async function loadOrders() {
  const ordersBody = document.getElementById('ordersBody');
  ordersBody.innerHTML = '<div style="padding: 24px; text-align: center;"><span class="loading-spinner"></span></div>';
  
  try {
    const data = await apiCall('/api/monitor');
    const orders = data.orders || [];
    
    if (orders.length === 0) {
      ordersBody.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-dim);">ยังไม่มีงาน</div>';
      return;
    }
    
    ordersBody.innerHTML = orders.map(order => {
      const viewProgress = order.view_target > 0 
        ? Math.min(100, Math.floor((order.view_current / order.view_target) * 100))
        : 100;
      
      const likeProgress = order.like_target > 0
        ? Math.min(100, Math.floor((order.like_current / order.like_target) * 100))
        : 100;
      
      const overallProgress = Math.floor((viewProgress + likeProgress) / 2);
      const statusColor = order.status === 'done' ? 'var(--accent)' : 'var(--warning)';
      const statusText = order.status === 'done' ? '✅ เสร็จแล้ว' : '🔄 กำลังทำ';
      
      return \`
        <div class="table-row">
          <div>
            <div style="font-size: 13px; margin-bottom: 4px;">
              <a href="\${order.url}" target="_blank" style="color: var(--accent-light);">\${order.url.substring(0, 60)}...</a>
            </div>
            <div style="font-size: 12px; color: \${statusColor};">\${statusText}</div>
            \${order.line_id ? \`<div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">Line: \${order.line_id}</div>\` : ''}
          </div>
          
          <div>
            \${order.view_target > 0 ? \`
              <div style="font-size: 13px;">\${order.view_current.toLocaleString()} / \${order.view_target.toLocaleString()}</div>
              <div style="font-size: 11px; color: var(--text-dim);">\${viewProgress}%</div>
            \` : '<div style="color: var(--text-dim);">-</div>'}
          </div>
          
          <div>
            \${order.like_target > 0 ? \`
              <div style="font-size: 13px;">\${order.like_current.toLocaleString()} / \${order.like_target.toLocaleString()}</div>
              <div style="font-size: 11px; color: var(--text-dim);">\${likeProgress}%</div>
            \` : '<div style="color: var(--text-dim);">-</div>'}
          </div>
          
          <div>
            <button onclick="deleteOrder(\${order.id})" class="delete-btn" title="ลบ">🗑️</button>
          </div>
        </div>
      \`;
    }).join('');
  } catch (err) {
    ordersBody.innerHTML = \`<div style="padding: 24px; text-align: center; color: var(--danger);">❌ \${err.message}</div>\`;
  }
}

// ==================== ADD ORDER ====================
document.getElementById('addOrderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const url = document.getElementById('videoUrl').value;
  const viewTarget = Number(document.getElementById('viewTarget').value) || 0;
  const likeTarget = Number(document.getElementById('likeTarget').value) || 0;
  const lineId = document.getElementById('lineId').value;
  
  const btn = document.getElementById('addBtn');
  const status = document.getElementById('addStatus');
  
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> กำลังเพิ่ม...';
  status.className = 'status-box hidden';
  
  try {
    const result = await apiCall('/api/monitor/add', {
      method: 'POST',
      body: JSON.stringify({ url, viewTarget, likeTarget, lineId }),
    });
    
    status.className = 'status-box success';
    status.textContent = result.message;
    
    // Reset form
    document.getElementById('addOrderForm').reset();
    
    // Reload orders
    await loadOrders();
  } catch (err) {
    status.className = 'status-box error';
    status.textContent = '❌ ' + err.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '➕ เพิ่มงาน';
  }
});

// ==================== DELETE ORDER ====================
async function deleteOrder(id) {
  if (!confirm('คุณแน่ใจหรือไม่ที่จะลบงานนี้?')) return;
  
  try {
    await apiCall(\`/api/monitor/\${id}\`, { method: 'DELETE' });
    await loadOrders();
  } catch (err) {
    alert('ลบงานไม่สำเร็จ: ' + err.message);
  }
}

// ==================== INIT ====================
loadOrders();

// Auto refresh every 30 seconds
setInterval(loadOrders, 30000);
</script>
  `;
}
