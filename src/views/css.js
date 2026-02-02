export const CSS = `<style>
:root {
  --bg-dark: #0a0e13;
  --bg-card: #111827;
  --bg-sidebar: #0f1419;
  --border: #1f2937;
  --input-bg: #020617;
  --text: #e5e7eb;
  --text-muted: #9ca3af;
  --text-dim: #6b7280;
  --accent: #22c55e;
  --accent-light: #4ade80;
  --accent-dark: #16a34a;
  --danger: #ef4444;
  --warning: #f59e0b;
  --shadow: 0 20px 60px rgba(0,0,0,.5);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: radial-gradient(circle at top, #111827, #020617 60%);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.6;
}

.app-container { display: flex; min-height: 100vh; }

.sidebar {
  width: 280px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  padding: 0 8px;
}

.sidebar-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.sidebar-title h1 { font-size: 18px; font-weight: 700; }
.sidebar-title p { font-size: 12px; color: var(--text-dim); margin-top: 2px; }

.menu-group { margin-bottom: 24px; }
.menu-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-dim);
  padding: 0 12px;
  margin-bottom: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.menu-item:hover { background: rgba(255,255,255,.05); color: var(--text); }
.menu-item.active {
  background: linear-gradient(135deg, rgba(34,197,94,.15), rgba(74,222,128,.1));
  color: var(--accent-light);
  border: 1px solid rgba(34,197,94,.3);
}

.menu-icon { font-size: 20px; flex-shrink: 0; width: 24px; text-align: center; }

.main-content {
  flex: 1;
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.page-header { margin-bottom: 32px; }
.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-subtitle { font-size: 14px; color: var(--text-muted); }

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.card-title { font-size: 18px; font-weight: 600; }

.form-group { margin-bottom: 20px; }
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 8px;
}

input, select, textarea {
  width: 100%;
  padding: 12px 16px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(34,197,94,.1);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: #052e16;
  transition: all 0.2s;
  width: 100%;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(34,197,94,.3);
}

.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  background: var(--input-bg);
  color: var(--text);
  border: 1px solid var(--border);
}

.delete-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  color: var(--text-muted);
}

.delete-btn:hover {
  background: rgba(239,68,68,.1);
  border-color: var(--danger);
  color: var(--danger);
}

.data-table {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  display: grid;
  background: var(--input-bg);
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.table-row {
  display: grid;
  padding: 14px 16px;
  border-top: 1px solid var(--border);
  align-items: center;
  transition: background 0.2s;
}

.table-row:hover { background: rgba(255,255,255,.02); }

.monitor-table .table-header,
.monitor-table .table-row {
  grid-template-columns: 2fr 0.8fr 1.2fr 80px;
}

.status-box {
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  font-size: 13px;
  margin-top: 16px;
  white-space: pre-wrap;
}

.status-box.success {
  border-color: var(--accent);
  background: rgba(34,197,94,.05);
  color: var(--accent-light);
}

.status-box.error {
  border-color: var(--danger);
  background: rgba(239,68,68,.05);
  color: var(--danger);
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.hidden { display: none !important; }

/* Login Page Specific */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 48px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow);
}

.login-logo {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin: 0 auto 24px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 32px;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: white;
  color: #1f2937;
  padding: 14px 24px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s;
}

.google-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,.3);
}
</style>`;
