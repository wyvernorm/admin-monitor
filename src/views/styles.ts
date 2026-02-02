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
.lb-user-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--purple),var(--pink));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:#fff}
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
.log-user-avatar{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--blue));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0}
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
.modal-avatar{width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,var(--purple),var(--pink));display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff}
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

/* Toast */
.toast{position:fixed;bottom:24px;right:24px;background:var(--card);border:1px solid var(--accent);border-radius:12px;padding:14px 20px;font-size:13px;box-shadow:0 10px 40px rgba(0,0,0,.4);z-index:9999;animation:slideIn .3s ease}
.toast.error{border-color:var(--danger)}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}

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
`;
