export const scripts = `
<script>
var user=null,lastYT=null,NL=String.fromCharCode(10),usedFB=[],usedIG=[],currentLogFilter='all',ttCache={},allLogs=[];
var prevRanks={},earnedBadges=[];

// 🎉 Celebration Functions
function fireConfetti(){
  if(typeof confetti==='undefined')return;
  confetti({particleCount:100,spread:70,origin:{y:0.6}});
}
function fireConfettiBig(){
  if(typeof confetti==='undefined')return;
  var duration=3000;
  var end=Date.now()+duration;
  (function frame(){
    confetti({particleCount:3,angle:60,spread:55,origin:{x:0}});
    confetti({particleCount:3,angle:120,spread:55,origin:{x:1}});
    if(Date.now()<end)requestAnimationFrame(frame);
  })();
}
function fireBadgeConfetti(){
  if(typeof confetti==='undefined')return;
  confetti({particleCount:50,spread:60,origin:{y:0.7},colors:['#FFD700','#FFA500','#FF6347']});
}
function showCelebration(title,message){
  var el=document.createElement('div');
  el.className='celebration-popup';
  el.innerHTML='<div class="celeb-icon">🎉</div><div class="celeb-title">'+title+'</div><div class="celeb-msg">'+message+'</div>';
  document.body.appendChild(el);
  fireConfettiBig();
  setTimeout(function(){el.classList.add('show');},10);
  setTimeout(function(){el.classList.remove('show');setTimeout(function(){el.remove();},300);},4000);
}
function showBadgeEarned(badge){
  var el=document.createElement('div');
  el.className='badge-earned-popup';
  el.innerHTML='<div class="badge-earned-icon new-badge">'+badge.icon+'</div><div class="badge-earned-info"><div class="badge-earned-title">🏅 ได้รับ Badge ใหม่!</div><div class="badge-earned-name">'+badge.name+'</div></div>';
  document.body.appendChild(el);
  fireBadgeConfetti();
  setTimeout(function(){el.classList.add('show');},10);
  setTimeout(function(){el.classList.remove('show');setTimeout(function(){el.remove();},300);},3500);
}

// Convert UTC to GMT+7 (Thailand)
function toThaiTime(dateStr){
  if(!dateStr)return '';
  var d=new Date(dateStr);
  // Add 7 hours for GMT+7
  d.setHours(d.getHours()+7);
  return d.toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
}
function toThaiDate(dateStr){
  if(!dateStr)return '';
  var d=new Date(dateStr);
  d.setHours(d.getHours()+7);
  return d.toLocaleDateString('th-TH',{day:'numeric',month:'short'});
}

// ==================== GAMIFICATION SYSTEM ====================
var GAME={
  levels:[
    {lv:1,name:'มือใหม่',min:0,max:50,color:'#fbbf24'},
    {lv:2,name:'เริ่มต้น',min:51,max:150,color:'#3b82f6'},
    {lv:3,name:'ปานกลาง',min:151,max:300,color:'#8b5cf6'},
    {lv:4,name:'ชำนาญ',min:301,max:500,color:'#ec4899'},
    {lv:5,name:'เชี่ยวชาญ',min:501,max:1000,color:'#f97316'},
    {lv:6,name:'ปรมาจารย์',min:1001,max:999999,color:'#fbbf24'}
  ],
  badges:[
    // Milestone Badges
    {id:'first',icon:'🩸',name:'งานแรก',desc:'ทำงานครั้งแรก',cat:'milestone',check:function(s){return s.total>=1;}},
    {id:'ten',icon:'🔟',name:'ครบสิบ',desc:'ครบ 10 งาน',cat:'milestone',check:function(s){return s.total>=10;}},
    {id:'fifty',icon:'5️⃣',name:'ครึ่งร้อย',desc:'ครบ 50 งาน',cat:'milestone',check:function(s){return s.total>=50;}},
    {id:'century',icon:'💯',name:'ร้อยงาน',desc:'ครบ 100 งาน',cat:'milestone',check:function(s){return s.total>=100;}},
    {id:'fivehundred',icon:'🔥',name:'ไฟลุก',desc:'ครบ 500 งาน',cat:'milestone',check:function(s){return s.total>=500;}},
    {id:'thousand',icon:'👑',name:'ตำนาน',desc:'ครบ 1,000 งาน',cat:'milestone',check:function(s){return s.total>=1000;}},
    {id:'fivek',icon:'💎',name:'เพชร',desc:'ครบ 5,000 งาน',cat:'milestone',check:function(s){return s.total>=5000;}},
    {id:'tenk',icon:'🏆',name:'แชมป์',desc:'ครบ 10,000 งาน',cat:'milestone',check:function(s){return s.total>=10000;}},
    
    // Platform Master Badges (50)
    {id:'ytmaster',icon:'📺',name:'เทพ YouTube',desc:'YouTube 50 งาน',cat:'platform',check:function(s){return s.youtube>=50;}},
    {id:'ttstar',icon:'🎵',name:'ดาว TikTok',desc:'TikTok 50 งาน',cat:'platform',check:function(s){return s.tiktok>=50;}},
    {id:'fbpro',icon:'📘',name:'โปร Facebook',desc:'Facebook 50 งาน',cat:'platform',check:function(s){return s.facebook>=50;}},
    {id:'igking',icon:'📷',name:'ราชา Instagram',desc:'Instagram 50 งาน',cat:'platform',check:function(s){return s.instagram>=50;}},
    
    // Platform Legend Badges (100)
    {id:'ytlegend',icon:'🔴',name:'ตำนาน YouTube',desc:'YouTube 100 งาน',cat:'platform',check:function(s){return s.youtube>=100;}},
    {id:'ttlegend',icon:'⚫',name:'ตำนาน TikTok',desc:'TikTok 100 งาน',cat:'platform',check:function(s){return s.tiktok>=100;}},
    {id:'fblegend',icon:'🔵',name:'ตำนาน Facebook',desc:'Facebook 100 งาน',cat:'platform',check:function(s){return s.facebook>=100;}},
    {id:'iglegend',icon:'🟣',name:'ตำนาน Instagram',desc:'Instagram 100 งาน',cat:'platform',check:function(s){return s.instagram>=100;}},
    
    // All-Rounder Badges
    {id:'allround',icon:'🌟',name:'ครบเครื่อง',desc:'ทุก Platform 10+ งาน',cat:'special',check:function(s){return s.youtube>=10&&s.tiktok>=10&&s.facebook>=10&&s.instagram>=10;}},
    {id:'rainbow',icon:'🌈',name:'สายรุ้ง',desc:'ทุก Platform 25+ งาน',cat:'special',check:function(s){return s.youtube>=25&&s.tiktok>=25&&s.facebook>=25&&s.instagram>=25;}},
    {id:'ultimate',icon:'✨',name:'สุดยอด',desc:'ทุก Platform 50+ งาน',cat:'special',check:function(s){return s.youtube>=50&&s.tiktok>=50&&s.facebook>=50&&s.instagram>=50;}},
    
    // Time-based Badges
    {id:'nightowl',icon:'🦉',name:'นกฮูก',desc:'ทำงานหลังเที่ยงคืน 5 ครั้ง',cat:'time',check:function(s){return s.night_count>=5;}},
    {id:'earlybird',icon:'🐦',name:'นกน้อย',desc:'ทำงานก่อน 7 โมง 5 ครั้ง',cat:'time',check:function(s){return s.early_count>=5;}},
    {id:'weekend',icon:'☀️',name:'นักสู้วันหยุด',desc:'ทำงานวันหยุด 10 ครั้ง',cat:'time',check:function(s){return s.weekend_count>=10;}},
    
    // Streak Badges
    {id:'streak3',icon:'🔥',name:'ร้อนแรง',desc:'ทำงาน 3 วันติด',cat:'streak',check:function(s){return s.max_streak>=3;}},
    {id:'streak7',icon:'⚡',name:'สายฟ้า',desc:'ทำงาน 7 วันติด',cat:'streak',check:function(s){return s.max_streak>=7;}},
    {id:'streak30',icon:'💫',name:'หยุดไม่ได้',desc:'ทำงาน 30 วันติด',cat:'streak',check:function(s){return s.max_streak>=30;}},
    
    // Speed Badges
    {id:'speed10',icon:'🚀',name:'สปีด',desc:'10 งานใน 1 ชั่วโมง',cat:'speed',check:function(s){return s.max_hourly>=10;}},
    {id:'speed50',icon:'⚡',name:'แฟลช',desc:'50 งานใน 1 วัน',cat:'speed',check:function(s){return s.max_daily>=50;}},
    {id:'speed100',icon:'🌪️',name:'Tornado',desc:'100 งานใน 1 วัน',cat:'speed',check:function(s){return s.max_daily>=100;}},
    
    // Special Badges
    {id:'veteran',icon:'🎂',name:'Veteran',desc:'ใช้งานมา 30 วัน',cat:'special',check:function(s){return s.days_active>=30;}},
    {id:'elite',icon:'🎖️',name:'Elite',desc:'เคยติด Top 3',cat:'special',check:function(s){return s.best_rank<=3;}},
    {id:'dedicated',icon:'💪',name:'Dedicated',desc:'ทำงาน 100 วัน',cat:'special',check:function(s){return s.days_active>=100;}}
  ],
  
  getLevel:function(xp){
    for(var i=this.levels.length-1;i>=0;i--){
      if(xp>=this.levels[i].min)return this.levels[i];
    }
    return this.levels[0];
  },
  
  getXpProgress:function(xp){
    var lv=this.getLevel(xp);
    var progress=((xp-lv.min)/(lv.max-lv.min))*100;
    return Math.min(100,Math.max(0,progress));
  },
  
  getBadges:function(stats){
    var earned=[];
    this.badges.forEach(function(b){
      if(b.check(stats))earned.push(b);
    });
    return earned;
  },
  
  getBadgesByCategory:function(){
    var cats={milestone:[],platform:[],special:[],time:[],streak:[],speed:[]};
    this.badges.forEach(function(b){
      if(cats[b.cat])cats[b.cat].push(b);
    });
    return cats;
  },
  
  renderUserStats:function(stats){
    var lv=this.getLevel(stats.total);
    var progress=this.getXpProgress(stats.total);
    var badges=this.getBadges(stats);
    
    // Update level badge
    var lvBadge=document.getElementById('user-level-badge');
    if(lvBadge){
      lvBadge.textContent='Lv.'+lv.lv+' '+lv.name;
      lvBadge.className='level-badge lv'+lv.lv;
    }
    
    // Update XP bar
    var xpFill=document.getElementById('user-xp-fill');
    if(xpFill)xpFill.style.width=progress+'%';
    
    // Update badges (show earned only, max 8)
    var badgesCont=document.getElementById('user-badges');
    if(badgesCont){
      var html='';
      badges.slice(0,8).forEach(function(b){
        html+='<span class="badge-item" title="'+b.name+'">'+b.icon+'<span class="badge-tooltip">'+b.name+'</span></span>';
      });
      if(badges.length>8)html+='<span class="badge-item" title="+'+(badges.length-8)+' more">+' +(badges.length-8)+'</span>';
      badgesCont.innerHTML=html;
    }
  }
};

// ==================== API MODULE ====================
var API={
  token:function(){return localStorage.getItem('session');},
  
  // Base request with retry
  request:async function(endpoint,data,retries){
    retries=retries||2;
    var opts={headers:{'Content-Type':'application/json'}};
    var tk=this.token();
    if(tk)opts.headers['X-Session-Token']=tk;
    if(data){opts.method='POST';opts.body=JSON.stringify(data);}
    
    for(var i=0;i<=retries;i++){
      try{
        var r=await fetch('/api/'+endpoint,opts);
        if(!r.ok){
          var err=await r.json().catch(function(){return{error:'HTTP '+r.status};});
          throw new Error(err.error||'Request failed');
        }
        return await r.json();
      }catch(e){
        if(i===retries)throw e;
        await new Promise(function(res){setTimeout(res,1000*(i+1));});
      }
    }
  },
  
  // Shortcuts
  get:function(endpoint){return this.request(endpoint);},
  post:function(endpoint,data){return this.request(endpoint,data);},
  
  // Specific APIs
  auth:{
    me:function(){return API.get('auth/me');},
    logout:function(){localStorage.removeItem('session');location.href='/';}
  },
  monitor:{
    list:function(){return API.get('monitor/orders');},
    add:function(data){return API.post('monitor/orders',data);},
    delete:async function(id){
      var tk=API.token();
      var r=await fetch('/api/monitor/orders/'+id,{method:'DELETE',headers:{'X-Session-Token':tk}});
      return r.json();
    }
  },
  youtube:{
    stats:function(url){return API.post('youtube/stats',{url:url});}
  },
  tiktok:{
    stats:function(url){return API.post('tiktok/stats',{url:url});},
    follower:function(url){return API.post('tiktok/follower',{url:url});}
  },
  facebook:{
    stats:function(url){return API.post('facebook/stats',{url:url});},
    videoStats:function(url){return API.post('facebook/video-stats',{url:url});}
  },
  instagram:{
    stats:function(url){return API.post('instagram/stats',{url:url});}
  },
  logs:{
    list:function(){return API.get('logs');},
    add:function(data){return API.post('log-action',data);}
  },
  dashboard:{
    stats:function(){return API.get('dashboard/stats');}
  }
};

// Legacy api function for compatibility
async function api(endpoint,data){return API.request(endpoint,data);}

// ==================== SKELETON LOADING ====================
function showSkeleton(el,type){
  if(!el)return;
  var html='';
  if(type==='cards'){
    for(var i=0;i<3;i++)html+='<div class="skeleton-card"><div class="skeleton-line w60"></div><div class="skeleton-line w100"></div><div class="skeleton-line w80"></div></div>';
  }else if(type==='stats'){
    html='<div class="skeleton-stats"><div class="skeleton-stat"></div><div class="skeleton-stat"></div><div class="skeleton-stat"></div><div class="skeleton-stat"></div></div>';
  }else if(type==='table'){
    for(var j=0;j<5;j++)html+='<div class="skeleton-row"><div class="skeleton-line w30"></div><div class="skeleton-line w50"></div><div class="skeleton-line w20"></div></div>';
  }else{
    html='<div class="skeleton-card"><div class="skeleton-line w60"></div><div class="skeleton-line w100"></div></div>';
  }
  el.innerHTML=html;
}

// ==================== ERROR HANDLING ====================
function showError(el,msg,retryFn){
  if(!el)return;
  el.innerHTML='<div class="error-box"><div class="error-icon">⚠️</div><div class="error-msg">'+(msg||'เกิดข้อผิดพลาด')+'</div>'+(retryFn?'<button class="btn btn-secondary" onclick="'+retryFn+'">🔄 ลองใหม่</button>':'')+'</div>';
}

async function checkAuth(){var savedToken=localStorage.getItem('session');if(!savedToken){showLogin();return;}try{var d=await API.auth.me();if(d.user){user=d.user;showApp();}else{localStorage.removeItem('session');showLogin();}}catch(e){showLogin();}}
function showLogin(){document.getElementById('login-page').classList.remove('hidden');document.getElementById('main-app').classList.add('hidden');}
function showApp(){document.getElementById('login-page').classList.add('hidden');document.getElementById('main-app').classList.remove('hidden');if(user){document.getElementById('user-name').textContent=user.name||'Admin';document.getElementById('user-email').textContent=user.email||'';document.getElementById('mobile-user-name').textContent=user.name||'Admin';document.getElementById('mobile-user-email').textContent=user.email||'';var a=document.getElementById('user-avatar');var ma=document.getElementById('mobile-avatar');if(user.picture){a.innerHTML='<img src="'+user.picture+'">';ma.innerHTML='<img src="'+user.picture+'">';}else{var init=(user.name||'A').charAt(0).toUpperCase();a.textContent=init;ma.textContent=init;}}loadDash();loadOrders();}
function logout(){API.auth.logout();}

// Mobile Nav
function toggleMobileNav(){var nav=document.getElementById('mobile-nav');var btn=document.querySelector('.hamburger');nav.classList.toggle('active');btn.classList.toggle('active');}
function mobileGoTo(pg){goTo(pg);document.getElementById('mobile-nav').classList.remove('active');document.querySelector('.hamburger').classList.remove('active');document.querySelectorAll('.mobile-nav .menu-item').forEach(function(m){m.classList.remove('active');});var mi=document.querySelector('.mobile-nav .menu-item[data-page="'+pg+'"]');if(mi)mi.classList.add('active');if(pg==='logs')loadLogs();if(pg==='dashboard'){loadDash();loadOrders();}if(pg==='monitor')loadOrders();}

checkAuth();

function fmt(n){return n?n.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g,','):'0';}
function copy(id){var t=document.getElementById(id);if(t){navigator.clipboard.writeText(t.value);toast('คัดลอกแล้ว!');}}
function toast(msg,type){var t=document.createElement('div');t.className='toast'+(type==='error'?' error':'');t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove();},3000);}

// Loading with progress animation
var loadingMsgs=['🔍 กำลังเชื่อมต่อ...','📡 กำลังดึงข้อมูล...','⏳ รอสักครู่...','🔄 กำลังประมวลผล...','✨ เกือบเสร็จแล้ว...'];
var loadingInterval=null;
function showLoading(el,prefix){
  if(!el)return;
  var idx=0;
  el.innerHTML='<div class="loading-progress"><div class="loading-dots"><span></span><span></span><span></span><span></span></div><div class="loading-msg">'+(prefix||loadingMsgs[0])+'</div></div>';
  el.classList.remove('hidden');
  clearInterval(loadingInterval);
  loadingInterval=setInterval(function(){
    idx=(idx+1)%loadingMsgs.length;
    var msg=el.querySelector('.loading-msg');
    if(msg)msg.textContent=loadingMsgs[idx];
  },2000);
}
function hideLoading(){clearInterval(loadingInterval);}

document.querySelectorAll('.menu-item').forEach(function(m){m.addEventListener('click',function(){document.querySelectorAll('.menu-item').forEach(function(i){i.classList.remove('active');});document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});m.classList.add('active');var p=document.getElementById('page-'+m.dataset.page);if(p)p.classList.add('active');if(m.dataset.page==='logs')loadLogs();if(m.dataset.page==='dashboard'){loadDash();loadOrders();}if(m.dataset.page==='monitor')loadOrders();if(m.dataset.page==='gamification')loadGameAdmin();});});
function goTo(pg){document.querySelectorAll('.menu-item').forEach(function(i){i.classList.remove('active');});document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});var m=document.querySelector('[data-page="'+pg+'"]');if(m)m.classList.add('active');var p=document.getElementById('page-'+pg);if(p)p.classList.add('active');}

// Tab switching function
function switchTab(platform,tab){
  var page=document.getElementById('page-'+platform);
  if(!page)return;
  page.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
  page.querySelectorAll('.tab-content').forEach(function(c){c.classList.remove('active');});
  var tabBtn=page.querySelector('.tab[onclick*="'+tab+'"]');
  var tabContent=document.getElementById(platform+'-tab-'+tab);
  if(tabBtn)tabBtn.classList.add('active');
  if(tabContent)tabContent.classList.add('active');
}

async function loadDash(){
  var statsEl=document.querySelector('.stats-row');
  try{
    var d=await API.monitor.list();
    var orders=d.orders||[];
    var total=orders.length,running=0,done=0;
    orders.forEach(function(o){
      var vt=o.view_target||0,vc=o.view_current||0,lt=o.like_target||0,lc=o.like_current||0;
      var vDone=vt>0?vc>=vt:true;var lDone=lt>0?lc>=lt:true;
      if(vDone&&lDone)done++;else running++;
    });
    var rate=total>0?Math.round((done/total)*100):0;
    document.getElementById('stat-total').textContent=total;
    document.getElementById('stat-running').textContent=running;
    document.getElementById('stat-done').textContent=done;
    document.getElementById('stat-rate').textContent=rate+'%';
    return true;
  }catch(e){
    toast('โหลด Dashboard ไม่สำเร็จ: '+e.message,'error');
    return false;
  }
}

// Fixed log function - sends to correct endpoint /api/log-action
async function logActivity(action,category,details){try{var email=user?user.email:'unknown';await api('log-action',{action:action,category:category,details:details?JSON.stringify(details):'',email:email});}catch(e){console.error('Log error:',e);}}

// Refresh functions with toast
async function refreshDashboard(){toast('🔄 กำลังรีเฟรช...');await loadDash();await loadOrders();toast('✅ รีเฟรชเรียบร้อย!');}
async function refreshOrders(){toast('🔄 กำลังรีเฟรช...');await loadOrders();toast('✅ รีเฟรชเรียบร้อย!');}
async function refreshLogs(){toast('🔄 กำลังรีเฟรช...');await loadLogs();toast('✅ รีเฟรชเรียบร้อย!');}

var isSubmitting=false;
var lastSubmitTime=0;
async function handleAddMonitor(){
  // Debounce - ป้องกันกดซ้ำภายใน 2 วินาที
  var now=Date.now();
  if(isSubmitting||now-lastSubmitTime<2000)return;
  lastSubmitTime=now;
  
  var url=document.getElementById('m-url').value;
  if(!url){toast('กรุณาใส่ URL','error');return;}
  var line=document.getElementById('m-line').value;
  var vt=document.getElementById('m-chk-v').checked?document.getElementById('m-view').value:0;
  var lt=document.getElementById('m-chk-l').checked?document.getElementById('m-like').value:0;
  var st=document.getElementById('m-status');
  var btn=document.querySelector('.submit-btn');
  
  isSubmitting=true;
  if(btn)btn.disabled=true;
  st.className='status-box';st.textContent='⏳ กำลังเพิ่มงาน...';st.classList.remove('hidden');
  try{
    var d=await API.monitor.add({url:url,viewTarget:vt,likeTarget:lt,lineId:line});
    if(d.error)throw new Error(d.error);
    st.className='status-box success';st.textContent='✅ '+d.message;
    document.getElementById('m-url').value='';
    document.getElementById('m-view').value='';
    document.getElementById('m-line').value='';
    await logActivity('เพิ่มงาน Monitor','monitor',{url:url,viewTarget:Number(vt)||0,likeTarget:Number(lt)||0,lineId:line});
    fireConfetti();
    loadOrders();loadDash();
  }catch(e){st.className='status-box error';st.textContent='❌ '+e.message;}
  finally{isSubmitting=false;if(btn)btn.disabled=false;}
}

var allOrders=[];
async function loadOrders(){
  var listEl=document.getElementById('orders-list');
  var dashEl=document.getElementById('dash-orders');
  
  // Show skeleton
  showSkeleton(listEl,'cards');
  showSkeleton(dashEl,'cards');
  
  // Load last cron check time
  loadLastCronCheck();
  
  try{
    var d=await API.monitor.list();
    allOrders=d.orders||[];
    filterOrders();
    renderOrders(allOrders,'dash-orders');
    updateBadge();
  }catch(e){
    showError(listEl,'โหลดรายการไม่สำเร็จ: '+e.message,'loadOrders()');
    showError(dashEl,'โหลดรายการไม่สำเร็จ','loadOrders()');
  }
}

async function loadLastCronCheck(){
  try{
    var el=document.getElementById('last-cron-check');
    if(!el)return;
    var d=await API.get('monitor/last-check');
    if(d&&d.lastCheck){
      var timeStr=toThaiTime(d.lastCheck);
      var now=new Date();
      var last=new Date(d.lastCheck);
      var diffMin=Math.round((now.getTime()-last.getTime())/60000);
      var agoStr='';
      if(diffMin<1)agoStr='เมื่อสักครู่';
      else if(diffMin<60)agoStr=diffMin+' นาทีที่แล้ว';
      else if(diffMin<1440)agoStr=Math.floor(diffMin/60)+' ชม.ที่แล้ว';
      else agoStr=Math.floor(diffMin/1440)+' วันที่แล้ว';
      el.innerHTML='🔄 Cron อัพเดทล่าสุด: <strong>'+timeStr+'</strong> <span style="opacity:0.6">('+agoStr+')</span>';
      el.classList.remove('hidden');
    }else{
      el.innerHTML='🔄 Cron ยังไม่เคยรัน';
      el.classList.remove('hidden');
    }
  }catch(e){console.log('Failed to load last cron check:',e);}
}

function updateBadge(){
  var running=0;
  allOrders.forEach(function(o){
    if(getOrderStatus(o)==='running')running++;
  });
  var badge=document.getElementById('monitor-badge');
  var mobileBadge=document.getElementById('mobile-monitor-badge');
  if(badge){
    if(running>0){badge.textContent=running;badge.classList.remove('hidden');}
    else{badge.classList.add('hidden');}
  }
  if(mobileBadge){
    if(running>0){mobileBadge.textContent=running;mobileBadge.classList.remove('hidden');}
    else{mobileBadge.classList.add('hidden');}
  }
}

function filterOrders(){
  var searchEl=document.getElementById('order-search');
  var filterEl=document.getElementById('order-filter');
  var search=searchEl?searchEl.value.toLowerCase():'';
  var status=filterEl?filterEl.value:'all';
  
  var filtered=allOrders.filter(function(o){
    // Search filter
    var matchSearch=!search||(o.url&&o.url.toLowerCase().indexOf(search)>-1)||(o.line_id&&o.line_id.toLowerCase().indexOf(search)>-1);
    
    // Status filter - แก้เงื่อนไขใหม่
    var vt=o.view_target||0,vc=o.view_current||0,lt=o.like_target||0,lc=o.like_current||0;
    // เสร็จ = ต้องครบทุกเป้าหมายที่ตั้งไว้
    var viewDone=vt===0||vc>=vt;
    var likeDone=lt===0||lc>=lt;
    var isDone=viewDone&&likeDone&&(vt>0||lt>0);
    // กำลังทำ = มี progress แต่ยังไม่ครบ
    var isRunning=!isDone&&((vt>0&&vc>0)||(lt>0&&lc>0));
    // รอ = ยังไม่มี progress เลย
    var isPending=!isDone&&!isRunning;
    var matchStatus=status==='all'||(status==='done'&&isDone)||(status==='running'&&isRunning)||(status==='pending'&&isPending);
    
    return matchSearch&&matchStatus;
  });
  
  var countEl=document.getElementById('order-count');
  if(countEl)countEl.textContent='แสดง '+filtered.length+' จาก '+allOrders.length+' รายการ';
  renderOrders(filtered,'orders-list');
}

function getOrderStatus(o){
  var vt=o.view_target||0,vc=o.view_current||0,lt=o.like_target||0,lc=o.like_current||0;
  var viewDone=vt===0||vc>=vt;
  var likeDone=lt===0||lc>=lt;
  // เสร็จ = ครบทุกเป้าหมาย
  if(viewDone&&likeDone&&(vt>0||lt>0))return'done';
  // กำลังทำ = มี progress
  if((vt>0&&vc>0)||(lt>0&&lc>0))return'running';
  return'pending';
}
function getPlatform(url){if(!url)return'youtube';if(url.indexOf('tiktok')>-1)return'tiktok';if(url.indexOf('facebook')>-1||url.indexOf('fb.watch')>-1)return'facebook';if(url.indexOf('instagram')>-1)return'instagram';return'youtube';}
function getPlatformIcon(p){return p==='youtube'?'📺':p==='tiktok'?'🎵':p==='facebook'?'📘':p==='instagram'?'📷':'🌐';}
function getStatusBadge(s){return s==='done'?'<span class="status-badge done">✅ เสร็จ</span>':s==='running'?'<span class="status-badge running">⏳ กำลังทำ</span>':'<span class="status-badge pending">⏸️ รอ</span>';}

function renderOrders(orders,id){var el=document.getElementById(id);if(!el)return;if(!orders||!orders.length){el.innerHTML='<div class="empty"><div class="empty-icon">📭</div><div class="empty-title">ไม่พบรายการ</div><div class="empty-desc">'+(id==='orders-list'?'ลองเปลี่ยนตัวกรองหรือค้นหาใหม่':'เพิ่มงานใหม่เพื่อเริ่มติดตาม')+'</div></div>';return;}var h='';orders.forEach(function(o){var vt=o.view_target||0,vc=o.view_current||0,lt=o.like_target||0,lc=o.like_current||0;var vp=vt>0?Math.min(100,Math.round((vc/vt)*100)):0;var lp=lt>0?Math.min(100,Math.round((lc/lt)*100)):0;var time=o.created_at?toThaiTime(o.created_at):'';var updatedTime=o.updated_at?toThaiTime(o.updated_at):'';var plat=getPlatform(o.url);var status=getOrderStatus(o);var createdBy=o.created_by_name||(o.created_by?o.created_by.split('@')[0]:'');h+='<div class="order-card"><div class="order-head"><span class="order-plat">'+getPlatformIcon(plat)+' '+plat.charAt(0).toUpperCase()+plat.slice(1)+'</span>'+getStatusBadge(status)+'<span class="order-time">'+time+'</span></div><div class="order-url"><a href="'+o.url+'" target="_blank" class="order-link">'+o.url+'</a></div><div class="metrics">';if(vt>0)h+='<div class="metric"><div class="metric-head"><span class="metric-lbl">👀 วิว</span><span class="metric-val">'+fmt(vc)+'/'+fmt(vt)+' ('+vp+'%)</span></div><div class="metric-bar"><div class="metric-fill v" style="width:'+vp+'%"></div></div></div>';if(lt>0)h+='<div class="metric"><div class="metric-head"><span class="metric-lbl">👍 ไลค์</span><span class="metric-val">'+fmt(lc)+'/'+fmt(lt)+' ('+lp+'%)</span></div><div class="metric-bar"><div class="metric-fill l" style="width:'+lp+'%"></div></div></div>';h+='</div><div class="order-foot">'+(createdBy?'<span class="order-creator">'+createdBy+'</span>':'')+(o.line_id?'<span class="order-line">💬 '+o.line_id+'</span>':'')+(updatedTime?'<span class="order-updated" title="อัพเดทล่าสุดโดย Cron">🔄 '+updatedTime+'</span>':'')+'<button class="del-btn" onclick="delOrder('+o.id+')">🗑️ ลบ</button></div></div>';});el.innerHTML=h;}
var deleting={};
async function delOrder(id){
  if(deleting[id])return;
  if(!confirm('ลบงานนี้?'))return;
  deleting[id]=true;
  try{
    await fetch('/api/monitor/orders/'+id,{method:'DELETE',headers:{'X-Session-Token':localStorage.getItem('session')}});
    toast('ลบแล้ว');
    loadOrders();loadDash();
  }catch(e){toast(e.message,'error');}
  finally{delete deleting[id];}
}

var YT_PKG={'3in1-hq':{'1000':{v:1000,l:50,s:50,lb:'1,000 วิว'},'2000':{v:2000,l:50,s:50,lb:'2,000 วิว'},'3000':{v:3000,l:50,s:50,lb:'3,000 วิว'},'5000':{v:5000,l:100,s:50,lb:'5,000 วิว'},'10000':{v:10000,l:200,s:50,lb:'10,000 วิว'},'30000':{v:30000,l:500,s:150,lb:'30,000 วิว'},'50000':{v:50000,l:1000,s:200,lb:'50,000 วิว'},'100000':{v:100000,l:3000,s:500,lb:'100,000 วิว'}},'3in1-normal':{'1000':{v:1000,l:50,s:50,lb:'1,000 วิว'},'2000':{v:2000,l:50,s:50,lb:'2,000 วิว'},'3000':{v:3000,l:50,s:50,lb:'3,000 วิว'},'5000':{v:5000,l:100,s:50,lb:'5,000 วิว'},'10000':{v:10000,l:200,s:50,lb:'10,000 วิว'},'30000':{v:30000,l:500,s:150,lb:'30,000 วิว'},'50000':{v:50000,l:1000,s:200,lb:'50,000 วิว'},'100000':{v:100000,l:3000,s:500,lb:'100,000 วิว'}},'hq':{'1000':{v:1000,lb:'1,000 วิว #HQ'},'2000':{v:2000,lb:'2,000 วิว #HQ'},'3000':{v:3000,lb:'3,000 วิว #HQ'},'5000':{v:5000,lb:'5,000 วิว #HQ'},'10000':{v:10000,lb:'10,000 วิว #HQ'},'30000':{v:30000,lb:'30,000 วิว #HQ'},'50000':{v:50000,lb:'50,000 วิว #HQ'},'100000':{v:100000,lb:'100,000 วิว #HQ'}},'normal':{'1000':{v:1000,lb:'1,000 วิว'},'2000':{v:2000,lb:'2,000 วิว'},'3000':{v:3000,lb:'3,000 วิว'},'5000':{v:5000,lb:'5,000 วิว'},'10000':{v:10000,lb:'10,000 วิว'},'30000':{v:30000,lb:'30,000 วิว'},'50000':{v:50000,lb:'50,000 วิว'},'100000':{v:100000,lb:'100,000 วิว'}},'minute':{'1000':{v:1000,lb:'1,000 วิว'},'2000':{v:2000,lb:'2,000 วิว'},'3000':{v:3000,lb:'3,000 วิว'},'5000':{v:5000,lb:'5,000 วิว'},'10000':{v:10000,lb:'10,000 วิว'},'30000':{v:30000,lb:'30,000 วิว'},'50000':{v:50000,lb:'50,000 วิว'},'100000':{v:100000,lb:'100,000 วิว'}},'subscriber':{'100':{sub:100,lb:'100+ Sub'},'200':{sub:200,lb:'200+ Sub'},'500':{sub:500,lb:'500+ Sub'},'1000':{sub:1000,lb:'1K Sub'},'2000':{sub:2000,lb:'2K Sub'},'3000':{sub:3000,lb:'3K Sub'},'5000':{sub:5000,lb:'5K Sub'},'10000':{sub:10000,lb:'10K Sub'}}};
function updateYTPkg(){var t=document.getElementById('yt-type').value;var s=document.getElementById('yt-pkg');s.innerHTML='';var p=YT_PKG[t]||{};Object.keys(p).forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=p[k].lb;s.appendChild(o);});}
updateYTPkg();
async function handleGetYTStats(){var url=document.getElementById('yt-s-url').value;var r=document.getElementById('yt-s-result');r.className='status-box';r.textContent='⏳ กำลังดึงข้อมูล...';r.classList.remove('hidden');try{var d=await api('youtube/stats',{url:url});if(d.error)throw new Error(d.error);r.className='status-box success';if(d.type==='channel')r.textContent='📺 '+d.channelTitle+NL+'👥 Subscribers: '+fmt(d.subscribers);else r.textContent='🎬 '+d.title+NL+'👀 วิว: '+fmt(d.views)+NL+'👍 ไลค์: '+fmt(d.likes);logActivity('ดูสถิติ YouTube','youtube',{url:url});}catch(e){r.className='status-box error';r.textContent='❌ '+e.message;}}
async function handleGenYT(){var url=document.getElementById('yt-url').value;var type=document.getElementById('yt-type').value;var pk=document.getElementById('yt-pkg').value;var card=document.getElementById('yt-card');var cont=document.getElementById('yt-content');var txt=document.getElementById('yt-text');var btn=document.getElementById('yt-add-btn');if(!url){toast('กรุณาใส่ URL','error');return;}card.classList.remove('hidden');cont.textContent='⏳ กำลังสรุปงาน...';btn.style.display='none';try{var d=await api('youtube/stats',{url:url});if(d.error||!d.views)throw new Error(d.error||'ไม่พบข้อมูล');var p=YT_PKG[type]?YT_PKG[type][pk]:{};var sv=d.views,sl=d.likes||0,sum='';lastYT={url:url,views:p.v||0};if(type.indexOf('3in1')===0){var hq=type==='3in1-hq';sum='Package 3 IN 1'+NL+'ลิงก์ : '+url+NL+'เริ่ม '+fmt(sv)+' วิว'+NL+'จำนวน '+fmt(p.v)+' วิว'+(hq?' #HQ':' #ทั่วไป')+NL+'สิ้นสุด '+fmt(sv+p.v)+'++ วิว'+NL+NL+'ไลค์ '+fmt(sl)+' + '+p.l+' = '+fmt(sl+p.l)+'++ ไลค์'+NL+NL+'แชร์วิดีโอ + '+p.s;}else if(type==='subscriber'){sum='ช่อง : '+url+NL+'เริ่ม '+fmt(d.subscribers||0)+' Sub'+NL+'จำนวน '+fmt(p.sub)+' Sub #1'+NL+'สิ้นสุด '+fmt((d.subscribers||0)+p.sub)+'++ Sub';lastYT=null;}else{var suf=type==='hq'?' #HQ':type==='minute'?' #นาที':'';sum='ลิงก์ : '+url+NL+'เริ่ม '+fmt(sv)+' วิว'+NL+'จำนวน '+fmt(p.v)+' วิว'+suf+NL+'สิ้นสุด '+fmt(sv+p.v)+'++ วิว';}cont.textContent=sum;txt.value=sum;if(lastYT)btn.style.display='block';logActivity('สรุปงาน YouTube','youtube',{type:type,package:pk});toast('สร้างสรุปแล้ว');}catch(e){cont.textContent='❌ '+e.message;}}
function addYTToMonitor(){if(!lastYT)return;goTo('monitor');document.getElementById('m-url').value=lastYT.url;document.getElementById('m-view').value=lastYT.views;document.getElementById('m-chk-v').checked=true;document.getElementById('m-view').disabled=false;toast('กรอกข้อมูลแล้ว กรุณากด เพิ่มงาน');}

async function getTTStats(url){if(ttCache[url])return{stats:ttCache[url],url:url,fromCache:true};var d=await api('tiktok/stats',{url:url});if(d.stats)ttCache[url]=d.stats;return d;}
async function handleGenTT(){var urls=document.getElementById('tt-urls').value.trim();var type=document.getElementById('tt-type').value;var amt=Number(document.getElementById('tt-amt').value)||0;var card=document.getElementById('tt-card');var cont=document.getElementById('tt-content');var txt=document.getElementById('tt-text');if(!urls||!amt){toast('กรุณากรอกข้อมูล','error');return;}var lines=urls.split(NL).map(function(l){return l.trim();}).filter(function(l){return l&&l.indexOf('tiktok.com')>-1;});if(!lines.length){toast('ไม่พบ URL TikTok','error');return;}card.classList.remove('hidden');cont.textContent='⏳ กำลังดึงข้อมูล...';var labels={view:'วิว',like:'ไลค์',save:'เซฟ',share:'แชร์'};var label=labels[type]||type;var results=[];for(var i=0;i<lines.length;i++){cont.textContent='⏳ '+(i+1)+'/'+lines.length;try{var d=await getTTStats(lines[i]);if(d.stats){var s=d.stats;var st=type==='view'?s.views:type==='like'?s.likes:type==='save'?s.bookmarks:s.shares;results.push((lines.length>1?(i+1)+'. ':'')+d.url+NL+'เริ่ม '+fmt(st)+' + '+fmt(amt)+' = '+fmt(st+amt)+'++ '+label);}else results.push((i+1)+'. ❌ ไม่สามารถดึงข้อมูล');}catch(e){results.push((i+1)+'. ❌ '+e.message);}if(i<lines.length-1)await new Promise(function(r){setTimeout(r,500);});}cont.textContent=results.join(NL+NL);txt.value=results.join(NL+NL);logActivity('สรุปงาน TikTok','tiktok',{type:type,count:lines.length});toast('สร้างสรุปแล้ว');}
async function handleGenTTAll(){var urls=document.getElementById('tta-urls').value.trim();var card=document.getElementById('tta-card');var cont=document.getElementById('tta-content');var txt=document.getElementById('tta-text');if(!urls){toast('กรุณาใส่ URL','error');return;}var lines=urls.split(NL).map(function(l){return l.trim();}).filter(function(l){return l&&l.indexOf('tiktok.com')>-1;});if(!lines.length){toast('ไม่พบ URL TikTok','error');return;}var hV=document.getElementById('tta-v').checked,hL=document.getElementById('tta-l').checked,hSv=document.getElementById('tta-sv').checked,hSh=document.getElementById('tta-sh').checked;if(!hV&&!hL&&!hSv&&!hSh){toast('กรุณาเลือกอย่างน้อย 1 ประเภท','error');return;}card.classList.remove('hidden');cont.textContent='⏳ กำลังดึงข้อมูล...';var results=[];for(var i=0;i<lines.length;i++){cont.textContent='⏳ '+(i+1)+'/'+lines.length;try{var d=await getTTStats(lines[i]);if(d.stats){var s=d.stats;var sum=(lines.length>1?(i+1)+'. ':'')+d.url+NL;if(hV){var a=Number(document.getElementById('tta-va').value)||0;if(a>0)sum+='เริ่ม '+fmt(s.views)+' + '+fmt(a)+' = '+fmt(s.views+a)+'++ วิว'+(document.getElementById('tta-vt').value==='th'?' #TH':'')+NL;}if(hL){var a2=Number(document.getElementById('tta-la').value)||0;var lt=document.getElementById('tta-lt').value;if(a2>0)sum+='เริ่ม '+fmt(s.likes)+' + '+fmt(a2)+' = '+fmt(s.likes+a2)+'++ ไลค์'+(lt==='hq'?' #HQ':lt==='th'?' #TH':' #1')+NL;}if(hSv){var a3=Number(document.getElementById('tta-sva').value)||0;if(a3>0)sum+='เริ่ม '+fmt(s.bookmarks)+' + '+fmt(a3)+' = '+fmt(s.bookmarks+a3)+'++ เซฟ'+NL;}if(hSh){var a4=Number(document.getElementById('tta-sha').value)||0;if(a4>0)sum+='เริ่ม '+fmt(s.shares)+' + '+fmt(a4)+' = '+fmt(s.shares+a4)+'++ แชร์'+NL;}results.push(sum.trim());}else results.push((i+1)+'. ❌ ไม่สามารถดึงข้อมูล');}catch(e){results.push((i+1)+'. ❌ '+e.message);}if(i<lines.length-1)await new Promise(function(r){setTimeout(r,500);});}cont.textContent=results.join(NL+NL);txt.value=results.join(NL+NL);logActivity('สรุปงาน TikTok รวม','tiktok',{count:lines.length});toast('สร้างสรุปแล้ว');}
async function handleGenTTF(){var urls=document.getElementById('ttf-urls').value.trim();var type=document.getElementById('ttf-type').value;var amt=Number(document.getElementById('ttf-amt').value)||0;var card=document.getElementById('ttf-card');var cont=document.getElementById('ttf-content');var txt=document.getElementById('ttf-text');if(!urls||!amt){toast('กรุณากรอกข้อมูล','error');return;}var lines=urls.split(NL).map(function(l){return l.trim();}).filter(function(l){return l;});card.classList.remove('hidden');cont.textContent='⏳ กำลังดึงข้อมูล...';var tl=type==='hq'?'#HQ':type==='th'?'#TH':'#1';var results=[];for(var i=0;i<lines.length;i++){cont.textContent='⏳ '+(i+1)+'/'+lines.length;try{var d=await api('tiktok/follower',{url:lines[i]});if(d.followers!==undefined)results.push((lines.length>1?(i+1)+'. ':'')+'ฟอลโล่ TikTok'+NL+'ลิงก์ : '+d.profileUrl+NL+'แพ็คเกจ '+fmt(amt)+' ฟอล '+tl+NL+'เพิ่มจาก '+fmt(d.followers)+' ฟอล'+NL+'จะครบที่ '+fmt(d.followers+amt)+'++ ฟอล');else results.push((i+1)+'. ❌ ไม่สามารถดึงข้อมูล');}catch(e){results.push((i+1)+'. ❌ '+e.message);}if(i<lines.length-1)await new Promise(function(r){setTimeout(r,500);});}cont.textContent=results.join(NL+NL);txt.value=results.join(NL+NL);logActivity('TikTok Follower','tiktok',{type:type,count:lines.length});toast('สร้างสรุปแล้ว');}

var lastFBStats=null;
async function handleGetFBStats(){
  var url=document.getElementById('fb-s-url').value;
  var r=document.getElementById('fb-s-result');
  var card=document.getElementById('fb-s-card');
  showLoading(r,'🔍 กำลังเชื่อมต่อ Facebook...');
  card.classList.add('hidden');
  lastFBStats=null;
  
  // ตรวจสอบว่าเป็น Video/Reel หรือไม่
  var isVideo=url.includes('/reel/')||url.includes('/videos/')||url.includes('/watch')||url.includes('fb.watch');
  
  try{
    var d;
    if(isVideo){
      // ใช้ video-stats API
      d=await api('facebook/video-stats',{url:url});
      hideLoading();
      if(d.error)throw new Error(d.error);
      
      // แสดงผลแบบ Card
      r.classList.add('hidden');
      card.classList.remove('hidden');
      document.getElementById('fb-s-title').textContent=d.title||'Facebook Video';
      document.getElementById('fb-s-meta').textContent=(d.author||'')+(d.duration?' • '+d.duration:'')+(d.publishedAt?' • '+d.publishedAt:'');
      document.getElementById('fb-s-views').textContent=fmt(d.views||0);
      document.getElementById('fb-s-likes').textContent=fmt(d.likes||0);
      document.getElementById('fb-s-comments').textContent=fmt(d.comments||0);
      document.getElementById('fb-s-shares').textContent=fmt(d.shares||0);
      var thumb=document.getElementById('fb-s-thumb');
      if(d.thumbnail){thumb.style.backgroundImage='url('+d.thumbnail+')';thumb.textContent='';}else{thumb.style.backgroundImage='';thumb.textContent='🎬';}
      
      // เก็บไว้ใช้ในหน้าสรุปงาน
      lastFBStats={type:'video',views:d.views||0,likes:d.likes||0,comments:d.comments||0,shares:d.shares||0,url:url};
      logActivity('ดูสถิติ FB Video','facebook',{url:url,views:d.views});
    }else{
      // ใช้ stats API ปกติ
      d=await api('facebook/stats',{url:url});
      hideLoading();
      if(d.error)throw new Error(d.error);
      r.className='status-box success';
      if(d.type==='page'){
        r.textContent='📘 '+d.pageName+NL+'👍 ไลค์: '+fmt(d.likes)+NL+'👥 ฟอลโลว์: '+fmt(d.followers);
        lastFBStats={type:'page',likes:d.likes||0,followers:d.followers||0,url:url};
      }else{
        var s=d.stats||{};
        r.textContent='📝 โพสต์ Facebook'+NL+'❤️ รีแอคชั่น: '+fmt(s.reactions||0)+NL+'💬 คอมเมนต์: '+fmt(s.comments||0)+NL+'🔗 แชร์: '+fmt(s.shares||0)+NL+'👀 วิว: '+fmt(s.views||0);
        lastFBStats={type:'post',reactions:s.reactions||0,comments:s.comments||0,shares:s.shares||0,views:s.views||0,url:url};
      }
      logActivity('ดูสถิติ Facebook','facebook',{url:url});
    }
    toast('ดึงข้อมูลสำเร็จ!');
  }catch(e){hideLoading();r.className='status-box error';r.textContent='❌ '+e.message;}
}
async function handleGenFB(){var url=document.getElementById('fb-url').value;var type=document.getElementById('fb-type').value;var amt=Number(document.getElementById('fb-amt').value)||0;var stIn=document.getElementById('fb-start');var card=document.getElementById('fb-card');var cont=document.getElementById('fb-content');var txt=document.getElementById('fb-text');if(!url||!amt){toast('กรุณากรอกข้อมูล','error');return;}card.classList.remove('hidden');cont.textContent='⏳ กำลังดึงข้อมูล...';
try{
  var st=Number(stIn.value)||0;
  var label='',tl='';
  
  // ถ้ามี lastFBStats และ URL ตรงกัน ใช้เลย
  if(lastFBStats&&lastFBStats.url===url){
    if(type.indexOf('post-like')===0){st=st||lastFBStats.reactions||lastFBStats.likes||0;label='ไลค์';tl=type==='post-like-th1'?' #TH1':type==='post-like-th2'?' #TH2':'';}
    else if(type==='post-share'){st=st||lastFBStats.shares||0;label='แชร์';}
    else if(type==='video-view'){st=st||lastFBStats.views||0;label='วิว';}
    else{st=st||lastFBStats.followers||0;label='ผู้ติดตาม';}
  }else{
    // ตรวจสอบว่าเป็น Video/Reel หรือไม่
    var isVideo=url.includes('/reel/')||url.includes('/videos/')||url.includes('/watch')||url.includes('fb.watch');
    var d;
    if(isVideo&&type==='video-view'){
      d=await api('facebook/video-stats',{url:url});
      st=st||d.views||0;label='วิว';
    }else{
      d=await api('facebook/stats',{url:url});
      var stats=d.stats||{};
      if(type.indexOf('post-like')===0){st=st||stats.reactions||0;label='ไลค์';tl=type==='post-like-th1'?' #TH1':type==='post-like-th2'?' #TH2':'';}
      else if(type==='post-share'){st=st||stats.shares||0;label='แชร์';}
      else if(type==='video-view'){st=st||stats.views||0;label='วิว';}
      else{st=st||d.followers||0;label='ผู้ติดตาม';}
    }
  }
  cont.textContent='ลิงก์ : '+url+NL+'เริ่ม '+fmt(st)+' '+label+NL+'จำนวน '+fmt(amt)+' '+label+tl+NL+'สิ้นสุด '+fmt(st+amt)+'++ '+label;
  txt.value=cont.textContent;
  logActivity('สรุปงาน Facebook','facebook',{type:type});
  toast('สร้างสรุปแล้ว');
}catch(e){cont.textContent='❌ '+e.message;}}
function addFBItem(){
  var c=document.getElementById('fbb-items');
  var rows=c.querySelectorAll('.fb-row');
  if(rows.length>=3){toast('สูงสุด 3 รายการ','error');return;}
  
  // หาว่าเลือกอะไรไปแล้ว
  var hasLike=false,hasView=false,hasShare=false;
  rows.forEach(function(r){
    var v=r.querySelector('.fb-type').value;
    if(v.indexOf('like')===0)hasLike=true;
    if(v==='view')hasView=true;
    if(v==='share')hasShare=true;
  });
  
  // สร้าง options เฉพาะที่ยังไม่ได้เลือก
  var opts='';
  if(!hasLike)opts+='<option value="like-mix">👍 ไลค์ (คละ)</option><option value="like-th1">👍 ไลค์ #TH1</option><option value="like-th2">👍 ไลค์ #TH2</option>';
  if(!hasView)opts+='<option value="view">👁️ วิว</option>';
  if(!hasShare)opts+='<option value="share">🔗 แชร์</option>';
  
  if(!opts){toast('เลือกครบทุกประเภทแล้ว','error');return;}
  
  var idx=rows.length+1;
  var div=document.createElement('div');
  div.className='form-row mt-2 fb-row';
  div.innerHTML='<div style="flex:2"><label class="form-label">#'+idx+'</label><select class="fb-type" onchange="updateFBOptions()">'+opts+'</select></div><div style="flex:1"><label class="form-label">จำนวน</label><input type="number" class="fb-amt" placeholder="1000"/></div><div style="flex:1"><label class="form-label">เริ่ม</label><input type="number" class="fb-st" placeholder="auto"/></div><div style="width:40px;padding-top:20px"><button class="del-btn" onclick="removeFBItem(this)">🗑️</button></div>';
  c.appendChild(div);
  updateFBOptions();
}
function removeFBItem(btn){btn.closest('.fb-row').remove();updateFBOptions();reindexFBItems();}
function reindexFBItems(){var rows=document.querySelectorAll('.fb-row');rows.forEach(function(r,i){r.querySelector('.form-label').textContent='#'+(i+1);});}
function updateFBOptions(){
  var rows=document.querySelectorAll('.fb-row');
  var hasLike=false,hasView=false,hasShare=false;
  rows.forEach(function(r){
    var v=r.querySelector('.fb-type').value;
    if(v.indexOf('like')===0)hasLike=true;
    if(v==='view')hasView=true;
    if(v==='share')hasShare=true;
  });
  
  rows.forEach(function(r){
    var sel=r.querySelector('.fb-type');
    var cur=sel.value;
    var isLike=cur.indexOf('like')===0;
    var isView=cur==='view';
    var isShare=cur==='share';
    var opts='';
    
    // ถ้าตัวเองเป็นไลค์ หรือยังไม่มีใครเลือกไลค์
    if(isLike||!hasLike){
      opts+='<option value="like-mix"'+(cur==='like-mix'?' selected':'')+'>👍 ไลค์ (คละ)</option>';
      opts+='<option value="like-th1"'+(cur==='like-th1'?' selected':'')+'>👍 ไลค์ #TH1</option>';
      opts+='<option value="like-th2"'+(cur==='like-th2'?' selected':'')+'>👍 ไลค์ #TH2</option>';
    }
    if(isView||!hasView)opts+='<option value="view"'+(cur==='view'?' selected':'')+'>👁️ วิว</option>';
    if(isShare||!hasShare)opts+='<option value="share"'+(cur==='share'?' selected':'')+'>🔗 แชร์</option>';
    sel.innerHTML=opts;
  });
}
async function handleGenFBBatch(){var url=document.getElementById('fbb-url').value;var card=document.getElementById('fbb-card');var cont=document.getElementById('fbb-content');var txt=document.getElementById('fbb-text');var rows=document.querySelectorAll('.fb-row');if(!url||!rows.length){toast('กรุณากรอกข้อมูล','error');return;}card.classList.remove('hidden');showLoading(cont,'🔍 กำลังดึงข้อมูล...');
try{
  var isVideo=url.includes('/reel/')||url.includes('/videos/')||url.includes('/watch')||url.includes('fb.watch');
  var stats={};
  var hasViewType=false;
  rows.forEach(function(r){if(r.querySelector('.fb-type').value==='view')hasViewType=true;});
  
  // ถ้าเป็น Video/Reel และมีการเลือก view ให้ใช้ video-stats API
  if(isVideo&&hasViewType){
    var vd=await api('facebook/video-stats',{url:url});
    stats={views:vd.views||0,reactions:vd.likes||0,shares:vd.shares||0,comments:vd.comments||0};
  }else{
    var d=await api('facebook/stats',{url:url});
    stats=d.stats||{};
  }
  hideLoading();
  
  var lines=['ลิงก์ : '+url];
  rows.forEach(function(r){
    var type=r.querySelector('.fb-type').value;
    var amt=Number(r.querySelector('.fb-amt').value)||0;
    var st=Number(r.querySelector('.fb-st').value)||0;
    var label='',tag='';
    if(type.indexOf('like')===0){
      st=st||stats.reactions||0;
      label='ไลค์';
      if(type==='like-th1')tag=' #TH1';
      else if(type==='like-th2')tag=' #TH2';
    }
    else if(type==='share'){st=st||stats.shares||0;label='แชร์';}
    else if(type==='view'){st=st||stats.views||0;label='วิว';}
    lines.push('เริ่ม '+fmt(st)+' + '+fmt(amt)+' = '+fmt(st+amt)+'++ '+label+tag);
  });
  cont.textContent=lines.join(NL);
  txt.value=lines.join(NL);
  logActivity('FB Batch','facebook',{itemCount:rows.length});
  toast('สร้างสรุปแล้ว');
}catch(e){hideLoading();cont.textContent='❌ '+e.message;}}

async function handleGetIGStats(){var url=document.getElementById('ig-s-url').value;var r=document.getElementById('ig-s-result');r.className='status-box';r.textContent='⏳ กำลังดึงข้อมูล...';r.classList.remove('hidden');try{var d=await api('instagram/stats',{url:url});if(d.error)throw new Error(d.error);r.className='status-box success';if(d.type==='profile')r.textContent='📷 @'+d.username+NL+'👥 Followers: '+fmt(d.followers)+NL+'📸 Posts: '+fmt(d.posts);else{var s=d.stats||{};r.textContent='👍 Likes: '+fmt(s.likes||0)+NL+'💬 Comments: '+fmt(s.comments||0)+(s.views>0?NL+'👀 Views: '+fmt(s.views):'');}logActivity('ดูสถิติ Instagram','instagram',{url:url});}catch(e){r.className='status-box error';r.textContent='❌ '+e.message;}}
async function handleGenIG(){var url=document.getElementById('ig-url').value;var type=document.getElementById('ig-type').value;var amt=Number(document.getElementById('ig-amt').value)||0;var card=document.getElementById('ig-card');var cont=document.getElementById('ig-content');var txt=document.getElementById('ig-text');if(!url||!amt){toast('กรุณากรอกข้อมูล','error');return;}card.classList.remove('hidden');cont.textContent='⏳ กำลังดึงข้อมูล...';try{var d=await api('instagram/stats',{url:url});var st=0,label=type,s=d.stats||{};if(type==='like'){st=s.likes||0;label='ไลค์';}else if(type==='follower'){st=d.followers||0;label='ผู้ติดตาม';}else{st=s.views||0;label='วิว';}cont.textContent='ลิงก์ : '+url+NL+'เริ่ม '+fmt(st)+' '+label+NL+'จำนวน '+fmt(amt)+' '+label+NL+'สิ้นสุด '+fmt(st+amt)+'++ '+label;txt.value=cont.textContent;logActivity('สรุปงาน Instagram','instagram',{type:type});toast('สร้างสรุปแล้ว');}catch(e){cont.textContent='❌ '+e.message;}}
function addIGItem(){var c=document.getElementById('igb-items');if(c.querySelectorAll('.ig-row').length>=2){toast('สูงสุด 2 รายการ','error');return;}var idx=c.querySelectorAll('.ig-row').length+1;var div=document.createElement('div');div.className='form-row mt-2 ig-row';div.innerHTML='<div style="flex:2"><label class="form-label">#'+idx+'</label><select class="ig-type"><option value="like">👍 Like</option><option value="follower">👥 Follower</option><option value="view">👁️ View</option></select></div><div style="flex:1"><label class="form-label">จำนวน</label><input type="number" class="ig-amt" placeholder="1000"/></div><div style="width:40px;padding-top:20px"><button class="del-btn" onclick="this.closest(\\'.ig-row\\').remove()">🗑️</button></div>';c.appendChild(div);}
async function handleGenIGBatch(){var url=document.getElementById('igb-url').value;var card=document.getElementById('igb-card');var cont=document.getElementById('igb-content');var txt=document.getElementById('igb-text');var rows=document.querySelectorAll('.ig-row');if(!url||!rows.length){toast('กรุณากรอกข้อมูล','error');return;}card.classList.remove('hidden');cont.textContent='⏳ กำลังดึงข้อมูล...';try{var pUrl=url.replace('/reel/','/p/');var d=await api('instagram/stats',{url:pUrl});var s=d.stats||{};var lines=['ลิงก์ : '+pUrl];rows.forEach(function(r){var type=r.querySelector('.ig-type').value;var amt=Number(r.querySelector('.ig-amt').value)||0;var st=0,label='';if(type==='like'){st=s.likes||0;label='ไลค์';}else if(type==='follower'){st=d.followers||0;label='ผู้ติดตาม';}else{st=s.views||0;label='วิว';}lines.push('เริ่ม '+fmt(st)+' + '+fmt(amt)+' = '+fmt(st+amt)+'++ '+label);});cont.textContent=lines.join(NL);txt.value=lines.join(NL);logActivity('IG Batch','instagram',{itemCount:rows.length});toast('สร้างสรุปแล้ว');}catch(e){cont.textContent='❌ '+e.message;}}

// Improved Activity Logs functions
async function loadLogs(){
  try{
    var d=await api('logs');
    allLogs=d.logs||[];
    var stats=d.stats||[];
    var totalActions=allLogs.length;
    var today=new Date().toISOString().split('T')[0];
    var weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);var weekStr=weekAgo.toISOString().split('T')[0];
    var todayCount=allLogs.filter(function(l){return l.created_at&&l.created_at.indexOf(today)===0;}).length;
    var weekCount=allLogs.filter(function(l){return l.created_at&&l.created_at>=weekStr;}).length;
    
    document.getElementById('logs-total').textContent=fmt(totalActions);
    document.getElementById('logs-users').textContent=stats.length;
    document.getElementById('logs-today').textContent=fmt(todayCount);
    document.getElementById('logs-week').textContent=fmt(weekCount);
    
    // Platform stats - รวม Monitor ด้วย
    var platCounts={monitor:0,youtube:0,tiktok:0,facebook:0,instagram:0};
    allLogs.forEach(function(l){if(l.category&&platCounts.hasOwnProperty(l.category))platCounts[l.category]++;});
    var total=Object.values(platCounts).reduce(function(a,b){return a+b;},0)||1;
    var platColors={monitor:'#22c55e',youtube:'#ff0000',tiktok:'#00d9ff',facebook:'#1877f2',instagram:'#e1306c'};
    var platIcons={monitor:'🧠',youtube:'📺',tiktok:'🎵',facebook:'📘',instagram:'📷'};
    var platHtml='';
    Object.keys(platCounts).forEach(function(k){
      var pct=Math.round((platCounts[k]/total)*100);
      platHtml+='<div class="plat-bar-item"><div class="plat-bar-head"><span>'+platIcons[k]+' '+k.charAt(0).toUpperCase()+k.slice(1)+'</span><span>'+platCounts[k]+' ('+pct+'%)</span></div><div class="plat-bar"><div class="plat-bar-fill" style="width:'+pct+'%;background:'+platColors[k]+'"></div></div></div>';
    });
    document.getElementById('platform-stats').innerHTML=platHtml;
    
    // Leaderboard with Gamification + Rank Animation
    var lbHtml='';
    var newRanks={};
    if(!stats.length)lbHtml='<div class="empty" style="padding:24px">🏆 ยังไม่มีข้อมูล</div>';
    else{
      stats.sort(function(a,b){return(b.total_actions||0)-(a.total_actions||0);});
      stats.slice(0,5).forEach(function(s,i){
        var initial=(s.admin_name||s.admin_email||'?').charAt(0).toUpperCase();
        var name=s.admin_name||(s.admin_email||'').split('@')[0]||'unknown';
        var medals=['🥇','🥈','🥉'];
        var medal=i<3?medals[i]:(i+1);
        var emailEnc=encodeURIComponent(s.admin_email||'');
        var email=s.admin_email||'';
        newRanks[email]=i+1;
        
        // Check rank change
        var rankClass='';
        if(prevRanks[email]!==undefined){
          if(prevRanks[email]>i+1)rankClass='rank-up';
          else if(prevRanks[email]<i+1)rankClass='rank-down';
        }
        
        // Gamification
        var userStats={total:s.total_actions||0,youtube:s.youtube_count||0,tiktok:s.tiktok_count||0,facebook:s.facebook_count||0,instagram:s.instagram_count||0,night_count:s.night_count||0,early_count:s.early_count||0,weekend_count:s.weekend_count||0,max_streak:s.max_streak||0,max_daily:s.max_daily||0,max_hourly:s.max_hourly||0,days_active:s.days_active||0,best_rank:s.best_rank||999};
        var lv=GAME.getLevel(userStats.total);
        var badges=GAME.getBadges(userStats);
        var badgeIcons=badges.slice(0,4).map(function(b){return'<span title="'+b.name+'">'+b.icon+'</span>';}).join('');
        
        lbHtml+='<div class="lb-row clickable '+rankClass+'" onclick="showUserDetail(\\''+emailEnc+'\\')"><div class="lb-medal">'+medal+'</div><div class="lb-user-avatar">'+initial+'</div><div class="lb-user-info"><div class="lb-user-name">'+name+'<span class="lb-level" style="background:'+lv.color+'">Lv.'+lv.lv+'</span></div><div class="lb-badges">'+badgeIcons+'</div></div><div class="lb-user-score">'+fmt(s.total_actions||0)+'</div></div>';
      });
      prevRanks=newRanks;
      
      // Update current user stats + check new badges
      if(user&&user.email){
        var myStats=stats.find(function(s){return s.admin_email===user.email;});
        if(myStats){
          var userGameStats={total:myStats.total_actions||0,youtube:myStats.youtube_count||0,tiktok:myStats.tiktok_count||0,facebook:myStats.facebook_count||0,instagram:myStats.instagram_count||0,night_count:myStats.night_count||0,early_count:myStats.early_count||0,weekend_count:myStats.weekend_count||0,max_streak:myStats.max_streak||0,max_daily:myStats.max_daily||0,max_hourly:myStats.max_hourly||0,days_active:myStats.days_active||0,best_rank:myStats.best_rank||999};
          GAME.renderUserStats(userGameStats);
          
          // Check for new badges
          var currentBadges=GAME.getBadges(userGameStats);
          currentBadges.forEach(function(b){
            if(earnedBadges.indexOf(b.id)===-1){
              if(earnedBadges.length>0)showBadgeEarned(b);
              earnedBadges.push(b.id);
            }
          });
        }
      }
    }
    document.getElementById('leaderboard').innerHTML=lbHtml;
    
    renderLogsTable();
  }catch(e){console.error('Load logs error:',e);}
}

function renderLogsTable(){
  var filtered=currentLogFilter==='all'?allLogs:allLogs.filter(function(l){return l.category===currentLogFilter;});
  var tbody=document.getElementById('logs-tbody');
  var emptyEl=document.getElementById('logs-empty');
  if(!filtered.length){
    tbody.innerHTML='';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  var platColors={youtube:'#ff0000',tiktok:'#00d9ff',facebook:'#1877f2',instagram:'#e1306c',monitor:'#22c55e'};
  var platIcons={youtube:'📺',tiktok:'🎵',facebook:'📘',instagram:'📷',monitor:'🧠',system:'⚙️'};
  var html='';
  filtered.slice(0,50).forEach(function(l){
    var name=l.admin_name||(l.admin_email||'').split('@')[0]||'unknown';
    var initial=name.charAt(0).toUpperCase();
    var cat=l.category||'system';
    var icon=platIcons[cat]||'📋';
    var color=platColors[cat]||'#6b7280';
    var time=l.created_at?toThaiTime(l.created_at):'';
    var emailEnc=encodeURIComponent(l.admin_email||'');
    var actionText=l.action||'-';
    var detailsHtml='';
    if(l.details){try{var det=typeof l.details==='string'?JSON.parse(l.details):l.details;if(det.url)detailsHtml='<div class="log-details">🔗 '+det.url.substring(0,50)+(det.url.length>50?'...':'')+'</div>';if(det.viewTarget)detailsHtml+='<span class="log-tag">👀 '+fmt(det.viewTarget)+'</span>';if(det.likeTarget)detailsHtml+='<span class="log-tag">👍 '+fmt(det.likeTarget)+'</span>';}catch(e){}}
    html+='<tr onclick="showUserDetail(\\''+emailEnc+'\\')"><td><div class="log-user clickable"><div class="log-user-avatar">'+initial+'</div><div class="log-user-info"><div class="log-user-name">'+name+'</div><div class="log-user-email">'+(l.admin_email||'')+'</div></div></div></td><td><span class="log-platform" style="background:'+color+'20;color:'+color+'">'+icon+' '+cat+'</span></td><td class="log-action">'+actionText+detailsHtml+'</td><td class="log-time">'+time+'</td></tr>';
  });
  tbody.innerHTML=html;
}

function filterLogs(f){
  currentLogFilter=f;
  document.querySelectorAll('.filter-chip').forEach(function(b){b.classList.remove('active');});
  document.querySelector('.filter-chip[data-filter="'+f+'"]').classList.add('active');
  renderLogsTable();
}

// Show user detail modal
async function showUserDetail(emailEnc){
  var email=decodeURIComponent(emailEnc);
  var modal=document.getElementById('user-modal');
  var content=document.getElementById('user-modal-content');
  content.innerHTML='<div style="text-align:center;padding:40px"><div style="font-size:32px;margin-bottom:12px">⏳</div><div>กำลังโหลดข้อมูล...</div></div>';
  modal.classList.remove('hidden');
  try{
    var d=await api('logs/user/'+emailEnc);
    var stats=d.stats||{};
    var logs=d.logs||[];
    var daily=d.daily||[];
    var name=email.split('@')[0];
    var initial=name.charAt(0).toUpperCase();
    var platColors={youtube:'#ff0000',tiktok:'#00d9ff',facebook:'#1877f2',instagram:'#e1306c',monitor:'#22c55e'};
    var platIcons={youtube:'📺',tiktok:'🎵',facebook:'📘',instagram:'📷',monitor:'🧠'};
    var html='<div class="modal-header"><div class="modal-user"><div class="modal-avatar">'+initial+'</div><div><div class="modal-name">'+name+'</div><div class="modal-email">'+email+'</div></div></div><button class="modal-close" onclick="closeUserModal()">✕</button></div>';
    html+='<div class="modal-stats"><div class="modal-stat"><div class="modal-stat-val">'+fmt(stats.total_actions||0)+'</div><div class="modal-stat-lbl">กิจกรรมทั้งหมด</div></div><div class="modal-stat"><div class="modal-stat-val">'+fmt(stats.youtube_count||0)+'</div><div class="modal-stat-lbl">📺 YouTube</div></div><div class="modal-stat"><div class="modal-stat-val">'+fmt(stats.tiktok_count||0)+'</div><div class="modal-stat-lbl">🎵 TikTok</div></div><div class="modal-stat"><div class="modal-stat-val">'+fmt(stats.facebook_count||0)+'</div><div class="modal-stat-lbl">📘 Facebook</div></div><div class="modal-stat"><div class="modal-stat-val">'+fmt(stats.instagram_count||0)+'</div><div class="modal-stat-lbl">📷 Instagram</div></div></div>';
    if(daily.length){html+='<div class="modal-section"><div class="modal-section-title">📅 กิจกรรมรายวัน (30 วันล่าสุด)</div><div class="daily-chart">';daily.slice(0,14).forEach(function(day){var max=Math.max.apply(null,daily.map(function(x){return x.count;}));var pct=max>0?Math.round((day.count/max)*100):0;var date=toThaiDate(day.date);html+='<div class="daily-bar-wrap"><div class="daily-bar" style="height:'+pct+'%"></div><div class="daily-val">'+day.count+'</div><div class="daily-date">'+date+'</div></div>';});html+='</div></div>';}
    html+='<div class="modal-section"><div class="modal-section-title">📜 กิจกรรมล่าสุด</div><div class="modal-logs">';
    if(!logs.length)html+='<div class="empty" style="padding:20px">ยังไม่มีกิจกรรม</div>';
    else{logs.slice(0,30).forEach(function(l){var cat=l.category||'system';var icon=platIcons[cat]||'📋';var color=platColors[cat]||'#6b7280';var time=l.created_at?toThaiTime(l.created_at):'';html+='<div class="modal-log-item"><span class="modal-log-icon" style="background:'+color+'20;color:'+color+'">'+icon+'</span><span class="modal-log-action">'+(l.action||'-')+'</span><span class="modal-log-time">'+time+'</span></div>';});}
    html+='</div></div>';
    content.innerHTML=html;
  }catch(e){content.innerHTML='<div style="text-align:center;padding:40px;color:var(--danger)">❌ '+e.message+'</div>';}
}

function closeUserModal(){document.getElementById('user-modal').classList.add('hidden');}

// ==================== GAMIFICATION ADMIN ====================
var GAME_ADMIN_EMAIL='wyvernorm@gmail.com';
var gameUsers=[];

function checkGameAdmin(){
  if(user&&user.email===GAME_ADMIN_EMAIL){
    var menu=document.getElementById('menu-gamification');
    if(menu)menu.classList.remove('hidden');
  }
}

var badgesExpanded=false;
function toggleBadges(){
  var list=document.getElementById('badge-list');
  var btn=document.getElementById('badge-toggle');
  badgesExpanded=!badgesExpanded;
  if(badgesExpanded){
    list.classList.remove('collapsed');
    btn.textContent='ย่อ ▲';
  }else{
    list.classList.add('collapsed');
    btn.textContent='ดูเพิ่มเติม ▼';
  }
}

function loadGameAdmin(){
  // Render Level list
  var levelHtml='';
  GAME.levels.forEach(function(lv){
    levelHtml+='<div class="level-item"><div class="level-color" style="background:'+lv.color+'"></div><div class="level-info"><div class="level-name">Lv.'+lv.lv+' '+lv.name+'</div><div class="level-range">'+fmt(lv.min)+' - '+fmt(lv.max)+' งาน</div></div></div>';
  });
  document.getElementById('level-list').innerHTML=levelHtml;
  
  // Render Badge list
  var badgeHtml='';
  GAME.badges.forEach(function(b){
    badgeHtml+='<div class="badge-item-admin"><div class="badge-icon">'+b.icon+'</div><div class="badge-info"><div class="badge-name">'+b.name+'</div><div class="badge-desc">'+b.desc+'</div></div><div class="badge-count" id="badge-count-'+b.id+'">0</div></div>';
  });
  document.getElementById('badge-list').innerHTML=badgeHtml;
  
  refreshGameUsers();
}

async function refreshGameUsers(){
  try{
    var d=await api('logs');
    var stats=d.stats||[];
    gameUsers=stats;
    
    // Update user dropdown
    var select=document.getElementById('game-user-select');
    var html='<option value="">-- เลือก User ('+stats.length+' คน) --</option>';
    stats.forEach(function(s){
      var name=s.admin_name||(s.admin_email||'').split('@')[0];
      html+='<option value="'+s.admin_email+'">'+name+' ('+fmt(s.total_actions)+' งาน)</option>';
    });
    select.innerHTML=html;
    
    // Count badges
    var badgeCounts={};
    GAME.badges.forEach(function(b){badgeCounts[b.id]=0;});
    stats.forEach(function(s){
      var userStats={total:s.total_actions||0,youtube:s.youtube_count||0,tiktok:s.tiktok_count||0,facebook:s.facebook_count||0,instagram:s.instagram_count||0,night_count:s.night_count||0,early_count:s.early_count||0,weekend_count:s.weekend_count||0,max_streak:s.max_streak||0,max_daily:s.max_daily||0,max_hourly:s.max_hourly||0,days_active:s.days_active||0,best_rank:s.best_rank||999};
      GAME.badges.forEach(function(b){
        if(b.check(userStats))badgeCounts[b.id]++;
      });
    });
    GAME.badges.forEach(function(b){
      var el=document.getElementById('badge-count-'+b.id);
      if(el)el.textContent=badgeCounts[b.id]+' คน';
    });
    
    // Render leaderboard
    renderGameLeaderboard(stats);
    
  }catch(e){console.error('Game users error:',e);}
}

function loadUserGameStats(){
  var email=document.getElementById('game-user-select').value;
  var statsEl=document.getElementById('game-user-stats');
  var badgesEl=document.getElementById('game-user-badges');
  
  if(!email){
    statsEl.innerHTML='<div style="color:var(--dim);padding:20px;text-align:center">เลือก User เพื่อดูสถิติ</div>';
    badgesEl.innerHTML='';
    return;
  }
  
  var userData=gameUsers.find(function(u){return u.admin_email===email;});
  if(!userData){
    statsEl.innerHTML='<div style="color:var(--danger)">ไม่พบข้อมูล</div>';
    return;
  }
  
  var userStats={total:userData.total_actions||0,youtube:userData.youtube_count||0,tiktok:userData.tiktok_count||0,facebook:userData.facebook_count||0,instagram:userData.instagram_count||0,night_count:userData.night_count||0,early_count:userData.early_count||0,weekend_count:userData.weekend_count||0,max_streak:userData.max_streak||0,max_daily:userData.max_daily||0,max_hourly:userData.max_hourly||0,days_active:userData.days_active||0,best_rank:userData.best_rank||999};
  var lv=GAME.getLevel(userStats.total);
  var progress=GAME.getXpProgress(userStats.total);
  var earnedBadges=GAME.getBadges(userStats);
  
  // Stats - 2 rows
  var html='<div class="game-stat-card"><div class="game-stat-val">Lv.'+lv.lv+'</div><div class="game-stat-lbl">'+lv.name+'</div></div>';
  html+='<div class="game-stat-card"><div class="game-stat-val">'+fmt(userStats.total)+'</div><div class="game-stat-lbl">รวมทั้งหมด</div></div>';
  html+='<div class="game-stat-card"><div class="game-stat-val">'+fmt(userStats.days_active)+'</div><div class="game-stat-lbl">📅 วันทำงาน</div></div>';
  html+='<div class="game-stat-card"><div class="game-stat-val">'+fmt(userStats.max_daily)+'</div><div class="game-stat-lbl">⚡ สูงสุด/วัน</div></div>';
  html+='<div class="game-stat-card"><div class="game-stat-val">'+fmt(userStats.max_hourly)+'</div><div class="game-stat-lbl">🚀 สูงสุด/ชม.</div></div>';
  statsEl.innerHTML=html;
  
  // Badges by category
  var cats=GAME.getBadgesByCategory();
  var catNames={milestone:'🏆 Milestone',platform:'📱 Platform',special:'⭐ Special',time:'⏰ Time',streak:'🔥 Streak',speed:'⚡ Speed'};
  var catOrder=['milestone','platform','special','time','streak','speed'];
  var badgeHtml='<div style="margin-bottom:16px;color:var(--text);font-size:15px;font-weight:600">🏅 Badges ('+earnedBadges.length+'/'+GAME.badges.length+')</div>';
  catOrder.forEach(function(cat){
    if(!cats[cat]||!cats[cat].length)return;
    badgeHtml+='<div class="badge-category"><div class="badge-category-title">'+catNames[cat]+'</div><div class="badge-category-grid">';
    cats[cat].forEach(function(b){
      var earned=earnedBadges.find(function(e){return e.id===b.id;});
      badgeHtml+='<div class="game-badge-toggle'+(earned?' earned':' locked')+'" title="'+b.desc+'"><span class="badge-icon">'+b.icon+'</span>'+b.name+'</div>';
    });
    badgeHtml+='</div></div>';
  });
  badgesEl.innerHTML=badgeHtml;
}

function renderGameLeaderboard(stats){
  var el=document.getElementById('game-leaderboard');
  if(!stats.length){el.innerHTML='<div class="empty">ยังไม่มีข้อมูล</div>';return;}
  
  var html='';
  stats.sort(function(a,b){return(b.total_actions||0)-(a.total_actions||0);});
  stats.slice(0,10).forEach(function(s,i){
    var name=s.admin_name||(s.admin_email||'').split('@')[0];
    var initial=name.charAt(0).toUpperCase();
    var userStats={total:s.total_actions||0,youtube:s.youtube_count||0,tiktok:s.tiktok_count||0,facebook:s.facebook_count||0,instagram:s.instagram_count||0,night_count:s.night_count||0,early_count:s.early_count||0,weekend_count:s.weekend_count||0,max_streak:s.max_streak||0,max_daily:s.max_daily||0,max_hourly:s.max_hourly||0,days_active:s.days_active||0,best_rank:s.best_rank||999};
    var lv=GAME.getLevel(userStats.total);
    var badges=GAME.getBadges(userStats);
    var medals=['🥇','🥈','🥉'];
    var medal=i<3?medals[i]:(i+1);
    var badgeIcons=badges.slice(0,5).map(function(b){return'<span title="'+b.name+'">'+b.icon+'</span>';}).join('');
    
    html+='<div class="game-lb-row"><div class="game-lb-rank">'+medal+'</div><div class="game-lb-avatar" style="background:'+lv.color+'">'+initial+'</div><div class="game-lb-info"><div class="game-lb-name">'+name+'<span class="lb-level" style="background:'+lv.color+'">Lv.'+lv.lv+'</span></div><div class="game-lb-badges">'+badgeIcons+'</div></div><div class="game-lb-score">'+fmt(s.total_actions||0)+'</div></div>';
  });
  el.innerHTML=html;
}

// Check admin on page load
document.addEventListener('DOMContentLoaded',function(){
  setTimeout(checkGameAdmin,1000);
});
</script>`;
