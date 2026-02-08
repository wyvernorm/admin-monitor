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
.user-box{display:flex;align-items:center;gap:12px;padding:12px;background:var(--input);border:1px solid var(--border);border-radius:14px;margin-bottom:8px}

/* Gamification - Level & XP */
.user-level{display:flex;align-items:center;gap:8px;margin-top:6px}
.level-badge{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px}
.level-badge.lv2{background:linear-gradient(135deg,#60a5fa,#3b82f6);color:#fff}
.level-badge.lv3{background:linear-gradient(135deg,#a78bfa,#8b5cf6);color:#fff}
.level-badge.lv4{background:linear-gradient(135deg,#f472b6,#ec4899);color:#fff}
.level-badge.lv5{background:linear-gradient(135deg,#fb923c,#f97316);color:#fff}
.level-badge.lv6{background:linear-gradient(135deg,#fcd34d,#fbbf24);color:#000}
.xp-bar{flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.xp-fill{height:100%;background:linear-gradient(90deg,var(--accent),#22c55e);border-radius:3px;transition:width .5s ease}

/* User Badges */
.user-badges{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 16px;border-bottom:1px solid var(--border);margin-bottom:16px}
.badge-item{font-size:18px;cursor:pointer;transition:transform .2s;position:relative}
.badge-item:hover{transform:scale(1.3)}
.badge-item.locked{opacity:.3;filter:grayscale(1)}
.badge-tooltip{position:absolute;bottom:calc(100% + 5px);left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:6px 10px;border-radius:8px;font-size:11px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s;z-index:100}
.badge-item:hover .badge-tooltip{opacity:1}

/* Leaderboard Enhanced */
.lb-level{font-size:10px;font-weight:700;padding:2px 6px;border-radius:8px;margin-left:6px;color:#fff}
.lb-badges{display:flex;gap:2px;margin-top:4px}
.lb-badges span{font-size:12px}

/* Gamification Admin Page */
.game-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.level-list,.badge-list{display:flex;flex-direction:column;gap:10px}
.badge-list.collapsed{max-height:280px;overflow:hidden}
.btn-text{background:none;border:none;color:var(--accent);cursor:pointer;padding:8px 0;font-size:13px;width:100%;text-align:center}
.btn-text:hover{text-decoration:underline}
.level-item,.badge-item-admin{display:flex;align-items:center;gap:12px;padding:12px;background:var(--input);border-radius:10px;border:1px solid var(--border)}
.level-item .level-color{width:12px;height:12px;border-radius:50%}
.level-item .level-info{flex:1}
.level-item .level-name{font-weight:600;font-size:14px}
.level-item .level-range{font-size:12px;color:var(--dim)}
.badge-item-admin .badge-icon{font-size:24px}
.badge-item-admin .badge-info{flex:1}
.badge-item-admin .badge-name{font-weight:600;font-size:14px}
.badge-item-admin .badge-desc{font-size:12px;color:var(--dim)}
.badge-item-admin .badge-count{background:var(--accent);color:#000;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700}
.game-user-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px}
.game-stat-card{background:var(--input);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center}
.game-stat-val{font-size:24px;font-weight:700;color:var(--accent)}
.game-stat-lbl{font-size:12px;color:var(--dim);margin-top:4px}
.game-user-badges{}
.badge-category{margin-bottom:16px}
.badge-category-title{font-size:12px;color:var(--dim);margin-bottom:8px;display:flex;align-items:center;gap:6px}
.badge-category-grid{display:flex;flex-wrap:wrap;gap:8px}
.game-badge-toggle{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;background:var(--input);border:1px solid var(--border);border-radius:8px;transition:all .2s;font-size:12px}
.game-badge-toggle:hover{border-color:var(--accent);transform:translateY(-1px)}
.game-badge-toggle.earned{background:rgba(34,197,94,.15);border-color:rgba(34,197,94,.5);color:#22c55e}
.game-badge-toggle .badge-icon{font-size:16px}
.game-badge-toggle.locked{opacity:.4}
.game-badge-toggle.locked .badge-icon{filter:grayscale(1)}
.game-leaderboard{display:flex;flex-direction:column;gap:8px}
.game-lb-row{display:flex;align-items:center;gap:12px;padding:12px;background:var(--input);border-radius:10px}
.game-lb-rank{width:30px;text-align:center;font-weight:700}
.game-lb-avatar{width:40px;height:40px;border-radius:50%;background:var(--purple);display:flex;align-items:center;justify-content:center;font-weight:700;overflow:hidden}
.game-lb-info{flex:1}
.game-lb-name{font-weight:600;display:flex;align-items:center;gap:8px}
.game-lb-badges{display:flex;gap:4px;margin-top:4px}
.game-lb-score{font-size:18px;font-weight:700;color:var(--accent)}
@media(max-width:768px){.game-admin-grid{grid-template-columns:1fr}.game-user-stats{grid-template-columns:repeat(2,1fr)}}
.avatar{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--blue));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;overflow:hidden}
.avatar img{width:100%;height:100%;object-fit:cover}
.user-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.user-email{font-size:10px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.logout-btn{padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:11px;cursor:pointer;transition:all .2s}
.logout-btn:hover{border-color:var(--danger);color:var(--danger)}
.menu-group{margin-bottom:8px}
.menu-label{font-size:10px;color:var(--dim);font-weight:600;padding:8px 12px 4px;text-transform:uppercase;letter-spacing:.5px}
.menu-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;cursor:pointer;transition:all .15s;color:var(--muted);font-size:13px;border:1px solid transparent;position:relative}
.menu-badge{background:var(--accent);color:#000;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:auto;min-width:20px;text-align:center;animation:badgePop .3s ease}
.menu-badge.hidden{display:none}
@keyframes badgePop{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
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
.section-actions{display:flex;gap:8px;align-items:center}
.check-now-btn{padding:8px 16px;background:linear-gradient(135deg,rgba(0,217,255,.15),rgba(139,92,246,.15));border:1px solid rgba(0,217,255,.3);border-radius:8px;color:var(--cyan);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
.check-now-btn:hover:not(:disabled){background:linear-gradient(135deg,rgba(0,217,255,.25),rgba(139,92,246,.25));border-color:var(--cyan);transform:translateY(-1px)}
.check-now-btn:disabled{opacity:.6;cursor:not-allowed;color:var(--muted);border-color:var(--border)}
.section-title{font-size:18px;font-weight:700;display:flex;align-items:center;gap:10px}
.refresh-btn{background:var(--input);border:1px solid var(--border);border-radius:10px;padding:10px 16px;cursor:pointer;color:var(--muted);font-size:12px;display:flex;align-items:center;gap:6px;transition:all .2s}
.refresh-btn:hover{border-color:var(--accent);color:var(--accent)}

/* Cards */
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.card-title{font-size:16px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}

/* Tabs */
.tabs{display:flex;gap:8px;margin-bottom:20px;background:var(--input);padding:6px;border-radius:12px;border:1px solid var(--border)}
.tab{flex:1;padding:12px 20px;background:transparent;border:none;border-radius:8px;color:var(--muted);font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px}
.tab:hover{color:var(--text);background:rgba(255,255,255,.03)}
.tab.active{background:var(--card);color:var(--accent);box-shadow:0 2px 8px rgba(0,0,0,.2)}
.tab-content{display:none}
.tab-content.active{display:block}

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
.order-foot{display:flex;justify-content:flex-end;align-items:center;gap:8px;flex-wrap:wrap}
.del-btn{padding:8px 14px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:12px;cursor:pointer;transition:all .2s}
.del-btn:hover{border-color:var(--danger);color:var(--danger);background:rgba(239,68,68,.1)}
.order-updated{font-size:11px;color:var(--cyan);background:rgba(0,217,255,.1);padding:4px 10px;border-radius:12px;font-weight:500}
.order-stale{border:1px solid rgba(251,146,60,.5)!important;background:linear-gradient(135deg,rgba(251,146,60,.06),rgba(239,68,68,.04))!important;animation:stale-pulse 3s ease-in-out infinite}
@keyframes stale-pulse{0%,100%{border-color:rgba(251,146,60,.3)}50%{border-color:rgba(251,146,60,.7)}}
.stale-badge{font-size:11px;color:#fb923c;background:rgba(251,146,60,.15);padding:3px 10px;border-radius:12px;font-weight:600;animation:stale-blink 2s ease-in-out infinite}
@keyframes stale-blink{0%,100%{opacity:1}50%{opacity:.6}}
.trend-btn{padding:8px 14px;background:rgba(0,217,255,.1);border:1px solid rgba(0,217,255,.3);border-radius:8px;color:var(--cyan);font-size:12px;cursor:pointer;transition:all .2s;font-weight:500}
.trend-btn:hover{background:rgba(0,217,255,.2);border-color:var(--cyan)}
.trend-chart{padding:16px;margin:0 -1px;border-top:1px solid var(--border);background:rgba(0,0,0,.15);border-radius:0 0 12px 12px;overflow:hidden}
.trend-stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.trend-stat{font-size:12px;padding:4px 12px;border-radius:8px;font-weight:500}
.trend-stat.v{color:#00d9ff;background:rgba(0,217,255,.1)}
.trend-stat.l{color:#e879f9;background:rgba(232,121,249,.1)}
.trend-stat.t{color:var(--muted);background:rgba(255,255,255,.05)}
.trend-stat small{opacity:.7}
.trend-legend{display:flex;gap:16px;margin-top:8px;justify-content:center}
.trend-leg-item{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted)}
.trend-leg-line{display:inline-block;width:16px;height:3px;border-radius:2px}
.cron-banner{background:linear-gradient(135deg,rgba(0,217,255,.08),rgba(139,92,246,.08));border:1px solid rgba(0,217,255,.2);border-radius:10px;padding:10px 16px;margin-bottom:12px;font-size:13px;color:var(--text);display:flex;align-items:center;gap:6px}
.health-banner{padding:10px 16px;border-radius:10px;font-size:13px;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.health-critical{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);color:#f87171;animation:health-pulse 2s ease-in-out infinite}
.health-warning{background:rgba(251,146,60,.1);border:1px solid rgba(251,146,60,.3);color:#fb923c}
@keyframes health-pulse{0%,100%{border-color:rgba(239,68,68,.3)}50%{border-color:rgba(239,68,68,.7)}}

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

/* Video Result Card */
.video-result-card{background:var(--input);border:1px solid var(--border);border-radius:16px;margin-top:16px;overflow:hidden;display:flex;flex-direction:column}
.video-thumb{width:100%;height:200px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:48px;background-size:cover;background-position:center}
.video-info{padding:20px}
.video-title{font-size:16px;font-weight:600;margin-bottom:8px;line-height:1.4}
.video-meta{font-size:12px;color:var(--dim);margin-bottom:16px}
.video-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.video-stat{background:var(--card);border-radius:12px;padding:16px;text-align:center}
.video-stat-icon{display:block;font-size:24px;margin-bottom:8px}
.video-stat-val{display:block;font-size:20px;font-weight:700;color:var(--accent)}
.video-stat-lbl{display:block;font-size:11px;color:var(--dim);margin-top:4px}
@media(max-width:768px){.video-stats-grid{grid-template-columns:repeat(2,1fr)}.video-stat{padding:12px}.video-stat-val{font-size:16px}}

/* Iframe Container */
.iframe-container{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;height:calc(100vh - 200px);min-height:500px;position:relative}
.iframe-container iframe{width:100%;height:100%;border:none}
.iframe-loading{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--card);z-index:10}
.iframe-loading.hidden{display:none}
.loading-spinner{width:48px;height:48px;border:4px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 1s linear infinite}
.loading-text{margin-top:16px;color:var(--muted);font-size:14px}
.loading-link{margin-top:12px;color:var(--accent);font-size:13px;text-decoration:underline}

/* Calendar Link Card */
.calendar-link-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:48px;text-align:center;max-width:500px;margin:40px auto}
.calendar-icon{font-size:72px;margin-bottom:20px}
.calendar-link-card h3{font-size:24px;font-weight:700;margin-bottom:12px;color:var(--text)}
.calendar-link-card p{color:var(--muted);margin-bottom:24px;font-size:14px}
.calendar-features{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:32px}
.feature-tag{background:var(--input);border:1px solid var(--border);padding:8px 16px;border-radius:20px;font-size:13px;color:var(--dim)}
.calendar-btn{display:inline-flex;align-items:center;gap:8px;padding:16px 32px;font-size:16px;font-weight:600;background:linear-gradient(135deg,#fb923c,#f97316);color:#000;border-radius:12px;text-decoration:none;transition:all .3s}
.calendar-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(251,146,60,.3)}
.telegram-link{display:inline-block;color:#29b6f6;font-size:15px;font-weight:600;margin-bottom:20px;text-decoration:none;padding:8px 16px;background:rgba(41,182,246,.1);border-radius:8px;transition:all .2s}
.telegram-link:hover{background:rgba(41,182,246,.2);transform:translateY(-1px)}

/* Loading Animation - Progress Style */
.loading-progress{display:flex;flex-direction:column;align-items:center;gap:12px}
.loading-dots{display:flex;gap:6px}
.loading-dots span{width:8px;height:8px;background:var(--accent);border-radius:50%;animation:bounce .6s infinite}
.loading-dots span:nth-child(2){animation-delay:.1s}
.loading-dots span:nth-child(3){animation-delay:.2s}
.loading-dots span:nth-child(4){animation-delay:.3s}
.loading-msg{color:var(--muted);font-size:13px;text-align:center}

@keyframes spin{to{transform:rotate(360deg)}}
@keyframes bounce{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-8px);opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

/* Skeleton Loading */
.skeleton-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:12px}
.skeleton-line{height:14px;background:linear-gradient(90deg,var(--input) 25%,var(--border) 50%,var(--input) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:6px;margin-bottom:10px}
.skeleton-line.w30{width:30%}
.skeleton-line.w50{width:50%}
.skeleton-line.w60{width:60%}
.skeleton-line.w80{width:80%}
.skeleton-line.w100{width:100%}
.skeleton-line:last-child{margin-bottom:0}
.skeleton-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.skeleton-stat{background:var(--card);border:1px solid var(--border);border-radius:16px;height:100px;background:linear-gradient(90deg,var(--card) 25%,var(--input) 50%,var(--card) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
.skeleton-row{display:flex;gap:12px;padding:16px;background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:8px}
@media(max-width:768px){.skeleton-stats{grid-template-columns:repeat(2,1fr)}}

/* Error Box */
.error-box{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:16px;padding:32px;text-align:center}
.error-icon{font-size:48px;margin-bottom:12px}
.error-msg{color:#ef4444;margin-bottom:16px;font-size:14px}

/* Filter Bar */
.filter-bar{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.search-box{flex:1;min-width:200px;position:relative}
.search-box .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px;opacity:.5}
.search-box input{width:100%;padding:12px 12px 12px 42px;background:var(--input);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;transition:all .2s}
.search-box input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,217,255,.1)}
.search-box input::placeholder{color:var(--dim)}
.filter-select{padding:12px 16px;background:var(--input);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;cursor:pointer;min-width:140px}
.filter-select:focus{outline:none;border-color:var(--accent)}
.order-count{font-size:13px;color:var(--dim);margin-bottom:12px}
.status-badge{padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600}
.status-badge.done{background:rgba(34,197,94,.15);color:#22c55e}
.status-badge.running{background:rgba(59,130,246,.15);color:#3b82f6}
.status-badge.pending{background:rgba(156,163,175,.15);color:#9ca3af}
.order-line{font-size:12px;color:var(--dim);margin-right:auto}
.order-creator{font-size:11px;color:#a78bfa;background:rgba(167,139,250,.15);padding:4px 10px;border-radius:12px;margin-right:auto;font-weight:500}
.order-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
@media(max-width:768px){.filter-bar{flex-direction:column}.search-box{min-width:100%}.filter-select{width:100%}}

/* Activity Logs - New Design */
.logs-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.logs-stat-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;display:flex;align-items:center;gap:16px;transition:all .2s}
.logs-stat-card:hover{border-color:rgba(139,92,246,.3);transform:translateY(-2px)}
.logs-stat-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px}
.logs-stat-info{flex:1}
.logs-stat-value{font-size:28px;font-weight:800;color:var(--text);margin-bottom:2px}
.logs-stat-label{font-size:12px;color:var(--dim)}

.logs-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}

/* Platform Stats Bars */
.plat-bar-item{margin-bottom:16px}
.plat-bar-item:last-child{margin-bottom:0}
.plat-bar-head{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}
.plat-bar-head span:first-child{color:var(--text)}
.plat-bar-head span:last-child{color:var(--muted);font-weight:500}
.plat-bar{height:8px;background:var(--input);border-radius:4px;overflow:hidden}
.plat-bar-fill{height:100%;border-radius:4px;transition:width .5s ease}

/* Leaderboard */
.lb-row{display:flex;align-items:center;gap:12px;padding:12px;background:var(--input);border-radius:10px;margin-bottom:8px;transition:all .2s}
.lb-row:hover{background:rgba(139,92,246,.05)}
.lb-row:last-child{margin-bottom:0}
.lb-row.clickable{cursor:pointer}
.lb-row.clickable:hover{background:rgba(139,92,246,.1);transform:translateX(4px)}
.lb-medal{font-size:18px;width:28px;text-align:center}
.lb-user-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--purple),var(--pink));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:#fff;overflow:hidden}
.lb-user-info{flex:1;min-width:0}
.lb-user-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb-user-email{font-size:11px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb-user-score{font-size:18px;font-weight:700;color:var(--purple)}

/* Logs Filter */
.logs-filters{display:flex;gap:8px;flex-wrap:wrap}
.filter-chip{padding:6px 14px;background:var(--input);border:1px solid var(--border);border-radius:20px;color:var(--muted);font-size:12px;cursor:pointer;transition:all .2s;white-space:nowrap}
.filter-chip:hover{border-color:var(--purple);color:var(--purple)}
.filter-chip.active{background:linear-gradient(135deg,var(--purple),var(--pink));border-color:transparent;color:#fff}

/* Logs Table */
.logs-table-wrap{overflow-x:auto;margin:0 -20px;padding:0 20px}
.logs-table{width:100%;border-collapse:collapse;min-width:600px}
.logs-table th{text-align:left;padding:12px 16px;font-size:11px;font-weight:600;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border)}
.logs-table td{padding:14px 16px;border-bottom:1px solid var(--border);vertical-align:middle}
.logs-table tr:hover td{background:rgba(139,92,246,.03)}
.logs-table tr:last-child td{border-bottom:none}

.log-user{display:flex;align-items:center;gap:10px}
.log-user-avatar{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--blue));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0;overflow:hidden}
.log-user-info{min-width:0}
.log-user-name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.log-user-email{font-size:10px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.log-platform{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:500;text-transform:capitalize}
.log-action{font-size:13px;color:var(--text)}
.log-details{font-size:11px;color:var(--dim);margin-top:4px;word-break:break-all}
.log-tag{display:inline-block;font-size:10px;padding:2px 6px;background:var(--input);border-radius:4px;margin-right:4px;margin-top:4px;color:var(--muted)}
.log-time{font-size:12px;color:var(--dim);white-space:nowrap}
.log-user.clickable{cursor:pointer}
.logs-table tr{cursor:pointer;transition:all .2s}
.logs-table tr:hover{transform:translateX(2px)}

/* User Detail Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px}
.modal-box{background:var(--card);border:1px solid var(--border);border-radius:20px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto}
.modal-header{display:flex;align-items:center;justify-content:space-between;padding:24px;border-bottom:1px solid var(--border)}
.modal-user{display:flex;align-items:center;gap:16px}
.modal-avatar{width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,var(--purple),var(--pink));display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;overflow:hidden}
.modal-name{font-size:20px;font-weight:700}
.modal-email{font-size:13px;color:var(--dim)}
.modal-close{width:40px;height:40px;border-radius:10px;background:var(--input);border:1px solid var(--border);color:var(--muted);font-size:18px;cursor:pointer;transition:all .2s}
.modal-close:hover{border-color:var(--danger);color:var(--danger);background:rgba(239,68,68,.1)}
.modal-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:20px 24px;background:var(--input);border-bottom:1px solid var(--border)}
.modal-stat{text-align:center}
.modal-stat-val{font-size:24px;font-weight:800;color:var(--accent)}
.modal-stat-lbl{font-size:11px;color:var(--dim);margin-top:2px}
.modal-section{padding:20px 24px;border-bottom:1px solid var(--border)}
.modal-section:last-child{border-bottom:none}
.modal-section-title{font-size:14px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.modal-logs{max-height:300px;overflow-y:auto}
.modal-log-item{display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--input);border-radius:8px;margin-bottom:8px}
.modal-log-item:last-child{margin-bottom:0}
.modal-log-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.modal-log-action{flex:1;font-size:13px}
.modal-log-time{font-size:11px;color:var(--dim);white-space:nowrap}

/* Daily Chart */
.daily-chart{display:flex;align-items:flex-end;gap:8px;height:120px;padding:10px 0}
.daily-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;height:100%}
.daily-bar{width:100%;max-width:32px;background:linear-gradient(180deg,var(--purple),var(--pink));border-radius:4px 4px 0 0;min-height:4px;transition:height .3s}
.daily-val{font-size:10px;font-weight:600;margin-top:6px;color:var(--text)}
.daily-date{font-size:9px;color:var(--dim);margin-top:2px}

/* Action Breakdown */
.action-breakdown{display:flex;flex-direction:column;gap:8px}
.action-row{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--input);border-radius:8px}
.action-info{display:flex;align-items:center;gap:8px;min-width:180px;flex-shrink:0}
.action-icon{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.action-name{font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.action-bar-wrap{flex:1;height:8px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden}
.action-bar{height:100%;border-radius:4px;transition:width .3s}
.action-count{font-size:13px;font-weight:700;color:var(--text);min-width:60px;text-align:right;white-space:nowrap}
.action-last{font-size:10px;color:var(--dim);font-weight:400;margin-left:4px}

/* Hourly Chart */
.hourly-chart{display:grid;grid-template-columns:repeat(12,1fr);gap:4px}
@media(max-width:768px){.hourly-chart{grid-template-columns:repeat(8,1fr)}}
.hourly-block{border-radius:6px;padding:6px 2px;text-align:center;min-height:44px;display:flex;flex-direction:column;justify-content:center;align-items:center;transition:background .2s}
.hourly-block:hover{outline:1px solid var(--accent)}
.hourly-val{font-size:11px;font-weight:700;color:var(--text)}
.hourly-label{font-size:9px;color:var(--dim);margin-top:2px}

/* Toast */
.toast{position:fixed;bottom:24px;right:24px;background:var(--card);border:1px solid var(--accent);border-radius:12px;padding:14px 20px;font-size:13px;box-shadow:0 10px 40px rgba(0,0,0,.4);z-index:9999;animation:slideIn .3s ease}
.celebration-popup{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.8);background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:2px solid #FFD700;border-radius:20px;padding:32px 48px;text-align:center;z-index:10000;opacity:0;transition:all .3s ease;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.celebration-popup.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
.celeb-icon{font-size:64px;margin-bottom:16px;animation:celebrate .5s ease infinite}
.celeb-title{font-size:24px;font-weight:700;color:#FFD700;margin-bottom:8px}
.celeb-msg{font-size:14px;color:var(--dim)}
.badge-earned-popup{position:fixed;top:20%;left:50%;transform:translateX(-50%) translateY(-20px);background:linear-gradient(135deg,#2d1b4e 0%,#1a1a2e 100%);border:2px solid #a78bfa;border-radius:16px;padding:20px 32px;display:flex;align-items:center;gap:16px;z-index:10000;opacity:0;transition:all .3s ease;box-shadow:0 15px 50px rgba(167,139,250,.3)}
.badge-earned-popup.show{opacity:1;transform:translateX(-50%) translateY(0)}
.badge-earned-icon{font-size:48px}
.badge-earned-title{font-size:12px;color:#a78bfa;font-weight:600}
.badge-earned-name{font-size:18px;font-weight:700;color:#fff}
.toast.error{border-color:var(--danger)}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes rankUp{0%{transform:scale(1);background:inherit}50%{transform:scale(1.05);background:rgba(34,197,94,.2)}100%{transform:scale(1);background:inherit}}
@keyframes rankDown{0%{transform:scale(1);background:inherit}50%{transform:scale(0.98);background:rgba(239,68,68,.1)}100%{transform:scale(1);background:inherit}}
@keyframes newBadge{0%{transform:scale(0) rotate(-180deg);opacity:0}50%{transform:scale(1.2) rotate(10deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes celebrate{0%,100%{transform:scale(1)}25%{transform:scale(1.1) rotate(-3deg)}75%{transform:scale(1.1) rotate(3deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 5px rgba(0,217,255,.3)}50%{box-shadow:0 0 20px rgba(0,217,255,.6),0 0 30px rgba(0,217,255,.4)}}
.rank-up{animation:rankUp .6s ease}
.rank-down{animation:rankDown .6s ease}
.new-badge{animation:newBadge .6s cubic-bezier(.68,-.55,.265,1.55)}
.celebrate{animation:celebrate .5s ease 3}
.glow{animation:glow 1.5s ease infinite}

/* Responsive */
@media(max-width:1200px){.stats-row,.logs-stats{grid-template-columns:repeat(2,1fr)}.actions-row{grid-template-columns:repeat(3,1fr)}.monitor-grid{grid-template-columns:1fr}.logs-grid{grid-template-columns:1fr}.modal-stats{grid-template-columns:repeat(3,1fr)}}
@media(max-width:768px){
.sidebar{display:none}
.stats-row,.actions-row,.logs-stats{grid-template-columns:1fr}
.metrics{grid-template-columns:1fr}
.modal-stats{grid-template-columns:repeat(2,1fr)}
.modal-box{margin:10px;border-radius:16px}
.mobile-header{display:flex!important}
.main{padding:16px;padding-top:70px}
.hero{display:none}
#page-dashboard .stats-row{display:none}
.tabs{flex-wrap:wrap}
.tab{flex:none;padding:10px 14px;font-size:12px}
.card{padding:16px}
.form-row{flex-direction:column}
.logs-filters{flex-wrap:nowrap;overflow-x:auto;padding-bottom:8px}
.filter-chip{flex-shrink:0}
}

/* Mobile Header */
.mobile-header{display:none;position:fixed;top:0;left:0;right:0;height:56px;background:var(--sidebar);border-bottom:1px solid var(--border);padding:0 16px;align-items:center;justify-content:space-between;z-index:1000}
.mobile-logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px}
.mobile-logo-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:16px}
.hamburger{width:40px;height:40px;border-radius:10px;background:var(--input);border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer}
.hamburger span{width:18px;height:2px;background:var(--muted);border-radius:1px;transition:all .2s}
.hamburger.active span:nth-child(1){transform:rotate(45deg) translate(4px,4px)}
.hamburger.active span:nth-child(2){opacity:0}
.hamburger.active span:nth-child(3){transform:rotate(-45deg) translate(4px,-4px)}

/* Mobile Nav */
.mobile-nav{display:none;position:fixed;top:56px;left:0;right:0;bottom:0;background:var(--sidebar);z-index:999;padding:16px;overflow-y:auto}
.mobile-nav.active{display:block}
.mobile-nav .menu-item{padding:14px 16px;font-size:14px}
.mobile-nav .user-box{margin-bottom:16px}
.wk-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.wk-title{font-size:16px;font-weight:700;color:var(--text)}
.wk-timer{font-size:12px;color:var(--accent);background:rgba(34,197,94,.1);padding:4px 10px;border-radius:20px}
.wk-challenge{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:12px;background:var(--input);margin-bottom:10px;border:1px solid var(--border);transition:all .3s}
.wk-challenge.wk-done{border-color:var(--accent);background:rgba(34,197,94,.05)}
.wk-icon{font-size:24px;flex-shrink:0;width:40px;text-align:center;line-height:40px}
.wk-info{flex:1;min-width:0}
.wk-name{font-size:14px;font-weight:600;color:var(--text);margin-bottom:2px}
.wk-desc{font-size:12px;color:var(--muted);margin-bottom:8px}
.wk-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.wk-bar-fill{height:100%;border-radius:3px;transition:width .5s ease}
.wk-progress{font-size:11px;color:var(--dim);margin-top:4px}
.wk-done .wk-progress{color:var(--accent)}
.wk-reward{font-size:11px;color:var(--purple);white-space:nowrap;padding:4px 8px;background:rgba(139,92,246,.1);border-radius:8px;align-self:center}
.pg-container{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:1px solid var(--border);margin-top:8px}
.pg-info{font-size:12px;color:var(--dim)}
.pg-btns{display:flex;gap:4px}
.pg-btn{background:var(--input);border:1px solid var(--border);color:var(--text);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;transition:all .2s}
.pg-btn:hover{background:var(--card);border-color:var(--accent)}
.pg-btn.pg-active{background:var(--accent);color:#000;border-color:var(--accent);font-weight:600}

/* ============= SESSION EXPIRED MODAL ============= */
.session-expired-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:99999;animation:fadeIn 0.3s ease}
.session-expired-modal{background:linear-gradient(145deg,var(--card),var(--sidebar));border:1px solid var(--accent);border-radius:20px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 100px rgba(34,197,94,0.2);animation:slideUp 0.4s ease}
.session-expired-icon{font-size:72px;margin-bottom:20px;animation:pulse 2s infinite}
.session-expired-title{font-size:24px;font-weight:800;color:var(--text);margin-bottom:12px}
.session-expired-message{font-size:14px;color:var(--muted);margin-bottom:28px;line-height:1.6}
.session-expired-actions{display:flex;gap:12px;justify-content:center}
.btn-primary{background:linear-gradient(135deg,var(--accent),var(--cyan));color:#000;border:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 15px rgba(34,197,94,0.3)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(34,197,94,0.4)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
`;

/* ============= GAMIFICATION V2 STYLES ============= */
.levelup-popup{position:fixed;inset:0;background:rgba(0,0,0,0.9);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:10001;opacity:0;transition:opacity 0.4s ease}
.levelup-popup.show{opacity:1}
.levelup-content{background:linear-gradient(145deg,#1e293b,#0f172a);border:2px solid #fbbf24;border-radius:24px;padding:48px;text-align:center;max-width:500px;box-shadow:0 25px 75px rgba(251,191,36,0.4),0 0 100px rgba(251,191,36,0.3);animation:slideUpBounce 0.6s cubic-bezier(0.68,-0.55,0.265,1.55)}
.levelup-icon{font-size:120px;margin-bottom:24px;filter:drop-shadow(0 0 30px rgba(251,191,36,0.6))}
.levelup-icon.pulse{animation:pulse 2s infinite}
.levelup-title{font-size:42px;font-weight:900;background:linear-gradient(135deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px;letter-spacing:2px}
.levelup-level{font-size:28px;font-weight:700;color:#e5e7eb;margin-bottom:20px}
.levelup-perks{font-size:16px;color:#10b981;background:rgba(16,185,129,0.1);padding:12px 24px;border-radius:12px;margin-bottom:32px;border:1px solid rgba(16,185,129,0.3)}
.levelup-btn{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;border:none;padding:16px 48px;border-radius:12px;font-size:18px;font-weight:700;cursor:pointer;transition:all 0.3s ease;box-shadow:0 6px 20px rgba(251,191,36,0.4)}
.levelup-btn:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(251,191,36,0.6)}
.quest-complete-popup{position:fixed;top:100px;right:24px;background:linear-gradient(145deg,#1e293b,#0f172a);border:2px solid #10b981;border-radius:16px;padding:20px 24px;min-width:320px;box-shadow:0 10px 40px rgba(16,185,129,0.3);opacity:0;transform:translateX(100%);transition:all 0.4s cubic-bezier(0.68,-0.55,0.265,1.55);z-index:10000}
.quest-complete-popup.show{opacity:1;transform:translateX(0)}
.quest-icon{font-size:48px;text-align:center;margin-bottom:12px;animation:bounce 0.6s ease}
.quest-title{font-size:18px;font-weight:800;color:#10b981;text-align:center;margin-bottom:8px;letter-spacing:1px}
.quest-name{font-size:16px;color:#e5e7eb;text-align:center;margin-bottom:8px}
.quest-reward{font-size:14px;color:#fbbf24;text-align:center;font-weight:600}
.xp-container{background:var(--input);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:20px}
.xp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.xp-level{font-size:14px;font-weight:700;color:var(--text)}
.xp-progress{font-size:12px;color:var(--dim)}
.xp-bar{height:12px;background:var(--border);border-radius:6px;overflow:hidden;position:relative}
.xp-bar-fill{height:100%;background:linear-gradient(90deg,#fbbf24,#f59e0b);border-radius:6px;transition:width 0.6s cubic-bezier(0.4,0,0.2,1);box-shadow:0 0 10px rgba(251,191,36,0.5);position:relative;overflow:hidden}
.xp-bar-fill::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);animation:shimmer 2s infinite}
@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.badge-rarity-common{border-color:#9ca3af;box-shadow:0 0 15px rgba(156,163,175,0.3)}
.badge-rarity-uncommon{border-color:#10b981;box-shadow:0 0 15px rgba(16,185,129,0.4)}
.badge-rarity-rare{border-color:#3b82f6;box-shadow:0 0 15px rgba(59,130,246,0.5);animation:glowBlue 2s infinite}
.badge-rarity-epic{border-color:#a855f7;box-shadow:0 0 15px rgba(168,85,247,0.6);animation:glowPurple 2s infinite}
.badge-rarity-legendary{border-color:#fbbf24;box-shadow:0 0 20px rgba(251,191,36,0.7);animation:glowGold 2s infinite}
@keyframes glowBlue{0%,100%{box-shadow:0 0 15px rgba(59,130,246,0.5)}50%{box-shadow:0 0 25px rgba(59,130,246,0.8)}}
@keyframes glowPurple{0%,100%{box-shadow:0 0 15px rgba(168,85,247,0.6)}50%{box-shadow:0 0 30px rgba(168,85,247,0.9)}}
@keyframes glowGold{0%,100%{box-shadow:0 0 20px rgba(251,191,36,0.7)}50%{box-shadow:0 0 40px rgba(251,191,36,1)}}
.achievement-card{background:var(--input);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;transition:all 0.3s ease}
.achievement-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.achievement-card.completed{border-color:var(--accent);background:rgba(34,197,94,0.05)}
.achievement-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.achievement-icon{font-size:32px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:var(--card)}
.achievement-info{flex:1}
.achievement-name{font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px}
.achievement-desc{font-size:12px;color:var(--dim)}
.achievement-progress{height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-bottom:6px}
.achievement-progress-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:4px;transition:width 0.6s ease}
.achievement-progress-text{font-size:11px;color:var(--muted);text-align:right}
.achievement-progress-text.completed{color:var(--accent);font-weight:600}
.daily-quest-card{background:linear-gradient(145deg,#1e293b,#0f172a);border:2px solid transparent;border-radius:16px;padding:20px;margin-bottom:16px;position:relative;overflow:hidden;transition:all 0.3s ease}
.daily-quest-card::before{content:'';position:absolute;inset:0;border-radius:16px;padding:2px;background:linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0.5}
.daily-quest-card.completed::before{background:linear-gradient(135deg,#10b981,#22c55e);opacity:1}
.daily-quest-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.daily-quest-icon{font-size:28px}
.daily-quest-info{flex:1}
.daily-quest-name{font-size:15px;font-weight:700;color:var(--text)}
.daily-quest-desc{font-size:12px;color:var(--muted)}
.daily-quest-reward{font-size:13px;color:#fbbf24;font-weight:600}
.daily-quest-progress{height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden}
.daily-quest-progress-fill{height:100%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:3px;transition:width 0.4s ease}
.daily-quest-progress-fill.completed{background:linear-gradient(90deg,#10b981,#22c55e)}
.rank-change{display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:2px 8px;border-radius:8px;font-weight:600}
.rank-change.up{color:#10b981;background:rgba(16,185,129,0.1)}
.rank-change.down{color:#ef4444;background:rgba(239,68,68,0.1)}
.rank-change.same{color:var(--dim);background:rgba(156,163,175,0.1)}
@keyframes slideUpBounce{0%{opacity:0;transform:translateY(100px) scale(0.8)}60%{opacity:1;transform:translateY(-10px) scale(1.05)}80%{transform:translateY(5px) scale(0.98)}100%{transform:translateY(0) scale(1)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.rarity-badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
.rarity-badge.common{background:#9ca3af;color:#000}
.rarity-badge.uncommon{background:#10b981;color:#000}
.rarity-badge.rare{background:#3b82f6;color:#fff}
.rarity-badge.epic{background:#a855f7;color:#fff}
.rarity-badge.legendary{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
.stat-card{background:var(--input);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center}
.stat-value{font-size:28px;font-weight:800;color:var(--accent);margin-bottom:4px}
.stat-label{font-size:12px;color:var(--dim);text-transform:uppercase;letter-spacing:0.5px}
@media (max-width:640px){.levelup-content{padding:32px 24px;max-width:90%}.levelup-icon{font-size:80px}.levelup-title{font-size:32px}.quest-complete-popup{right:12px;left:12px;min-width:auto}.stats-grid{grid-template-columns:repeat(2,1fr)}}
