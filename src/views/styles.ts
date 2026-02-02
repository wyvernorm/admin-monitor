export const styles = `
:root{--bg:#030712;--card:#111827;--sidebar:#0f1419;--border:#1f2937;--input:#020617;--text:#e5e7eb;--muted:#9ca3af;--dim:#6b7280;--accent:#22c55e;--accent2:#4ade80;--danger:#ef4444;--blue:#3b82f6;--purple:#8b5cf6;--pink:#ec4899;--cyan:#06b6d4}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 0%,rgba(34,197,94,.08) 0%,transparent 50%),radial-gradient(ellipse at 80% 100%,rgba(59,130,246,.06) 0%,transparent 50%);pointer-events:none}
.hidden{display:none!important}
.app{display:flex;min-height:100vh;position:relative;z-index:1}

/* Login */
.login{display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,var(--bg) 0%,#0a1628 100%)}
.login-box{background:linear-gradient(145deg,rgba(17,24,39,.9),rgba(17,24,39,.7));backdrop-filter:blur(20px);border:1px solid rgba(34,197,94,.2);border-radius:24px;padding:48px;max-width:400px;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,.5),0 0 100px rgba(34,197,94,.1)}
.login-logo{width:72px;height:72px;margin:0 auto 20px;border-radius:20px;background:linear-gradient(135deg,var(--accent),var(--blue));display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 10px 40px rgba(34,197,94,.3)}
.btn-google{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;padding:14px 24px;background:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;color:#333;cursor:pointer;transition:all .2s}
.btn-google:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(255,255,255,.2)}

/* Sidebar */
.sidebar{width:260px;background:var(--sidebar);border-right:1px solid var(--border);padding:20px 16px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;height:100vh;position:sticky;top:0}
.logo-box{display:flex;align-items:center;gap:12px;padding:8px;margin-bottom:16px}
.logo-icon{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 15px rgba(34,197,94,.3)}
.logo-text{font-size:16px;font-weight:700;background:linear-gradient(135deg,var(--accent),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.logo-ver{font-size:11px;color:var(--dim)}
.user-box{display:flex;align-items:center;gap:12px;padding:12px;background:var(--input);border:1px solid var(--border);border-radius:14px;margin-bottom:16px}
.avatar{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--blue));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;overflow:hidden}
.avatar img{width:100%;height:100%;object-fit:cover}
.user-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.user-email{font-size:10px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.logout-btn{padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:11px;cursor:pointer;transition:all .2s}
.logout-btn:hover{border-color:var(--danger);color:var(--danger)}
.menu-group{margin-bottom:8px}
.menu-label{font-size:10px;color:var(--dim);font-weight:600;padding:8px 12px 4px;text-transform:uppercase;letter-spacing:.5px}
.menu-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;cursor:pointer;transition:all .15s;color:var(--muted);font-size:13px;border:1px solid transparent}
.menu-item:hover{background:rgba(34,197,94,.05);color:var(--text)}
.menu-item.active{background:linear-gradient(135deg,rgba(34,197,94,.15),rgba(6,182,212,.1));color:var(--accent);border-color:rgba(34,197,94,.2)}
.menu-icon{width:20px;text-align:center}

/* Main Content */
.main{flex:1;padding:24px 32px;overflow-y:auto}
.page{display:none}
.page.active{display:block}

/* Hero */
.hero{background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(6,182,212,.05));border:1px solid rgba(34,197,94,.15);border-radius:20px;padding:28px 32px;margin-bottom:28px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;right:-20%;width:300px;height:300px;background:radial-gradient(circle,rgba(34,197,94,.15) 0%,transparent 70%);pointer-events:none}
.hero-title{font-size:26px;font-weight:800;margin-bottom:8px;background:linear-gradient(135deg,#fff,var(--muted));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-sub{color:var(--muted);font-size:14px}

/* Stats Row */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
.stat-card{background:linear-gradient(145deg,var(--card),rgba(17,24,39,.5));border:1px solid var(--border);border-radius:16px;padding:20px;position:relative;overflow:hidden;transition:all .3s}
.stat-card:hover{transform:translateY(-4px);border-color:rgba(34,197,94,.3);box-shadow:0 20px 40px rgba(0,0,0,.3)}
.stat-card::before{content:'';position:absolute;top:0;right:0;width:100px;height:100px;background:radial-gradient(circle,rgba(34,197,94,.1) 0%,transparent 70%);pointer-events:none}
.stat-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px}
.stat-icon.c1{background:linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.05))}
.stat-icon.c2{background:linear-gradient(135deg,rgba(59,130,246,.2),rgba(59,130,246,.05))}
.stat-icon.c3{background:linear-gradient(135deg,rgba(139,92,246,.2),rgba(139,92,246,.05))}
.stat-icon.c4{background:linear-gradient(135deg,rgba(236,72,153,.2),rgba(236,72,153,.05))}
.stat-val{font-size:32px;font-weight:800;margin-bottom:4px}
.stat-lbl{font-size:13px;color:var(--muted)}
.live-badge{position:absolute;top:16px;right:16px;display:flex;align-items:center;gap:6px;font-size:11px;color:var(--accent);background:rgba(34,197,94,.1);padding:4px 10px;border-radius:20px;border:1px solid rgba(34,197,94,.2)}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}

/* Actions */
.actions-row{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:28px}
.action-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;text-align:center;cursor:pointer;transition:all .2s}
.action-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.action-icon{font-size:28px;margin-bottom:8px}
.action-label{font-size:12px;color:var(--muted)}

/* Section */
.section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.section-title{font-size:18px;font-weight:700;display:flex;align-items:center;gap:10px}
.refresh-btn{background:var(--input);border:1px solid var(--border);border-radius:10px;padding:10px 16px;cursor:pointer;color:var(--muted);font-size:12px;display:flex;align-items:center;gap:6px;transition:all .2s}
.refresh-btn:hover{border-color:var(--accent);color:var(--accent)}

/* Cards */
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}

/* Forms */
.form-group{margin-bottom:16px}
.form-label{display:block;font-size:12px;color:var(--muted);margin-bottom:8px;font-weight:500}
.form-row{display:flex;gap:12px;margin-bottom:16px}
.form-row>*{flex:1}
input,select,textarea{width:100%;padding:12px 14px;background:var(--input);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;outline:none;transition:all .2s}
input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(34,197,94,.1)}
input::placeholder,textarea::placeholder{color:var(--dim)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;background:linear-gradient(135deg,var(--accent),#16a34a);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(34,197,94,.3)}
.btn-secondary{background:var(--input);border:1px solid var(--border);color:var(--text)}
.btn-secondary:hover{border-color:var(--accent);box-shadow:none}
.btn-sm{padding:8px 14px;font-size:12px}

/* Monitor Page */
.monitor-grid{display:grid;grid-template-columns:400px 1fr;gap:24px}
.form-box{background:linear-gradient(145deg,var(--card),rgba(17,24,39,.5));border:1px solid var(--border);border-radius:16px;padding:24px}
.form-title{font-size:18px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:10px}
.inp-grp{display:flex;align-items:center;background:var(--input);border:1px solid var(--border);border-radius:10px;margin-bottom:12px;transition:all .2s}
.inp-grp:focus-within{border-color:var(--accent)}
.inp-icon{padding:0 14px;font-size:16px}
.inp{flex:1;padding:14px 14px 14px 0;background:transparent;border:none}
.inp:focus{box-shadow:none}
.chk-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.chk-card{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--input);border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:all .2s}
.chk-card:has(input:checked){background:rgba(34,197,94,.1);border-color:var(--accent)}
.checkbox-label{font-size:13px;font-weight:500}
.tgt-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.submit-btn{width:100%;padding:14px;background:linear-gradient(135deg,var(--accent),var(--cyan));border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s}
.submit-btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(34,197,94,.3)}

/* Status Box */
.status-box{margin-top:16px;padding:14px 16px;border-radius:10px;font-size:13px;white-space:pre-wrap;background:var(--input);border:1px solid var(--border)}
.status-box.success{background:rgba(34,197,94,.1);border-color:var(--accent);color:var(--accent)}
.status-box.error{background:rgba(239,68,68,.1);border-color:var(--danger);color:var(--danger)}

/* Order Cards */
.order-card{background:linear-gradient(145deg,var(--card),rgba(17,24,39,.5));border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:12px;transition:all .2s}
.order-card:hover{border-color:rgba(34,197,94,.3)}
.order-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.order-plat{font-size:12px;color:var(--accent);font-weight:600;display:flex;align-items:center;gap:6px}
.order-time{font-size:11px;color:var(--dim)}
.order-url{margin-bottom:14px}
.order-link{color:var(--text);font-size:13px;text-decoration:none;word-break:break-all}
.order-link:hover{color:var(--accent)}
.metrics{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.metric{background:var(--input);border-radius:10px;padding:12px}
.metric-head{display:flex;justify-content:space-between;margin-bottom:8px}
.metric-lbl{font-size:11px;color:var(--muted)}
.metric-val{font-size:11px;font-weight:600}
.metric-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.metric-fill{height:100%;border-radius:3px;transition:width .3s}
.metric-fill.v{background:linear-gradient(90deg,var(--accent),var(--cyan))}
.metric-fill.l{background:linear-gradient(90deg,var(--pink),var(--purple))}
.order-foot{display:flex;justify-content:flex-end}
.del-btn{padding:8px 14px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:12px;cursor:pointer;transition:all .2s}
.del-btn:hover{border-color:var(--danger);color:var(--danger);background:rgba(239,68,68,.1)}

/* Empty State */
.empty{text-align:center;padding:48px 24px;color:var(--muted)}
.empty-icon{font-size:48px;margin-bottom:16px;opacity:.5}
.empty-title{font-size:18px;font-weight:600;margin-bottom:8px;color:var(--text)}
.empty-desc{color:var(--dim);font-size:13px}

/* Summary Card */
.summary-card{background:var(--input);border:1px solid var(--border);border-radius:12px;margin-top:16px;position:relative}
.summary-actions{position:absolute;top:12px;right:12px}
.summary-content{padding:16px;font-size:13px;white-space:pre-wrap;line-height:1.6}
.icon-btn{width:36px;height:36px;border-radius:8px;background:var(--card);border:1px solid var(--border);cursor:pointer;transition:all .2s}
.icon-btn:hover{border-color:var(--accent);background:rgba(34,197,94,.1)}

/* Logs */
.dash-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
.dash-stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;text-align:center}
.dash-stat-icon{font-size:28px;margin-bottom:10px}
.dash-stat-value{font-size:32px;font-weight:800;margin-bottom:4px}
.dash-stat-label{font-size:12px;color:var(--muted)}
.lb-item{display:flex;align-items:center;gap:12px;padding:12px;background:var(--input);border-radius:10px;margin-bottom:8px;transition:all .2s}
.lb-item:hover{background:rgba(34,197,94,.05)}
.lb-rank{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.lb-rank.g{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000}
.lb-rank.s{background:linear-gradient(135deg,#9ca3af,#6b7280);color:#fff}
.lb-rank.b{background:linear-gradient(135deg,#cd7f32,#b8860b);color:#fff}
.lb-rank.n{background:var(--border);color:var(--muted)}
.lb-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--blue));display:flex;align-items:center;justify-content:center;font-size:14px;overflow:hidden}
.lb-avatar img{width:100%;height:100%;object-fit:cover}
.lb-info{flex:1}
.lb-name{font-size:13px;font-weight:600}
.lb-email{font-size:11px;color:var(--dim)}
.lb-score{font-size:18px;font-weight:700;color:var(--accent)}
.timeline{border-left:2px solid var(--border);margin-left:16px;padding-left:20px}
.tl-item{padding:12px 0;border-bottom:1px solid var(--border);transition:all .2s}
.tl-item:hover{background:rgba(34,197,94,.03);margin-left:-20px;padding-left:20px;border-radius:0 8px 8px 0}
.tl-head{display:flex;justify-content:space-between;margin-bottom:4px}
.tl-user{font-size:12px;color:var(--accent);font-weight:500}
.tl-time{font-size:11px;color:var(--dim)}
.tl-action{font-size:13px}
.filter-row{display:flex;gap:8px;flex-wrap:wrap}
.filter-btn{padding:8px 16px;background:var(--input);border:1px solid var(--border);border-radius:20px;color:var(--muted);font-size:12px;cursor:pointer;transition:all .2s}
.filter-btn:hover{border-color:var(--accent)}
.filter-btn.active{background:var(--accent);border-color:var(--accent);color:#000}

/* Toast */
.toast{position:fixed;bottom:24px;right:24px;background:var(--card);border:1px solid var(--accent);border-radius:12px;padding:14px 20px;font-size:13px;box-shadow:0 10px 40px rgba(0,0,0,.4);z-index:9999;animation:slideIn .3s ease}
.toast.error{border-color:var(--danger)}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}

/* Responsive */
@media(max-width:1200px){.stats-row{grid-template-columns:repeat(2,1fr)}.actions-row{grid-template-columns:repeat(3,1fr)}.monitor-grid{grid-template-columns:1fr}}
@media(max-width:768px){.sidebar{display:none}.stats-row,.actions-row{grid-template-columns:1fr}.metrics{grid-template-columns:1fr}}

/* Activity Logs - User Card */
.user-card{background:linear-gradient(145deg,var(--card),rgba(17,24,39,.5));border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px;cursor:pointer;transition:all .2s}
.user-card:hover{border-color:var(--accent);transform:translateX(4px)}
.user-card-header{display:flex;align-items:center;gap:14px;margin-bottom:12px}
.user-card-avatar{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--blue));display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;overflow:hidden}
.user-card-avatar img{width:100%;height:100%;object-fit:cover}
.user-card-info{flex:1}
.user-card-name{font-size:15px;font-weight:600;margin-bottom:2px}
.user-card-email{font-size:12px;color:var(--dim)}
.user-card-total{font-size:24px;font-weight:700;color:var(--accent)}
.user-card-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding-top:12px;border-top:1px solid var(--border)}
.user-card-stat{text-align:center;padding:8px;background:var(--input);border-radius:8px}
.user-card-stat-icon{font-size:16px;margin-bottom:4px}
.user-card-stat-val{font-size:14px;font-weight:600}
.user-card-rank{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700}
.user-card-rank.g{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000}
.user-card-rank.s{background:linear-gradient(135deg,#9ca3af,#6b7280);color:#fff}
.user-card-rank.b{background:linear-gradient(135deg,#cd7f32,#b8860b);color:#fff}
.user-card-rank.n{background:var(--border);color:var(--muted)}

/* User Detail Page */
.back-header{padding:12px 0;margin-bottom:16px;font-size:14px;color:var(--accent);font-weight:500}
.back-header:hover{color:var(--accent2)}
.user-detail-hero{background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(59,130,246,.1));border:1px solid rgba(139,92,246,.2);border-radius:20px;padding:28px;margin-bottom:24px;display:flex;align-items:center;gap:20px}
.user-detail-avatar{width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,var(--purple),var(--blue));display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:600;overflow:hidden;box-shadow:0 8px 25px rgba(139,92,246,.3)}
.user-detail-avatar img{width:100%;height:100%;object-fit:cover}
.user-detail-name{font-size:24px;font-weight:700;margin-bottom:4px}
.user-detail-email{font-size:14px;color:var(--muted);margin-bottom:8px}
.user-detail-meta{font-size:12px;color:var(--dim)}
.user-detail-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:24px}
.user-detail-stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center}
.user-detail-stat-icon{font-size:24px;margin-bottom:8px}
.user-detail-stat-val{font-size:28px;font-weight:700;margin-bottom:4px}
.user-detail-stat-lbl{font-size:11px;color:var(--muted)}
.user-detail-stat.yt .user-detail-stat-val{color:#ff0000}
.user-detail-stat.tt .user-detail-stat-val{color:#00d9ff}
.user-detail-stat.fb .user-detail-stat-val{color:#1877f2}
.user-detail-stat.ig .user-detail-stat-val{color:#e1306c}
.user-detail-stat.mn .user-detail-stat-val{color:var(--accent)}
.user-detail-stat.total .user-detail-stat-val{color:var(--purple)}
.action-type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.action-type-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center}
.action-type-icon{font-size:20px;margin-bottom:6px}
.action-type-val{font-size:22px;font-weight:700;color:var(--text);margin-bottom:2px}
.action-type-lbl{font-size:11px;color:var(--muted)}
.user-timeline{max-height:400px;overflow-y:auto}
.user-timeline-item{display:flex;gap:12px;padding:12px;border-bottom:1px solid var(--border);transition:all .2s}
.user-timeline-item:hover{background:rgba(34,197,94,.03)}
.user-timeline-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px}
.user-timeline-icon.yt{background:rgba(255,0,0,.1)}
.user-timeline-icon.tt{background:rgba(0,217,255,.1)}
.user-timeline-icon.fb{background:rgba(24,119,242,.1)}
.user-timeline-icon.ig{background:rgba(225,48,108,.1)}
.user-timeline-icon.mn{background:rgba(34,197,94,.1)}
.user-timeline-content{flex:1}
.user-timeline-action{font-size:13px;margin-bottom:2px}
.user-timeline-details{font-size:11px;color:var(--dim)}
.user-timeline-time{font-size:11px;color:var(--dim);white-space:nowrap}
`;
