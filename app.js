/* ===================== 常如意工作台 · 应用逻辑 ===================== */
'use strict';

const KEY = 'changruyi_workbench_v1';

/* ===================== Supabase 云端同步配置 =====================
 * 把下面三项填好即可开启多设备同步（建表 SQL 见 supabase-schema.sql）。
 * 留空则仅本地保存，顶部状态显示「未连接」。
 * userId 在多台设备填成同一个值，它们就会共享同一份数据。 */
const SUPABASE_CFG = {
  url: 'https://yxorymlfojxqtqpmsuzo.supabase.co',
  anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4b3J5bWxmb2p4cXRxcG1zdXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNDM4MjQsImV4cCI6MjEwMTkxOTgyNH0.31R9bHOsZuCpcn_hovOuL-iqyFyRTDfXSMatpfB7R1s',
  userId: 'changruyi' // 多设备保持一致
};
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const pad = n => String(n).padStart(2, '0');
function todayStr(d = new Date()) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(s, n) { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return todayStr(d); }
function fmtDateCN(s) {
  const d = new Date(s + 'T00:00:00');
  const wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 周${wk}`;
}
function dayOfYear() {
  const n = new Date(); const s = new Date(n.getFullYear(), 0, 0);
  return Math.floor((n - s) / 86400000);
}
const money = n => (n < 0 ? '-' : '') + '¥' + Math.abs(n).toLocaleString('zh-CN');

/* ---------- 默认数据（首次打开的轻量种子） ---------- */
function defaultState() {
  return {
    _modifiedAt: 0,
    home: {
      countdowns: [{ id: uid(), label: '芽芽生日', lunar: { y: 2024, m: 7, d: 7, leap: false }, date: '' }],
      rest: []
    },
    todos: [],
    diet: { goal: 1800, profile: { weight: 0, height: 0 }, days: {} },
    ledger: [],
    xhs: {
      base: { followers: 0, notes: 0, zanCang: 0 },
      records: [],
      limit: { count: 0, names: '' },
      noteExpenses: [],
      rebates: []
    },
    baby: { poops: [] },
    publish: { notes: [] }
  };
}
function nextBirthday() {
  const y = new Date().getFullYear();
  const d = `${y}-08-10`;
  return (new Date(d + 'T00:00:00') < new Date()) ? `${y + 1}-08-10` : d;
}

/* ===================== 农历转换（1900–2100） ===================== */
const LUNAR_INFO = [0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f250];
const LUNAR_MONTHS = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const LUNAR_DAYS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
const ZODIAC = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
function lYearDays(y) { let sum = 348; for (let i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0; return sum + leapDays(y); }
function leapDays(y) { return leapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0; }
function leapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }
function monthDays(y, m) { return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }
function solarToLunar(y, m, d) {
  const base = new Date(1900, 0, 31).getTime();
  let offset = Math.round((new Date(y, m - 1, d).getTime() - base) / 86400000);
  let i, temp = 0;
  for (i = 1900; i < 2101 && offset > 0; i++) { temp = lYearDays(i); offset -= temp; }
  if (offset < 0) { offset += temp; i--; }
  const year = i; const leap = leapMonth(year); let isLeap = false; let month = 1;
  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === leap + 1 && !isLeap) { i--; isLeap = true; temp = leapDays(year); }
    else temp = monthDays(year, i);
    if (isLeap && i === leap + 1) isLeap = false;
    offset -= temp;
    if (!isLeap) month++;
  }
  if (offset === 0 && leap > 0 && i === leap + 1) { if (isLeap) isLeap = false; else { isLeap = true; month--; } }
  if (offset < 0) { offset += temp; month--; }
  return { year, month, day: offset + 1, isLeap };
}
function lunarStr(y, m, d) {
  const L = solarToLunar(y, m, d);
  return `农历${L.isLeap ? '闰' : ''}${LUNAR_MONTHS[L.month - 1]}月${LUNAR_DAYS[L.day - 1]}`;
}
function zodiacOf(y) { return ZODIAC[(y - 4) % 12]; }
/* 农历 → 公历：返回 Date（1900–2100）。leap=true 表示该农历月为闰月 */
function lunarToSolar(y, m, d, leap) {
  let date = new Date(1900, 0, 31); // 1900-01-31 为农历1900年正月初一
  for (let yy = 1900; yy < y; yy++) date.setDate(date.getDate() + lYearDays(yy));
  // date 现为农历 y 年正月初一
  for (let mm = 1; mm < m; mm++) {
    date.setDate(date.getDate() + monthDays(y, mm));
    if (leapMonth(y) === mm) date.setDate(date.getDate() + leapDays(y));
  }
  if (leap && leapMonth(y) === m) date.setDate(date.getDate() + monthDays(y, m));
  date.setDate(date.getDate() + (d - 1));
  return date;
}

let S = load();
function load() {
  try { const r = localStorage.getItem(KEY); if (r) return Object.assign(defaultState(), JSON.parse(r)); }
  catch (e) { console.warn('load failed', e); }
  return defaultState();
}
function save() { S._modifiedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('保存失败：本地存储已满（图片过多）', 'warn'); } pushSync(); }

/* ---------- 通用：toast ---------- */
function toast(msg, kind = 'ok') {
  const root = $('#toastRoot');
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="t-ico">${kind === 'warn' ? '⚠️' : '🌿'}</span>${esc(msg)}`;
  root.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 2200);
}

/* ---------- 通用：modal ---------- */
function openModal(html, cls) {
  const root = $('#modalRoot');
  root.innerHTML = `<div class="modal-mask" data-action="close-modal"></div><div class="modal ${cls || ''}"><button class="modal-x" data-action="close-modal" aria-label="关闭">✕</button>${html}</div>`;
  root.classList.add('show');
  return $('.modal', root);
}
function closeModal() { $('#modalRoot').classList.remove('show'); $('#modalRoot').innerHTML = ''; }

/* ---------- APP 图标切换（预设 + 自定义上传） ---------- */
const ICON_PRESETS = [
  { key: '1', name: '芽芽粉' },
  { key: '2', name: '常如意' },
  { key: '3', name: '如如意' }
];

/* 说明：iPhone 在「添加到主屏幕」时只认服务器 index.html 里写死的 apple-touch-icon 真实文件，
   不会读取本机 JS / Service Worker 提供的图标。因此"让主屏换图标"必须由助理在服务器端
   提交图标文件并改写 index.html（不经过浏览器、不暴露任何令牌）。本机这里只负责记录选择，
   并提示用户在聊天里把选择/图片发给我，由我完成服务器侧的提交。 */

function getIconCfg() {
  try { return JSON.parse(localStorage.getItem('app_icon') || '{"type":"default"}'); }
  catch (e) { return { type: 'default' }; }
}
function applyAppIcon() {
  const cfg = getIconCfg();
  let touch, m192, m512;
  if (cfg.type === 'preset' && cfg.key) {
    touch = `preset-${cfg.key}-apple.png`;
    m192 = `preset-${cfg.key}-192.png`;
    m512 = `preset-${cfg.key}-512.png`;
  } else if (cfg.type === 'custom') {
    touch = 'app-custom-icon.png';
    m192 = 'app-custom-icon.png';
    m512 = 'app-custom-icon.png';
  } else {
    touch = 'apple-touch-icon.png';
    m192 = 'icon-192.png';
    m512 = 'icon-512.png';
  }
  let link = document.querySelector('link[rel="apple-touch-icon"]');
  if (!link) { link = document.createElement('link'); link.rel = 'apple-touch-icon'; document.head.appendChild(link); }
  link.href = touch;
  /* 安卓用 manifest 图标：动态生成（仅替换图标，其余沿用默认） */
  const manifest = {
    name: '常如意的工作台', short_name: '常如意', description: '常如意个人工作台',
    start_url: './', scope: './', display: 'standalone',
    background_color: '#faf6f1', theme_color: '#e0a98a',
    icons: [
      { src: m192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: m512, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  };
  try {
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    const url = URL.createObjectURL(blob);
    const mlink = document.querySelector('link[rel="manifest"]');
    if (mlink) mlink.href = url;
  } catch (e) {}
}
function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('changruyi', 1);
    r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbSet(k, v) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(v, k);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
}
function openIconModal() {
  const cfg = getIconCfg();
  const grid = ICON_PRESETS.map(p => `
    <button class="icon-opt ${cfg.type === 'preset' && cfg.key === p.key ? 'on' : ''}" data-action="icon-preset" data-key="${p.key}">
      <img src="preset-${p.key}-apple.png" alt="${p.name}" />
      <span>${p.name}</span>
    </button>`).join('');
  const html = `
    <h3>🎨 更换 APP 图标</h3>
    <p class="modal-tip">iPhone 限制：已添加到主屏的图标不会自动变，且只认服务器上的真实图标文件。<br>所以步骤是：<b>① 在这里选好图标（本机先记住）→ ② 在聊天里把选择/图片发给我，我帮你提交到服务器（约 1 分钟发布）→ ③ 你删掉主屏旧图标，重新「添加到主屏幕」一次</b>就会显示新图标（这是苹果规矩，任何 APP 都一样）。</p>
    <div class="icon-grid">${grid}</div>
    <div class="icon-upload">
      <label class="btn btn-ghost" style="display:inline-block">上传我的图片
        <input type="file" id="iconFile" accept="image/*" hidden />
      </label>
      <span style="font-size:12px;color:var(--ink-faint);margin-left:8px">建议正方形图片</span>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="icon-reset">恢复默认</button>
      <button class="btn btn-primary" data-action="close-modal">完成</button>
    </div>`;
  openModal(html, 'icon');
  const file = $('#iconFile');
  if (file) file.addEventListener('change', e => {
    if (e.target.files && e.target.files[0]) handleIconUpload(e.target.files[0]);
  });
}
function handleIconUpload(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const size = 512;
      const c = document.createElement('canvas'); c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      const dataUrl = c.toDataURL('image/png');
      idbSet('appIconCustom', { dataUrl }).then(() => {
        localStorage.setItem('app_icon', JSON.stringify({ type: 'custom' }));
        applyAppIcon();
        openIconModal();
        toast('图片已在本机保存。要让 iPhone 主屏换成此图，请在聊天里把这张图发给我，我帮你提交到服务器', 'warn');
      });
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function selectPreset(key) {
  localStorage.setItem('app_icon', JSON.stringify({ type: 'preset', key }));
  applyAppIcon();
  openIconModal();
  toast('本机已记录。要让 iPhone 主屏也换这个图标，请在聊天里发我「换成' + ICON_PRESETS.find(p => p.key === key).name + '」，我帮你提交到服务器', 'warn');
}
function resetIcon() {
  localStorage.setItem('app_icon', JSON.stringify({ type: 'default' }));
  applyAppIcon();
  openIconModal();
  toast('本机已恢复默认。要让 iPhone 主屏也恢复，请在聊天里发我「恢复默认图标」', 'warn');
}

/* ---------- 图片压缩 ---------- */
function compressImage(file, cb) {
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 900; let { width: w, height: h } = img;
      if (w > max || h > max) { const r = max / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => cb(null);
    img.src = fr.result;
  };
  fr.onerror = () => cb(null);
  fr.readAsDataURL(file);
}

/* ===================== 路由 ===================== */
const TITLES = {
  home: ['首页', '今天也要闪闪发光呀'],
  todo: ['工作待办', '一件一件来，慢慢推进'],
  diet: ['饮食记录', '好好吃饭，才有力气带娃'],
  ledger: ['记账', '每一笔，都是生活的痕迹'],
  xhs: ['小红书', '发芽芽的日常 · 常如意i'],
  baby: ['芽芽', '发芽芽的日常 · 拉屎打卡 💩']
};
let currentView = 'home';

function showView(v) {
  currentView = v;
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  $('#viewTitle').textContent = TITLES[v][0];
  $('#viewSub').textContent = TITLES[v][1];
  $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  renderView(v);
  $('.views').scrollTop = 0;
}

function renderView(v) {
  if (v === 'home') renderHome();
  else if (v === 'todo') renderTodo();
  else if (v === 'diet') renderDiet();
  else if (v === 'ledger') renderLedger();
  else if (v === 'xhs') renderXhs();
  else if (v === 'baby') renderBaby();
}

/* ===================== 0. 首页 ===================== */
const QUOTES = [
  '慢慢来，比较快。', '你种下的每颗小芽，都会开花。', '今天的努力，是明天的礼物。',
  '带娃很累，但爱很甜。', '把日子过成喜欢的样子。', '认真生活的人，会被生活偏爱。',
  '一点点变好，就是最好。', '温柔而坚定，是妈妈的力量。', '今天也要给自己一个拥抱。',
  '发芽芽的日常，平凡也闪亮。', '先照顾好自己，才能照顾好芽芽。', '热爱可抵岁月漫长。'
];

/* 解析纪念日对应的公历日期（农历按当年/次年换算，每年自动跟着走） */
function cdSolarDate(c) {
  if (!c.lunar) return c.date;
  const t = c.lunar, y = new Date().getFullYear();
  let g = lunarToSolar(y, t.m, t.d, t.leap);
  const today = new Date(todayStr() + 'T00:00:00');
  if (new Date(g.getFullYear(), g.getMonth(), g.getDate()) < today) {
    g = lunarToSolar(y + 1, t.m, t.d, t.leap);
  }
  return `${g.getFullYear()}-${pad(g.getMonth() + 1)}-${pad(g.getDate())}`;
}

/* ===================== 首页日历（联动全站带日期事项） ===================== */
let homeCal = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: todayStr() };
const REST_SET = () => (S.home.rest || []);

/* 芽芽拉屎记录：独立月历状态 */
let babyCal = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: todayStr() };

const HOME_DOT = {
  todo:   { color: 'var(--sage-deep)', label: '待办' },
  diet:   { color: '#7FA97C',          label: '饮食' },
  ledger: { color: 'var(--blue-deep)', label: '记账' },
  exp:    { color: 'var(--rose-deep)', label: '小红书支出' },
  rebate: { color: 'var(--lilac)',     label: '待返款' }
};

/* 聚合某一天在全站各模块中的带日期事项 */
function homeDayItems(ds) {
  const items = [];
  (S.todos || []).filter(t => (t.date || '') === ds).forEach(t => items.push({ type: 'todo', title: t.text, sub: t.done ? '已完成' : '待完成' }));
  const day = (S.diet.days || {})[ds];
  if (day && day.length) {
    const k = day.reduce((s, f) => s + (f.kcal || 0), 0);
    items.push({ type: 'diet', title: `${day.length} 条饮食记录`, sub: `${k} kcal` });
  }
  const led = (S.ledger || []).filter(r => r.date === ds);
  if (led.length) {
    const inc = led.filter(r => r.type === 'in').reduce((s, r) => s + r.amount, 0);
    const out = led.filter(r => r.type === 'out').reduce((s, r) => s + r.amount, 0);
    items.push({ type: 'ledger', title: `收 ${money(inc)} / 支 ${money(out)}`, sub: `${led.length} 笔` });
  }
  xhsFlatExpenses().filter(e => (e.date || '') === ds).forEach(e => items.push({ type: 'exp', title: (e.noteName || (e.etype === 'cart' ? '作业车' : '笔记支出')), sub: '-' + money(e.amount || 0) }));
  (S.xhs.rebates || []).filter(r => (r.prom || '') === ds).forEach(r => items.push({ type: 'rebate', title: (r.item || '待返款'), sub: (r.dir === 'out' ? '我返PR ' : 'PR返我 ') + money(r.amount || 0) }));
  return items;
}

function renderHome() {
  const h = S.home;
  const now = new Date();
  const quote = QUOTES[dayOfYear() % QUOTES.length];
  const cdHTML = h.countdowns.length ? h.countdowns.map(c => {
    const gdate = cdSolarDate(c);
    const days = Math.ceil((new Date(gdate + 'T00:00:00') - new Date(todayStr() + 'T00:00:00')) / 86400000);
    const past = days < 0;
    const d = new Date(gdate + 'T00:00:00');
    const ld = c.lunar ? `农历${c.lunar.leap ? '闰' : ''}${LUNAR_MONTHS[c.lunar.m - 1]}月${LUNAR_DAYS[c.lunar.d - 1]}` : lunarStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `<div class="cd-item ${past ? 'cd-past' : ''}">
      <div class="cd-days">${past ? '已过' : days}<small>${past ? '' : ' 天'}</small></div>
      <div class="cd-meta"><div class="cd-label">${esc(c.label)}</div><div class="cd-date">${fmtDateCN(gdate)} · ${ld}</div></div>
      <button class="icon-btn danger" data-action="del-cd" data-id="${c.id}" title="删除">${icTrash()}</button>
    </div>`;
  }).join('') : '<div class="empty">还没有纪念日，点下方 + 添加一个吧</div>';

  $('#view-home').innerHTML = `
    <div class="grid cols-3" style="align-items:start">
      <div class="hero" style="grid-column:span 2">
        <span class="hero-sprout">${sproutSVG(56)}</span>
        <div class="clock" id="clock">--:--<span class="sec" id="clockSec">:--</span></div>
        <div class="hero-date" id="heroDate">${fmtDateCN(todayStr())} · ${now.getFullYear()}年</div>
        <div class="hero-quote" id="heroQuote">${esc(quote)}</div>
      </div>
      <div class="card countdown-card">
        <div class="card-title"><span class="dot" style="background:var(--rose)"></span>纪念日倒计时</div>
        <div class="cd-list">${cdHTML}</div>
        <button class="btn btn-rose btn-sm" style="margin-top:14px;width:100%" data-action="add-cd">+ 添加纪念日</button>
      </div>
    </div>

      <div class="card weather-card" id="weatherCard" style="margin-top:20px">
        <div class="card-title"><span class="dot" style="background:var(--blue)"></span>杭州天气
          <span class="weather-loc">📍杭州</span>
        </div>
        <div class="weather-body" id="weatherBody"><div class="weather-loading">天气加载中…</div></div>
      </div>

      <div class="card" style="margin-top:20px">
        <div class="card-title"><span class="dot" style="background:var(--rose-deep)"></span>🍠 红薯日历 · 出稿笔记
          <span class="cal-hint" style="margin-left:auto">点日期记录当天出稿笔记</span>
        </div>
        ${renderHongshuCalendar()}
        <div class="hs-legend">
          <span class="hs-legend-item"><i class="hs-lg st-draft"></i>待出稿</span>
          <span class="hs-legend-item"><i class="hs-lg st-published"></i>已出稿</span>
          <span class="hs-legend-item"><i class="hs-lg st-review"></i>待审核</span>
        </div>
      </div>

      <div class="card" style="margin-top:20px">
        <div class="card-title"><span class="dot" style="background:var(--rose-deep)"></span>🎨 个性化
          <button class="btn btn-sm btn-primary" style="margin-left:auto" data-action="open-icon-modal">更换图标</button>
        </div>
        <div style="font-size:12.5px;color:var(--ink-soft)">换 APP 图标：内置几套预设，也能上传自己的图片。iPhone 换完需删掉主屏旧图标、重新添加到主屏幕一次才生效。</div>
      </div>

    `;
  tickClock();
  fetchWeather();
}

/* 首页：小红书运营概览模块（首页下方第二个模块） */
/* ===================== 芽芽拉屎记录模块（独立页面，侧边栏第3） ===================== */
const BABY_TYPES = ['正常（金黄软糊）', '偏稀（水样）', '偏干（颗粒便）', '便秘', '腹泻', '绿便', '奶瓣', '其他'];

function babyDayPoops(ds) {
  return (S.baby.poops || []).filter(p => p.date === ds).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

function renderBabyCalendar() {
  const { y, m } = babyCal;
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7; /* 周一为每周第一天 */
  const daysIn = new Date(y, m + 1, 0).getDate();
  let cal = '';
  for (let i = 0; i < startDow; i++) cal += '<div class="cal-day out"></div>';
  for (let d = 1; d <= daysIn; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`;
    const cnt = (S.baby.poops || []).filter(p => p.date === ds).length;
    const mark = cnt ? `<span class="poop-badge">💩${cnt > 1 ? cnt : ''}</span>` : '';
    cal += `<div class="cal-day ${cnt ? 'poop' : ''} ${ds === todayStr() ? 'today' : ''}" data-action="baby-pick" data-date="${ds}">
      <div class="d">${d}</div>${mark}</div>`;
  }
  const dows = ['一', '二', '三', '四', '五', '六', '日'].map(w => `<div class="cal-dow">${w}</div>`).join('');
  return `<div class="cal-head">${y}年 ${m + 1}月</div><div class="cal">${dows}${cal}</div>`;
}

function openBabyDayModal(ds) {
  const recs = babyDayPoops(ds);
  const dt = new Date(ds + 'T00:00:00');
  const ld = lunarStr(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  const now = new Date();
  const curTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const typeOpts = BABY_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
  const list = recs.length ? `<div class="bp-list">` + recs.map(r => `
    <div class="bp-item">
      <span class="bp-time">${esc(r.time || '')}</span>
      <span class="bp-type">${esc(r.type || '')}</span>
      <span class="bp-note">${esc(r.note || '')}</span>
      <button class="icon-btn danger" data-action="baby-del" data-id="${r.id}" title="删除这条">${icTrash()}</button>
    </div>`).join('') + `</div>` : '<div class="empty">这一天还没有拉屎记录，记一笔吧 💩</div>';
  const html = `
    <h3>👶 ${fmtDateCN(ds)} · ${ld} · 拉屎 ${recs.length} 次</h3>
    <div class="bp-add">
      <input class="input" type="time" id="bpTime" value="${curTime}" style="width:108px" />
      <select class="input" id="bpType" style="flex:1;min-width:120px">${typeOpts}</select>
      <input class="input" id="bpNote" placeholder="备注（可选）" style="flex:1;min-width:80px" />
    </div>
    <button class="btn btn-primary" style="width:100%;margin:4px 0 14px" data-action="baby-save" data-date="${ds}">记一笔</button>
    ${list}`;
  openModal(html, 'baby');
}

function renderBaby() {
  const all = S.baby.poops || [];
  const monthKey = `${babyCal.y}-${pad(babyCal.m + 1)}`;
  const curM = all.filter(p => (p.date || '').slice(0, 7) === monthKey).length;
  const last = all.length ? all.slice().sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))[0] : null;
  const summary = `<div class="rb-summary" style="margin:6px 0 2px">
    <span class="rb-sum">本月拉屎 <b>${curM}</b> 次</span>
    <span class="rb-sum">累计 <b>${all.length}</b> 次</span>
    <span class="rb-sum">${last ? ('最近 ' + fmtDateCN(last.date) + ' ' + esc(last.time || '')) : '还没有记录'}</span>
  </div>`;

  /* 数据历史：按天倒序，直观看哪天拉屎 */
  const byDay = {};
  all.forEach(p => { (byDay[p.date] = byDay[p.date] || []).push(p); });
  const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a));
  const hist = days.length ? days.map(ds => {
    const recs = byDay[ds].slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const d = new Date(ds + 'T00:00:00');
    const wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return `<div class="hist-day">
      <div class="hist-date">${ds.slice(5)} <span class="hist-wk">周${wk}</span> <span class="hist-cnt">${recs.length} 次</span></div>
      <div class="hist-items">${recs.map(r => `<span class="hist-tag">${esc(r.time || '')} · ${esc(r.type || '')}</span>`).join('')}</div>
    </div>`;
  }).join('') : '<div class="empty">还没有拉屎记录，点日历上的日期记一笔吧 💩</div>';

  $('#view-baby').innerHTML = `
    <div class="card">
      <div class="card-title"><span class="dot" style="background:var(--rose)"></span>👶 芽芽拉屎记录
        <span style="margin-left:auto;display:flex;align-items:center;gap:10px">
          <span class="cal-hint">点日期记录当天拉屎</span>
          <button class="icon-btn btn-sm" data-action="baby-cal-prev">${icPrev()}</button>
          <button class="icon-btn btn-sm" data-action="baby-cal-next">${icNext()}</button>
        </span>
      </div>
      ${summary}
      ${renderBabyCalendar()}
      <div class="hist-block">
        <div class="hist-head">📅 拉屎记录历史</div>
        <div class="hist-scroll">${hist}</div>
      </div>
    </div>`;
}

function renderHomeCalendar() {
  const { y, m } = homeCal;
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7; /* 周一为每周第一天 */
  const daysIn = new Date(y, m + 1, 0).getDate();
  const rest = REST_SET();
  let cal = '';
  for (let i = 0; i < startDow; i++) cal += '<div class="cal-day out"></div>';
  for (let d = 1; d <= daysIn; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`;
    const items = homeDayItems(ds);
    const types = [...new Set(items.map(it => it.type))];
    const dots = types.length ? `<div class="cal-dots">${types.map(t => `<i style="background:${HOME_DOT[t].color}"></i>`).join('')}</div>` : '';
    const isRest = rest.includes(ds);
    cal += `<div class="cal-day ${ds === homeCal.sel ? 'sel' : ''} ${items.length ? 'has' : ''} ${isRest ? 'rest' : ''} ${ds === todayStr() ? 'today' : ''}" data-action="home-pick" data-date="${ds}">
      <div class="d">${d}</div>${isRest ? '<span class="rest-badge">休</span>' : ''}${dots}</div>`;
  }
  const dows = ['一', '二', '三', '四', '五', '六', '日'].map(w => `<div class="cal-dow">${w}</div>`).join('');
  return `<div class="cal-head">${y}年 ${m + 1}月</div><div class="cal">${dows}${cal}</div>${homeDayDetail(homeCal.sel)}`;
}

function homeDayDetail(ds) {
  const items = homeDayItems(ds);
  const dt = new Date(ds + 'T00:00:00');
  const ld = lunarStr(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  const list = items.length ? items.map(it => `
    <div class="home-item">
      <span class="hi-dot" style="background:${HOME_DOT[it.type].color}"></span>
      <span class="hi-type">${HOME_DOT[it.type].label}</span>
      <span class="hi-title">${esc(it.title)}</span>
      <span class="hi-sub">${esc(it.sub || '')}</span>
    </div>`).join('') : '<div class="empty">这一天还没有记录事项</div>';
  const isRest = REST_SET().includes(ds);
  const restBtn = `<button class="btn btn-sm ${isRest ? 'btn-ghost' : 'btn-rose'}" style="margin:8px 0 2px" data-action="toggle-rest" data-date="${ds}">${isRest ? '✓ 已标为休息日（点此取消）' : '🌿 标为休息日'}</button>`;
  return `<div class="home-detail">
    <div class="hd-title">${fmtDateCN(ds)} · ${ld}</div>
    ${isRest ? '<div class="rest-flag">休息日</div>' : ''}
    ${restBtn}
    ${list}
  </div>`;
}

/* ===================== 红薯日历（出稿笔记 · 万年历含农历） ===================== */
const PUB_TYPES = ['水下置换', '水下直发', '拍单置换', '蒲公英商单'];
const PUB_STATUSES = [
  { key: 'draft',     label: '待出稿', cls: 'st-draft' },
  { key: 'published', label: '已出稿', cls: 'st-published' },
  { key: 'review',    label: '待审核', cls: 'st-review' }
];
const PUB_STATUS_MAP = Object.fromEntries(PUB_STATUSES.map(s => [s.label, s]));
/* 状态优先级：未完成的排在前面，决定当天单元格的底色 */
const PUB_STATUS_ORDER = { '待出稿': 0, '待审核': 1, '已出稿': 2 };
let hongshuCal = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: todayStr() };

function hsDayNotes(ds) { return (S.publish.notes || []).filter(n => n.date === ds); }
function lunarDayShort(y, m, d) {
  const L = solarToLunar(y, m, d);
  return (L.isLeap ? '闰' : '') + LUNAR_DAYS[L.day - 1];
}
/* 取当天笔记中"最未完成"的状态，作为单元格底色 */
function primaryStatusCls(notes) {
  if (!notes.length) return '';
  const sorted = notes.slice().sort((a, b) => (PUB_STATUS_ORDER[a.status] ?? 9) - (PUB_STATUS_ORDER[b.status] ?? 9));
  const st = PUB_STATUS_MAP[sorted[0].status];
  return st ? st.cls : '';
}

function renderHongshuCalendar() {
  const { y, m } = hongshuCal;
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7; /* 周一为每周第一天 */
  const daysIn = new Date(y, m + 1, 0).getDate();
  let cal = '';
  for (let i = 0; i < startDow; i++) cal += '<div class="cal-day out"></div>';
  for (let d = 1; d <= daysIn; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`;
    const notes = hsDayNotes(ds);
    const isToday = ds === todayStr();
    const stCls = notes.length ? primaryStatusCls(notes) : '';
    const ld = lunarDayShort(y, m + 1, d);
    const top = notes.length ? notes.slice().sort((a, b) => (PUB_STATUS_ORDER[a.status] ?? 9) - (PUB_STATUS_ORDER[b.status] ?? 9))[0] : null;
    const badge = top ? `<span class="hs-badge">${esc(top.status)}</span>` : '';
    const cover = top && top.item ? `<div class="hs-cover">${esc(top.item)}</div>` : '';
    cal += `<div class="cal-day hs-day ${stCls} ${isToday ? 'today' : ''} ${ds === hongshuCal.sel ? 'sel' : ''}" data-action="hs-pick" data-date="${ds}">
      <div class="d">${d}</div>
      <div class="hs-lunar">${ld}</div>
      ${cover}
      ${badge}
    </div>`;
  }
  const dows = ['一', '二', '三', '四', '五', '六', '日'].map(w => `<div class="cal-dow">${w}</div>`).join('');
  return `<div class="cal-head">${y}年 ${m + 1}月 · 红薯日历</div>
    <div class="cal-nav">
      <button class="icon-btn btn-sm" data-action="hs-cal-prev-year" title="上一年">«</button>
      <button class="icon-btn btn-sm" data-action="hs-cal-prev" title="上个月">${icPrev()}</button>
      <button class="btn btn-sm btn-ghost" data-action="hs-cal-today">今天</button>
      <button class="icon-btn btn-sm" data-action="hs-cal-next" title="下个月">${icNext()}</button>
      <button class="icon-btn btn-sm" data-action="hs-cal-next-year" title="下一年">»</button>
    </div>
    <div class="cal">${dows}${cal}</div>`;
}

function openHongshuDayModal(ds) {
  const dt = new Date(ds + 'T00:00:00');
  const ld = lunarStr(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  const notes = hsDayNotes(ds).slice().sort((a, b) => (b.id || '').localeCompare(a.id || ''));
  const typeOpts = PUB_TYPES.map(t => `<option value="${t}"${t === '蒲公英商单' ? ' selected' : ''}>${t}</option>`).join('');
  const statusOpts = PUB_STATUSES.map(s => `<option value="${s.label}">${s.label}</option>`).join('');
  const list = notes.length ? `<div class="hs-list">` + notes.map(n => {
    let moneyBlock = '';
    if (n.type === '蒲公英商单') {
      const rp = (n.rebatePct != null && n.rebatePct !== '') ? `(${n.rebatePct}%)` : '';
      moneyBlock = `<div class="hs-money">
        <span>图文报价 ${money(n.quote || 0)}</span>
        <span>手续费 ${money(n.fee || 0)}</span>
        <span>返点${rp} ${money(n.rebate || 0)}</span>
        <span class="hs-net">到手 ${money(n.net || 0)}</span>
      </div>`;
    }
    const st = PUB_STATUS_MAP[n.status];
    return `<div class="hs-note">
      <div class="hs-note-top">
        <span class="hs-type-tag">${esc(n.type)}</span>
        <span class="hs-status ${st ? st.cls : ''}">${esc(n.status)}</span>
        <button class="icon-btn danger" data-action="hs-note-del" data-id="${n.id}" title="删除">${icTrash()}</button>
      </div>
      ${n.deadline ? `<div class="hs-note-meta">📅 发布最晚：${esc(n.deadline)}</div>` : ''}
      <div class="hs-note-content">${esc(n.content)}</div>
      ${moneyBlock}
    </div>`;
  }).join('') + `</div>` : '<div class="empty">这一天还没有出稿笔记，新增一笔吧 🍠</div>';

  const html = `
    <h3>🍠 红薯日历 · ${fmtDateCN(ds)} · ${ld}</h3>
    <div class="hs-add">
      <input class="input" id="hsItem" placeholder="物品名称（将作为封面显示在日历当天）" />
      <textarea class="input" id="hsContent" rows="2" placeholder="填写出稿笔记内容…"></textarea>
      <div class="hs-row">
        <select class="input" id="hsType">${typeOpts}</select>
        <select class="input" id="hsStatus">${statusOpts}</select>
      </div>
      <div class="hs-deadline-row">
        <label>发布日期（最晚）</label>
        <input class="input" id="hsDeadline" type="date" />
      </div>
      <div class="hs-amounts" id="hsAmounts" style="display:none">
        <div class="hs-amount-row"><label>图文报价(¥)</label><input class="input" id="hsQuote" type="number" min="0" step="0.01" placeholder="0" /></div>
        <div class="hs-amount-row"><label>返点比例(%)</label><input class="input" id="hsRebatePct" type="number" step="0.01" placeholder="如 10 表示10%" /></div>
        <div class="hs-calc">
          <span>手续费(10%)：<b id="hsFee">¥0</b></span>
          <span>返点金额：<b id="hsRebateAmt">-¥0</b></span>
          <span class="hs-net">到手金额：<b id="hsNet">¥0</b></span>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:10px" data-action="hs-add-note" data-date="${ds}">+ 保存出稿笔记</button>
    </div>
    <div class="hs-block-title">📝 当天出稿笔记（${notes.length}）</div>
    ${list}`;
  openModal(html, 'hongshu');
  const typeSel = $('#hsType');
  const amounts = $('#hsAmounts');
  const toggleAmounts = () => { amounts.style.display = (typeSel.value === '蒲公英商单') ? 'block' : 'none'; };
  typeSel.addEventListener('change', toggleAmounts);
  toggleAmounts();
  const recompute = () => {
    const q = Math.max(0, parseFloat($('#hsQuote').value || '0') || 0);
    const pct = parseFloat($('#hsRebatePct').value || '0') || 0;
    const fee = Math.round(q * 0.1 * 100) / 100;
    const rebate = -Math.round(q * pct / 100 * 100) / 100; /* 返点为支出，记为负数 */
    const net = Math.round((q - fee + rebate) * 100) / 100;
    const feeEl = $('#hsFee'), rebateEl = $('#hsRebateAmt'), netEl = $('#hsNet');
    if (feeEl) feeEl.textContent = money(fee);
    if (rebateEl) rebateEl.textContent = money(rebate);
    if (netEl) netEl.textContent = money(net);
  };
  $('#hsQuote').addEventListener('input', recompute);
  $('#hsRebatePct').addEventListener('input', recompute);
  recompute();
}

/* ===================== 首页天气（杭州，Open-Meteo 免费接口，无需密钥） ===================== */
const WCODE = {
  0: ['☀️', '晴'], 1: ['🌤️', '晴间多云'], 2: ['⛅', '多云'], 3: ['☁️', '阴'],
  45: ['🌫️', '雾'], 48: ['🌫️', '雾凇'], 51: ['🌦️', '毛毛雨'], 53: ['🌦️', '小雨'], 55: ['🌧️', '中雨'],
  56: ['🌧️', '冻雨'], 57: ['🌧️', '冻雨'], 61: ['🌧️', '小雨'], 63: ['🌧️', '中雨'], 65: ['🌧️', '大雨'],
  66: ['🌨️', '冻雨'], 67: ['🌨️', '冻雨'], 71: ['🌨️', '小雪'], 73: ['🌨️', '中雪'], 75: ['❄️', '大雪'],
  77: ['🌨️', '雪粒'], 80: ['🌦️', '阵雨'], 81: ['🌧️', '阵雨'], 82: ['⛈️', '强阵雨'],
  85: ['🌨️', '阵雪'], 86: ['❄️', '阵雪'], 95: ['⛈️', '雷阵雨'], 96: ['⛈️', '雷阵雨伴雹'], 99: ['⛈️', '强雷暴']
};
function wEmoji(code) { return WCODE[code] || ['🌡️', '未知']; }
const WEATHER_KEY = 'cr_weather_cache';
function fetchWeather() {
  const box = $('#weatherBody'); if (!box) return;
  // 先用缓存（离线也能看）
  try {
    const cached = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null');
    if (cached && cached.ts && Date.now() - cached.ts < 1800000) renderWeather(cached.data, box);
  } catch (e) {}
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=30.2741&longitude=120.1551&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=4';
  fetch(url).then(r => r.json()).then(d => {
    const data = {
      cur: { t: Math.round(d.current.temperature_2m), code: d.current.weather_code, hum: d.current.relative_humidity_2m, wind: Math.round(d.current.wind_speed_10m) },
      days: d.daily.time.map((dt, i) => ({ dt, code: d.daily.weather_code[i], hi: Math.round(d.daily.temperature_2m_max[i]), lo: Math.round(d.daily.temperature_2m_min[i]) }))
    };
    try { localStorage.setItem(WEATHER_KEY, JSON.stringify({ ts: Date.now(), data })); } catch (e) {}
    renderWeather(data, box);
  }).catch(() => {
    if (box && !box.querySelector('.w-cur')) box.innerHTML = '<div class="weather-loading">天气获取失败，请检查网络</div>';
  });
}
function renderWeather(data, box) {
  const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const cur = data.cur, c = wEmoji(cur.code);
  const today = data.days[0];
  const fc = data.days.slice(1).map(x => {
    const dt = new Date(x.dt + 'T00:00:00');
    const e = wEmoji(x.code);
    return `<div class="w-fc-item"><div class="w-fc-day">${wk[dt.getDay()]}</div><div class="w-fc-ico">${e[0]}</div><div class="w-fc-t">${x.lo}°/${x.hi}°</div></div>`;
  }).join('');
  box.innerHTML = `<div class="w-cur">
      <div class="w-cur-ico">${c[0]}</div>
      <div class="w-cur-main"><div class="w-cur-t">${cur.t}°</div><div class="w-cur-desc">${c[1]} · ${today.hi ? '最高' + today.hi + '° / 最低' + today.lo + '°' : ''}</div><div class="w-cur-sub">湿度 ${cur.hum}% · 风速 ${cur.wind}km/h</div></div>
    </div>
    <div class="w-fc">${fc}</div>`;
}

function tickClock() {
  const c = $('#clock'), cs = $('#clockSec'), hd = $('#heroDate');
  if (!c) return;
  const n = new Date();
  c.firstChild.textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
  if (cs) cs.textContent = `:${pad(n.getSeconds())}`;
  if (hd) hd.textContent = `${fmtDateCN(todayStr())} · ${n.getFullYear()}年`;
}
setInterval(tickClock, 1000);

/* ===================== 1. 工作待办 ===================== */
const CATS = ['工作', '生活', '带娃', '其他'];
const PRIO = { high: '高', mid: '中', low: '低' };
let todoFilter = '全部';

function renderTodo() {
  const seg = ['全部', ...CATS].map(c => `<button class="pill ${todoFilter === c ? 'on' : ''}" data-action="todo-filter" data-cat="${c}">${c}</button>`).join('');
  const list = S.todos
    .filter(t => todoFilter === '全部' || t.cat === todoFilter)
    .sort((a, b) => (a.done - b.done) || (a.order - b.order));
  const items = list.length ? list.map(t => `
    <div class="todo ${t.done ? 'done' : ''}" draggable="true" data-id="${t.id}">
      <div class="check ${t.done ? 'on' : ''}" data-action="todo-toggle" data-id="${t.id}">${t.done ? icCheck() : ''}</div>
      <span class="prio ${t.prio}"></span>
      <div class="todo-text" contenteditable="true" data-edit="todo-text" data-id="${t.id}">${esc(t.text)}</div>
      <span class="date-chip">${esc(t.date || todayStr())}</span>
      <span class="cat-chip">${esc(t.cat)}</span>
      <button class="icon-btn danger" data-action="todo-del" data-id="${t.id}" title="删除">${icTrash()}</button>
    </div>`).join('') : '<div class="empty">还没有待办，添加一个小目标吧 🌱</div>';

  const remain = S.todos.filter(t => !t.done).length;
  $('#view-todo').innerHTML = `
    <form class="card" data-form="todo-add" style="margin-bottom:18px">
      <div class="todo-head" style="margin:0 0 12px">
        <input class="input" name="text" placeholder="添加一项待办，回车确认…" style="flex:1;min-width:200px" />
        <input class="input" name="date" type="date" value="${todayStr()}" style="width:auto" title="日期" />
        <select class="select" name="cat" style="width:auto">${CATS.map(c => `<option>${c}</option>`).join('')}</select>
        <select class="select" name="prio" style="width:auto">
          <option value="high">优先级 高</option><option value="mid" selected>优先级 中</option><option value="low">优先级 低</option>
        </select>
        <button class="btn btn-primary" type="submit">+ 添加</button>
      </div>
      <div style="color:var(--ink-soft);font-size:13px">待完成 <b style="color:var(--sage-deep)">${remain}</b> 项 · 共 ${S.todos.length} 项 · 拖动卡片可排序</div>
    </form>
    <div class="filter-pills" style="margin-bottom:14px">${seg}</div>
    <div class="todo-list" id="todoList">${items}</div>`;
}

/* ===================== 2. 饮食记录 ===================== */
const MEALS = [
  { key: 'breakfast', name: '早餐', emoji: '🌅' },
  { key: 'lunch', name: '午餐', emoji: '🍱' },
  { key: 'dinner', name: '晚餐', emoji: '🌙' },
  { key: 'snack', name: '加餐', emoji: '🍓' }
];
const FOOD_DB = {
  '米饭': 116, '面条': 110, '馒头': 223, '面包': 265, '粥': 46, '燕麦': 367, '饺子': 198, '包子': 220, '披萨': 266, '油条': 388,
  '苹果': 52, '香蕉': 89, '草莓': 32, '橙子': 47, '蓝莓': 57, '牛油果': 160, '西瓜': 30,
  '鸡蛋': 144, '牛奶': 54, '酸奶': 72, '豆浆': 31, '奶酪': 328,
  '鸡胸肉': 133, '牛肉': 250, '猪肉': 395, '鱼': 120, '虾': 99, '三文鱼': 208, '豆腐': 81,
  '鸡腿': 185, '鸡腿饭': 260, '炸鸡': 280, '汉堡': 295, '牛肉面': 230, '凉皮': 150, '麻辣烫': 180, '寿司': 150, '蛋炒饭': 215, '炒饭': 220, '三明治': 250, '馄饨': 220, '米线': 200, '螺蛳粉': 240, '热干面': 230,
  '西兰花': 34, '番茄': 18, '黄瓜': 15, '土豆': 77, '红薯': 99, '菠菜': 23, '沙拉': 60, '玉米': 112,
  '咖啡': 2, '奶茶': 300, '果汁': 45, '可乐': 43, '坚果': 600,
  '饼干': 433, '蛋糕': 350, '巧克力': 589, '冰淇淋': 207
};
let dietDate = todayStr();
let dietModal = { meal: 'breakfast', photo: null, kcal: 0, content: '' };

function bmiLabel(b) { if (b < 18.5) return '偏瘦'; if (b < 24) return '正常'; if (b < 28) return '偏重'; return '肥胖'; }
/* 标准每日热量目标 = 基础代谢 BMR（Mifflin-St Jeor，女性，默认年龄 30） */
function calcBMR(p) {
  if (!(p.weight > 0) || !(p.height > 0)) return 0;
  const age = 30; /* 默认年龄；如需要可在档案里加年龄字段 */
  return Math.round(10 * p.weight + 6.25 * p.height - 5 * age + 5);
}
/* 体重/身高齐全时，自动把目标同步为 BMR 标准值（仍可手动改） */
function syncGoalFromProfile() {
  const p = S.diet.profile || { weight: 0, height: 0 };
  if (p.weight > 0 && p.height > 0) S.diet.goal = calcBMR(p);
}
/* AI 智能估算：基于本地食物库做子串/字符重叠匹配，避免错配（如鸡腿饭→豆腐） */
function aiEstimate(name) {
  name = (name || '').trim();
  if (!name) return null;
  const keys = Object.keys(FOOD_DB);
  let best = null, bestScore = 0;
  for (const k of keys) {
    let score = 0;
    if (name.includes(k)) score = k.length * 3;
    else if (k.includes(name)) score = name.length * 2;
    else {
      let overlap = 0; for (const ch of name) if (k.includes(ch)) overlap++;
      if (overlap >= 2) score = overlap;
    }
    if (score > bestScore) { bestScore = score; best = k; }
  }
  return best ? { name: best, kcal: FOOD_DB[best] } : null;
}
function renderDiet() {
  const day = S.diet.days[dietDate] || [];
  const total = day.reduce((s, f) => s + (f.kcal || 0), 0);
  const goal = S.diet.goal;
  const pct = Math.min(100, Math.round(total / goal * 100));

  const mealCards = MEALS.map(m => {
    const items = day.filter(f => f.meal === m.key);
    const sum = items.reduce((s, f) => s + (f.kcal || 0), 0);
    const list = items.length ? items.map(f => `
      <div class="food-item">
        ${f.photo ? `<img class="food-photo" src="${f.photo}" alt="">` : `<div class="food-photo" style="display:flex;align-items:center;justify-content:center;color:var(--ink-faint);font-size:18px">🍽️</div>`}
        <div class="food-main">
          <div class="food-row1">
            <div class="food-content" contenteditable="true" data-edit="food-content" data-id="${f.id}">${esc(f.content)}</div>
            <div class="food-kcal">${f.kcal || 0} kcal</div>
          </div>
          <div class="food-meta">${f.time || ''}${f.note ? ' · ' + esc(f.note) : ''}</div>
        </div>
        <button class="icon-btn danger" data-action="food-del" data-id="${f.id}" title="删除">${icTrash()}</button>
      </div>`).join('') : '<div style="color:var(--ink-faint);font-size:12.5px;padding:6px 2px">还没记录～</div>';
    return `<div class="card card-pad-sm meal-card">
      <div class="meal-head">
        <div class="meal-name"><span class="meal-emoji">${m.emoji}</span>${m.name}</div>
        <div class="meal-kcal">${sum} kcal</div>
      </div>
      ${list}
      <button class="btn btn-sm" style="width:100%;margin-top:6px" data-action="add-food" data-meal="${m.key}">+ 记录${m.name}</button>
    </div>`;
  }).join('');

  const prof = S.diet.profile || { weight: 0, height: 0 };
  const bmi = (prof.weight > 0 && prof.height > 0) ? (prof.weight / Math.pow(prof.height / 100, 2)) : 0;
  const bmiTxt = bmi ? `${bmi.toFixed(1)} · ${bmiLabel(bmi)}` : '—';

  $('#view-diet').innerHTML = `
    <div class="grid cols-2" style="margin-bottom:18px;align-items:stretch">
      <div class="card profile-card">
        <div class="card-title"><span class="dot" style="background:var(--sand)"></span>身体数据</div>
        <div class="profile-row">
          <label>体重 (kg)<input class="input" id="weightInput" type="number" min="0" step="0.1" value="${prof.weight || ''}" placeholder="如 58" /></label>
          <label>身高 (cm)<input class="input" id="heightInput" type="number" min="0" step="0.1" value="${prof.height || ''}" placeholder="如 165" /></label>
          <div class="bmi-box"><span class="bmi-lbl">BMI</span><span class="bmi-val">${bmiTxt}</span></div>
        </div>
      </div>
      <div class="card goal-card">
        <div class="card-title"><span class="dot" style="background:var(--rose)"></span>每日热量目标</div>
        <div class="goal-row">
          <span>目标</span>
          <input class="input goal-input" id="goalInput" type="number" min="0" step="50" value="${goal}" />
          <span>kcal</span>
        </div>
        <div class="day-kcal-total" style="margin-top:10px">今日合计 <b style="color:var(--sand-deep)">${total}</b> / ${goal} kcal</div>
        <div class="kcal-bar"><i style="width:${pct}%"></i></div>
        <div class="goal-note">
          标准目标 = 基础代谢 BMR <b>≈ ${calcBMR(prof)} kcal</b>（按女/30岁，由身高体重换算；可手动改）
          <button class="btn btn-sm btn-ghost" style="margin-top:6px" data-action="recalc-goal">↻ 按身高体重重算</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div class="todo-head" style="margin:0">
        <button class="icon-btn" data-action="diet-prev">${icPrev()}</button>
        <div style="font-weight:700;font-size:15px">${fmtDateCN(dietDate)}</div>
        <button class="icon-btn" data-action="diet-next">${icNext()}</button>
        ${dietDate !== todayStr() ? `<button class="btn btn-sm btn-ghost" data-action="diet-today">回到今天</button>` : ''}
      </div>
    </div>
    <div class="meal-grid">${mealCards}</div>`;
}

function openFoodModal(meal) {
  dietModal = { meal, photo: null, kcal: 0, content: '' };
  const m = MEALS.find(x => x.key === meal);
  openModal(`
    <h3>${m.emoji} 记录${m.name}</h3>
    <div class="field"><label>拍照 / 上传图片（可选）</label>
      <input type="file" id="foodImg" accept="image/*" />
      <img class="photo-prev" id="foodPrev" alt="">
    </div>
    <div class="field"><label>食物内容</label>
      <input class="input" id="foodContent" placeholder="如：一碗米饭 + 鸡蛋" />
    </div>
    <div class="field"><label>热量（kcal）<span style="color:var(--ink-faint);font-weight:400">· 可让 AI 智能估算</span></label>
      <input class="input" id="foodKcal" type="number" min="0" placeholder="0" />
    </div>
    <div class="recog-box" id="recogBox">
      <div id="recogState"></div>
    </div>
    <div class="field"><label>备注（时间/心得）</label>
      <input class="input" id="foodNote" placeholder="如：芽芽也吃了半碗" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="ai-kcal">✨ AI 智能估算</button>
      <button class="btn btn-primary" data-action="food-save">保存</button>
    </div>
    <p style="color:var(--ink-faint);font-size:11.5px;margin-top:10px">* AI 估算为演示功能，基于本地食物库智能匹配，真实热量请参考营养标签。</p>`);

  const img = $('#foodImg');
  img.addEventListener('change', () => {
    const f = img.files[0]; if (!f) return;
    compressImage(f, d => {
      if (!d) { toast('图片读取失败', 'warn'); return; }
      dietModal.photo = d; const p = $('#foodPrev'); p.src = d; p.style.display = 'block';
    });
  });
}

/* ===================== 3. 记账 ===================== */
const EXP_CATS = ['餐饮', '母婴', '交通', '居家', '娱乐', '医疗', '其他', '小红书'];
const INC_CATS = ['工资', '副业', '红包', '返款', '蒲公英', '其他'];
const CAT_COLOR = { '餐饮': '#E0A98A', '母婴': '#E8B98C', '交通': '#D8A06A', '居家': '#E9C7A1', '娱乐': '#D98E5E', '医疗': '#C9A98A', '其他': '#BCA99B', '小红书': '#E08A6A', '工资': '#CD8E6B', '副业': '#D3A878', '红包': '#E0A06A', '返款': '#D8A97E', '蒲公英': '#A8B58C' };
let ledgerMonth = { y: new Date().getFullYear(), m: new Date().getMonth() };
let ledgerSel = todayStr();

/* 小红书支出/作业车 → 记账支出记录（用于统计联动） */
function xhsExpenseToRec(e) {
  return {
    date: e.date, amount: e.amount, cat: '小红书', type: 'out', id: 'x' + e.id, fromXhs: true,
    note: (e.noteName || (e.etype === 'cart' ? '作业车' : '笔记支出')) + (e.note ? (' · ' + e.note) : '')
  };
}

/* 笔记支出：按「笔记名称」分组，每条笔记 = 封面图 + 多条支出明细。
   对外（记账/日历/统计）以扁平记录形式提供，保持旧联动不变。 */
function xhsFlatExpenses() {
  const out = [];
  (S.xhs.noteExpenses || []).forEach(n => {
    (n.items || []).forEach(it => {
      out.push({
        id: n.id + ':' + it.id,
        date: n.date || todayStr(),
        amount: it.amount || 0,
        note: it.desc || '',
        noteName: n.name || '未命名笔记',
        etype: (n.type === 'cart') ? 'cart' : 'note'
      });
    });
  });
  return out;
}
function xhsNoteItemsTotal(items) { return (items || []).reduce((s, it) => s + (parseFloat(it.amount) || 0), 0); }

/* 把选中的图片压缩成较小的 dataURL，避免 localStorage 爆掉 */
function readImageResized(file, maxDim, cb) {
  if (!file) { cb(''); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
      else if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      try { cb(c.toDataURL('image/jpeg', 0.72)); } catch (e) { cb(img.src); }
    };
    img.onerror = () => cb('');
    img.src = reader.result;
  };
  reader.onerror = () => cb('');
  reader.readAsDataURL(file);
}

/* 添加 / 编辑 一笔笔记支出（同一笔记下可挂多条花费 + 封面图） */
function openXhsNoteExpModal(editId) {
  const list = S.xhs.noteExpenses || [];
  const editing = editId ? list.find(n => n.id === editId) : null;
  const t = editing || { type: 'note', name: '', date: todayStr(), cover: '', items: [{ id: uid(), desc: '', amount: '' }] };
  const type = t.type || 'note';
  const rowsHtml = (t.items || []).map(it => `
    <div class="exp-item-row" data-iid="${it.id}">
      <select class="input exp-kind" data-action="xhs-item-kind">
        <option value="custom" ${!it.kind || it.kind === 'custom' ? 'selected' : ''}>自定义</option>
        <option value="real" ${it.kind === 'real' ? 'selected' : ''}>真人2000+20000</option>
        <option value="comment" ${it.kind === 'comment' ? 'selected' : ''}>围绕评论</option>
      </select>
      <input class="input exp-desc" placeholder="如：真人2000+20000 / 围绕评论【25个】" value="${esc(it.desc || '')}" />
      <input class="input exp-amt" type="number" min="0" step="0.01" placeholder="金额" value="${it.amount != null && it.amount !== '' ? it.amount : ''}" />
      <button class="icon-btn" data-action="xhs-item-del" data-iid="${it.id}" title="删除这项">${icTrash()}</button>
    </div>`).join('');
  openModal(`
    <h3>${editing ? '✏️ 编辑笔记支出' : '🧾 记一笔笔记支出'}</h3>
    <div class="field"><label>类型</label>
      <div class="seg" id="neType">
        <button class="${type === 'note' ? 'on' : ''}" data-type="note">笔记支出</button>
        <button class="${type === 'cart' ? 'on' : ''}" data-type="cart">作业车</button>
      </div>
    </div>
    <div class="field"><label id="neNameLabel">${type === 'cart' ? '作业车名称' : '笔记名称'}</label><input class="input" id="neName" placeholder="如：我有一个女鹅" value="${esc(t.name || '')}" /></div>
    <div class="field"><label>发布日期（可选）</label><input class="input" id="neDate" type="date" value="${t.date || todayStr()}" /></div>
    <div class="field"><label>封面图（可选）</label>
      <div class="cover-pick" id="neCoverWrap">
        ${t.cover ? `<img class="cover-prev" src="${t.cover}" alt="封面" />` : `<div class="cover-empty">未选封面</div>`}
        <div class="cover-btns">
          <button class="btn btn-sm btn-ghost" type="button" id="neCoverPick">📷 选择封面图</button>
          ${t.cover ? `<button class="btn btn-sm btn-ghost" type="button" id="neCoverClear">移除</button>` : ''}
        </div>
        <input type="file" id="neCoverFile" accept="image/*" style="display:none" />
      </div>
    </div>
    <div class="field"><label>支出明细（同一笔记下可添加多条）</label>
      <div id="neItems">${rowsHtml}</div>
      <button class="btn btn-sm btn-ghost" type="button" id="neItemAdd">+ 添加一项</button>
    </div>
    <div class="ne-total">合计：<b id="neTotalVal">${money(xhsNoteItemsTotal(t.items))}</b></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="close-modal">取消</button>
      <button class="btn btn-primary" data-action="xhs-note-save" data-id="${editId || ''}">保存</button>
    </div>`);
  let curType = type, curCover = t.cover || '';
  const recalc = () => {
    let s = 0; $$('#neItems .exp-amt').forEach(inp => { s += parseFloat(inp.value || '0') || 0; });
    const tv = $('#neTotalVal'); if (tv) tv.textContent = money(s);
  };
  const applyItemKind = (sel) => {
    const row = sel.closest('.exp-item-row'); if (!row) return;
    const desc = row.querySelector('.exp-desc'); if (!desc) return;
    if (sel.value === 'real') desc.value = '真人2000+20000';            // 真人推广：自动带出说明
    else if (sel.value === 'comment') desc.value = '围绕评论【】';       // 围绕评论：带出「围绕评论【】」，用户填【】内的值
    // 自定义：保留原说明文字，用户自由填写
  };
  $('#neType').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    curType = b.dataset.type;
    $$('#neType button').forEach(x => x.classList.toggle('on', x === b));
    const lbl = $('#neNameLabel'); if (lbl) lbl.textContent = curType === 'cart' ? '作业车名称' : '笔记名称';
  });
  $('#neItemAdd').addEventListener('click', () => {
    const wrap = $('#neItems'); const iid = uid();
    const row = document.createElement('div');
    row.className = 'exp-item-row'; row.dataset.iid = iid;
    row.innerHTML = `<select class="input exp-kind" data-action="xhs-item-kind">
        <option value="custom">自定义</option>
        <option value="real">真人2000+20000</option>
        <option value="comment">围绕评论</option>
      </select>
      <input class="input exp-desc" placeholder="如：真人2000+20000 / 围绕评论【25个】" />
      <input class="input exp-amt" type="number" min="0" step="0.01" placeholder="金额" />
      <button class="icon-btn" data-action="xhs-item-del" data-iid="${iid}" title="删除这项">${icTrash()}</button>`;
    wrap.appendChild(row);
    row.querySelector('.exp-amt').addEventListener('input', recalc);
    row.querySelector('.exp-kind').addEventListener('change', e => applyItemKind(e.target));
    recalc();
  });
  $$('#neItems .exp-amt').forEach(inp => inp.addEventListener('input', recalc));
  $$('#neItems .exp-kind').forEach(sel => sel.addEventListener('change', e => applyItemKind(e.target)));
  const fileInput = $('#neCoverFile');
  $('#neCoverPick').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    readImageResized(f, 720, dataUrl => {
      curCover = dataUrl;
      const wrap = $('#neCoverWrap');
      let prev = wrap.querySelector('.cover-prev');
      if (prev) prev.src = dataUrl;
      else {
        const empty = wrap.querySelector('.cover-empty'); if (empty) empty.remove();
        const img = document.createElement('img'); img.className = 'cover-prev'; img.src = dataUrl;
        wrap.insertBefore(img, wrap.querySelector('.cover-btns'));
      }
      if (!wrap.querySelector('#neCoverClear')) {
        const cl = document.createElement('button'); cl.className = 'btn btn-sm btn-ghost'; cl.id = 'neCoverClear'; cl.textContent = '移除';
        cl.addEventListener('click', () => { curCover = ''; const p = wrap.querySelector('.cover-prev'); if (p) p.remove(); const ce = document.createElement('div'); ce.className = 'cover-empty'; ce.textContent = '未选封面'; wrap.insertBefore(ce, wrap.querySelector('.cover-btns')); cl.remove(); });
        wrap.querySelector('.cover-btns').appendChild(cl);
      }
    });
  });
  const clearCover = () => {
    curCover = '';
    const p = $('#neCoverWrap').querySelector('.cover-prev'); if (p) p.remove();
    const ce = document.createElement('div'); ce.className = 'cover-empty'; ce.textContent = '未选封面';
    $('#neCoverWrap').insertBefore(ce, $('#neCoverWrap').querySelector('.cover-btns'));
    const cl = $('#neCoverClear'); if (cl) cl.remove();
  };
  if ($('#neCoverClear')) $('#neCoverClear').addEventListener('click', clearCover);
  window.__neType = () => curType;
  window.__neCover = () => curCover;
}

/* 封面图：未上传时按笔记名称首字生成文字封面（canvas，带缓存） */
const _coverCache = {};
function firstCharCover(name) {
  const ch = ((name || '?').trim().charAt(0) || '?');
  if (_coverCache[ch]) return _coverCache[ch];
  const c = document.createElement('canvas'); c.width = 240; c.height = 240;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 240, 240);
  g.addColorStop(0, '#F3D9C4'); g.addColorStop(1, '#E0A98A');
  x.fillStyle = g; x.fillRect(0, 0, 240, 240);
  x.fillStyle = 'rgba(255,255,255,0.22)';
  x.beginPath(); x.arc(192, 48, 50, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#7A4A2F';
  x.font = 'bold 120px "Noto Sans SC", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ch, 120, 130);
  const u = c.toDataURL('image/png');
  _coverCache[ch] = u; return u;
}
function noteCoverUrl(n) { return (n && n.cover) ? n.cover : firstCharCover(n && n.name); }

/* 点封面图 → 弹窗展示该笔记的全部支出明细与合计金额 */
function openXhsNoteDetail(noteId) {
  const n = (S.xhs.noteExpenses || []).find(x => x.id === noteId);
  if (!n) return;
  const total = xhsNoteItemsTotal(n.items);
  const rows = (n.items || []).map(it => `
    <div class="detail-row">
      <span class="d-desc">${esc(it.desc || '（未命名明细）')}</span>
      <span class="d-amt">¥${(parseFloat(it.amount) || 0).toFixed(2)}</span>
    </div>`).join('') || '<div class="empty">还没有支出明细</div>';
  openModal(`
    <h3>📒 ${esc(n.name || '未命名笔记')}</h3>
    <img class="detail-cover" src="${noteCoverUrl(n)}" alt="封面" />
    ${n.date ? `<div class="detail-date">发布日期：${esc(n.date)}</div>` : ''}
    <div class="detail-list">${rows}</div>
    <div class="detail-total">总花费 <b>¥${total.toFixed(2)}</b></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="close-modal">关闭</button>
      <button class="btn btn-primary" data-action="xhs-note-edit" data-id="${n.id}">编辑</button>
    </div>`);
}

function renderLedger() {
  const { y, m } = ledgerMonth;
  const monthRecs = S.ledger.filter(r => {
    const d = new Date(r.date + 'T00:00:00');
    return d.getFullYear() === y && d.getMonth() === m;
  });
  const xhsExpMonth = xhsFlatExpenses().filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getFullYear() === y && d.getMonth() === m;
  }).map(xhsExpenseToRec);
  const allOut = [...monthRecs.filter(r => r.type === 'out'), ...xhsExpMonth];
  const inc = monthRecs.filter(r => r.type === 'in').reduce((s, r) => s + r.amount, 0);
  const out = allOut.reduce((s, r) => s + r.amount, 0);

  // 日历
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const daysIn = new Date(y, m + 1, 0).getDate();
  let cal = '';
  for (let i = 0; i < startDow; i++) cal += '<div class="cal-day out"></div>';
  for (let d = 1; d <= daysIn; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`;
    const recs = S.ledger.filter(r => r.date === ds);
    const i2 = recs.filter(r => r.type === 'in').reduce((s, r) => s + r.amount, 0);
    const o2 = allOut.filter(r => r.date === ds).reduce((s, r) => s + r.amount, 0);
    const xhsOnDay = xhsFlatExpenses().filter(e => e.date === ds).length;
    const has = recs.length > 0 || xhsOnDay > 0;
    const bar = has ? `<div class="amt">${i2 ? `<i class="i" style="flex:${i2}"></i>` : ''}${o2 ? `<i class="o" style="flex:${o2}"></i>` : ''}</div>` : '';
    cal += `<div class="cal-day ${ds === ledgerSel ? 'sel' : ''} ${has ? 'has' : ''} ${ds === todayStr() ? 'today' : ''}" data-action="ledger-pick" data-date="${ds}">
      <div class="d">${d}</div>${bar}</div>`;
  }
  const dows = ['日', '一', '二', '三', '四', '五', '六'].map(w => `<div class="cal-dow">${w}</div>`).join('');

  // 选中日明细（含小红书支出）
  const selRecs = S.ledger.filter(r => r.date === ledgerSel).sort((a, b) => b.amount - a.amount);
  const xhsSel = xhsFlatExpenses().filter(e => e.date === ledgerSel).map(xhsExpenseToRec).sort((a, b) => b.amount - a.amount);
  const allSel = [...selRecs, ...xhsSel];
  const selHTML = allSel.length ? allSel.map(r => `
    <div class="rec-item">
      <span class="r-cat" style="background:${CAT_COLOR[r.cat] || '#B6ADA1'}33;color:${CAT_COLOR[r.cat] || '#888'}">${r.cat}</span>
      <span class="r-note">${esc(r.note || (r.type === 'in' ? '收入' : '支出'))}</span>
      <span class="r-amt ${r.type === 'in' ? 'in' : 'out'}">${r.type === 'in' ? '+' : '-'}${money(r.amount).replace('¥', '¥')}</span>
      ${r.fromXhs ? '<span class="xhs-tag">小红书</span>' : `<button class="icon-btn danger" data-action="ledger-del" data-id="${r.id}">${icTrash()}</button>`}
    </div>`).join('') : '<div class="empty">这一天还没有账单</div>';

  // 分类饼图（支出，含小红书）
  const expByCat = {};
  allOut.forEach(r => expByCat[r.cat] = (expByCat[r.cat] || 0) + r.amount);
  const expTotal = Object.values(expByCat).reduce((s, v) => s + v, 0);
  let pieBg = 'conic-gradient(#E6DFD6 0 100%)', legend = '<div class="empty">本月暂无支出</div>';
  if (expTotal > 0) {
    let acc = 0; const segs = []; const lg = [];
    Object.entries(expByCat).sort((a, b) => b[1] - a[1]).forEach(([cat, v]) => {
      const start = acc / expTotal * 360, end = (acc + v) / expTotal * 360; acc += v;
      const col = CAT_COLOR[cat] || '#B6ADA1';
      segs.push(`${col} ${start}deg ${end}deg`);
      lg.push(`<div class="legend-row"><span class="sw" style="background:${col}"></span><span class="nm">${cat}</span><span class="pc">${Math.round(v / expTotal * 100)}%</span></div>`);
    });
    pieBg = `conic-gradient(${segs.join(',')})`;
    legend = lg.join('');
  }

  // 当月每日柱状（收入/支出）
  const bars = [];
  for (let d = 1; d <= daysIn; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`;
    const recs = S.ledger.filter(r => r.date === ds);
    const i2 = recs.filter(r => r.type === 'in').reduce((s, r) => s + r.amount, 0);
    const o2 = allOut.filter(r => r.date === ds).reduce((s, r) => s + r.amount, 0);
    const max = Math.max(i2, o2, 1);
    bars.push(`<div class="bar-col"><div class="bars-stack">
      <div class="b in" style="height:${i2 / max * 100}%"></div>
      <div class="b out" style="height:${o2 / max * 100}%"></div></div><div class="lab">${d}</div></div>`);
  }

  $('#view-ledger').innerHTML = `
    <div class="summary-grid" style="margin-bottom:18px">
      <div class="sum-cell in"><div class="lbl">本月收入</div><div class="val">${money(inc)}</div></div>
      <div class="sum-cell out"><div class="lbl">本月支出</div><div class="val">${money(out)}</div></div>
      <div class="sum-cell bal"><div class="lbl">结余</div><div class="val">${money(inc - out)}</div></div>
    </div>

    <div class="grid cols-2">
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--blue)"></span>日历收支 · ${y}年${m + 1}月
          <span style="margin-left:auto;display:flex;gap:6px">
            <button class="icon-btn btn-sm" data-action="cal-prev">${icPrev()}</button>
            <button class="icon-btn btn-sm" data-action="cal-next">${icNext()}</button>
          </span>
        </div>
        <div class="cal">${dows}${cal}</div>
        <button class="btn btn-primary btn-sm" style="margin-top:14px;width:100%" data-action="ledger-add" data-date="${ledgerSel}">+ 为 ${fmtDateCN(ledgerSel)} 记一笔</button>
      </div>

      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--rose)"></span>${fmtDateCN(ledgerSel)} 明细</div>
        ${selHTML}
      </div>
    </div>

    <div class="grid cols-2" style="margin-top:20px">
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--sand)"></span>支出分类占比</div>
        <div class="chart-wrap">
          <div class="pie" style="background:${pieBg}"></div>
          <div class="pie-legend">${legend}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--sage)"></span>本月每日收支趋势</div>
        <div class="bars">${bars.join('')}</div>
      </div>
    </div>`;
}

function openLedgerModal(date) {
  openModal(`
    <h3>💰 记一笔 · ${fmtDateCN(date)}</h3>
    <div class="field"><label>类型</label>
      <div class="seg" id="lgType">
        <button class="on" data-type="out">支出</button><button data-type="in">收入</button>
      </div>
    </div>
    <div class="field"><label>分类</label>
      <select class="select" id="lgCat">${EXP_CATS.map(c => `<option>${c}</option>`).join('')}</select>
    </div>
    <div class="field"><label>金额</label>
      <input class="input" id="lgAmt" type="number" min="0" step="0.01" placeholder="0.00" />
    </div>
    <div class="field"><label>备注</label>
      <input class="input" id="lgNote" placeholder="可选" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="close-modal">取消</button>
      <button class="btn btn-primary" data-action="ledger-save" data-date="${date}">保存</button>
    </div>`);
  let type = 'out';
  $('#lgType').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    type = b.dataset.type;
    $$('#lgType button').forEach(x => x.classList.toggle('on', x === b));
    $('#lgCat').innerHTML = (type === 'out' ? EXP_CATS : INC_CATS).map(c => `<option>${c}</option>`).join('');
  });
  window.__lgType = () => type;
}

/* 小红书：记录当前累计数据（每条是「当前总数快照」，只填变动项即可，其余自动沿用上一次） */
function openXhsAddModal() {
  openModal(`
    <h3>📈 记录当前数据</h3>
    <p class="modal-tip">填「当前的累计总数」。只改动的那一项就填，没动的留空——会自动沿用上一次的数值，不会变成 0。</p>
    <div class="field"><label>日期</label><input class="input" id="xDate" type="date" value="${todayStr()}" /></div>
    <div class="field"><label>粉丝量（当前总粉丝）</label><input class="input" id="xFollowers" type="number" min="0" placeholder="如 1500" /></div>
    <div class="field"><label>笔记数量（当前总篇数）</label><input class="input" id="xNotes" type="number" min="0" placeholder="如 86" /></div>
    <div class="field"><label>赞藏数量（点赞+收藏 总数）</label><input class="input" id="xZan" type="number" min="0" placeholder="如 7999" /></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="close-modal">取消</button>
      <button class="btn btn-primary" data-action="xhs-save-day">保存</button>
    </div>`);
}
/* 小红书：限流笔记备注 */
function openXhsLimitModal() {
  const L = S.xhs.limit || { count: 0, names: '' };
  openModal(`
    <h3>🚫 限流笔记备注</h3>
    <div class="field"><label>限流笔记数量（篇）</label><input class="input" id="xLimitCount" type="number" min="0" value="${L.count || 0}" /></div>
    <div class="field"><label>限流笔记名称（用顿号/逗号分隔）</label><textarea class="textarea" id="xLimitNames" placeholder="如：周末去哪儿 Vol.3、芽芽辅食记">${esc(L.names || '')}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="close-modal">取消</button>
      <button class="btn btn-primary" data-action="xhs-save-limit">保存</button>
    </div>`);
}
/* 小红书：待返款 / 蒲公英商单 */
function openRebrateModal(presetSrc) {
  openModal(`
    <h3>💸 添加待返款</h3>
    <div class="field"><label>来源</label>
      <div class="seg" id="rbSrc">
        <button class="on" data-type="rebate">普通返款</button><button data-type="pgy">🌼 蒲公英商单</button>
      </div>
    </div>
    <div class="field" id="rbDirField"><label>类型</label>
      <div class="seg" id="rbDir">
        <button class="on" data-type="out">我返款给PR（-）</button><button data-type="in">PR返款给我（+）</button>
      </div>
    </div>
    <div class="field"><label>金额</label><input class="input" id="rbAmt" type="number" min="0" step="0.01" placeholder="0.00" /></div>
    <div class="field"><label id="rbItemLabel">物品名称</label><input class="input" id="rbItem" placeholder="如：联名零食礼盒" /></div>
    <div class="field"><label>笔记发布日期</label><input class="input" id="rbPub" type="date" value="${todayStr()}" /></div>
    <div class="field"><label id="rbPromLabel">PR承诺最晚返款日期</label><input class="input" id="rbProm" type="date" value="${todayStr()}" /></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="close-modal">取消</button>
      <button class="btn btn-primary" data-action="rebrate-save">保存</button>
    </div>`);
  let dir = 'out';
  let src = presetSrc || 'rebate';
  const applySrcUI = () => {
    const isPgy = src === 'pgy';
    // 蒲公英商单都是品牌收款（收入），无需选择类型，直接隐藏该栏
    const dirField = $('#rbDirField');
    if (dirField) dirField.style.display = isPgy ? 'none' : '';
    $('#rbItemLabel').textContent = isPgy ? '笔记名称' : '物品名称';
    $('#rbItem').placeholder = isPgy ? '如：XX品牌联名测评' : '如：联名零食礼盒';
    $('#rbPromLabel').textContent = isPgy ? '最晚交易确认时间' : 'PR承诺最晚返款日期';
  };
  const lockDirForPgy = () => { if (src === 'pgy') dir = 'in'; };
  $('#rbSrc').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    src = b.dataset.type;
    $$('#rbSrc button').forEach(x => x.classList.toggle('on', x === b));
    lockDirForPgy();
    applySrcUI();
  });
  $('#rbDir').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    dir = b.dataset.type;
    $$('#rbDir button').forEach(x => x.classList.toggle('on', x === b));
  });
  if (src === 'pgy') {
    $$('#rbSrc button').forEach(x => x.classList.toggle('on', x.dataset.type === 'pgy'));
    lockDirForPgy();
  }
  applySrcUI();
  window.__rbDir = () => dir;
  window.__rbSrc = () => src;
}
/* 打勾确认弹窗：记录实际返款日期 + 渠道（PR返我 → 同时记入账本收入） */
function openRebateConfirmModal(r) {
  const isIn = r.dir !== 'out';
  const isPgy = r.src === 'pgy';
  openModal(`
    <h3>✅ 确认${isIn ? (isPgy ? '收到蒲公英商单款' : '收到 PR 返款') : '已返款给 PR'}</h3>
    <p class="modal-tip">${isIn ? (isPgy ? '确认后，这笔蒲公英商单款会按「返款日期」记到记账「收入 · 蒲公英」里，分类颜色为绿色。' : '确认后，这笔返款会按「返款日期」记到记账「收入 · 返款」里；PR承诺最晚返款日期只是提醒，不参与记账。') : '这是你给 PR 的返款，按你说的<span style="color:#D6453D;font-weight:700">不计入记账收入</span>，仅在此记录日期与渠道。'}</p>
    <div class="field"><label>${isIn ? '返款日期（你收到钱的日期）' : '返款日期（你支付给 PR 的日期）'}</label><input class="input" id="rbDate" type="date" value="${todayStr()}" /></div>
    <div class="field"><label>返款渠道</label>
      <select class="input" id="rbChannel">
        <option>微信</option><option>支付宝</option><option>银行卡</option><option>现金</option><option>其他</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="close-modal">取消</button>
      <button class="btn btn-primary" data-action="rebrate-confirm-save" data-id="${r.id}">确认</button>
    </div>`);
}

/* ===================== 4. 首页弹窗：添加纪念日（带农历预览） ===================== */
function openCdModal() {
  const lmOpts = LUNAR_MONTHS.map((mm, i) => `<option value="${i + 1}">${mm}月</option>`).join('');
  const ldOpts = LUNAR_DAYS.map((dd, i) => `<option value="${i + 1}">${dd}</option>`).join('');
  openModal(`
    <h3>📅 添加纪念日</h3>
    <div class="field"><label>名称</label><input class="input" id="cdLabel" placeholder="如：芽芽生日、结婚纪念日" /></div>
    <div class="cd-mode">
      <label class="cd-mode-opt"><input type="radio" name="cdMode" value="solar" checked /> 公历</label>
      <label class="cd-mode-opt"><input type="radio" name="cdMode" value="lunar" /> 农历（每年自动换算）</label>
    </div>
    <div class="field" id="cdSolarBox"><label>日期</label><input class="input" id="cdDate" type="date" value="${todayStr()}" /></div>
    <div id="cdLunarBox" style="display:none">
      <div class="field"><label>农历年（参考，可选填）</label><input class="input" id="cdLy" type="number" placeholder="如 2024，不填按今年" /></div>
      <div class="lunar-row">
        <select class="input" id="cdLm">${lmOpts}</select>
        <select class="input" id="cdLd">${ldOpts}</select>
        <label class="cd-leap"><input type="checkbox" id="cdLeap" /> 闰月</label>
      </div>
    </div>
    <div class="cd-preview" id="cdPreview"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="close-modal">取消</button>
      <button class="btn btn-primary" data-action="cd-save">保存</button>
    </div>`);
  const syncMode = () => {
    const lunar = document.querySelector('input[name="cdMode"]:checked').value === 'lunar';
    $('#cdSolarBox').style.display = lunar ? 'none' : '';
    $('#cdLunarBox').style.display = lunar ? '' : 'none';
    prev();
  };
  const prev = () => {
    const el = $('#cdPreview'); if (!el) return;
    const lunar = document.querySelector('input[name="cdMode"]:checked').value === 'lunar';
    if (lunar) {
      const y = parseInt($('#cdLy').value, 10) || new Date().getFullYear();
      const m = parseInt($('#cdLm').value, 10), d = parseInt($('#cdLd').value, 10);
      const leap = $('#cdLeap').checked;
      // 该年若无此闰月，提示无效
      if (leap && leapMonth(y) !== m) { el.innerHTML = `<span class="warn">${y}年 没有闰${LUNAR_MONTHS[m - 1]}月，请取消勾选闰月</span>`; return; }
      const g = lunarToSolar(y, m, d, leap);
      const gstr = `${g.getFullYear()}-${pad(g.getMonth() + 1)}-${pad(g.getDate())}`;
      const next = (new Date(gstr + 'T00:00:00') < new Date(todayStr() + 'T00:00:00')) ? lunarToSolar(y + 1, m, d, leap) : null;
      const nxStr = next ? `；今年已过，今年提醒日 <b>${fmtDateCN(`${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`)}</b>` : '';
      el.innerHTML = `对应公历：<b>${fmtDateCN(gstr)}</b> · ${zodiacOf(g.getFullYear())}年${nxStr}（每年自动按农历换算）`;
    } else {
      const v = ($('#cdDate').value || '').trim();
      if (!v) { el.textContent = ''; return; }
      const d = new Date(v + 'T00:00:00');
      el.innerHTML = `对应农历：<b>${lunarStr(d.getFullYear(), d.getMonth() + 1, d.getDate())}</b> · ${zodiacOf(d.getFullYear())}年`;
    }
  };
  $$('input[name="cdMode"]').forEach(r => r.addEventListener('change', syncMode));
  ['cdDate', 'cdLy', 'cdLm', 'cdLd', 'cdLeap'].forEach(id => $('#' + id).addEventListener('change', prev));
  prev();
}

/* ===================== 5. 小红书 ===================== */
/* 小红书：每条 records 是「累计总数快照」(可只填部分字段)。
   当前值 = 最新一条含该字段的记录(向上沿用); 增长 = 最新 − 上一条含该字段的记录(日常即对比昨天)。 */
function xhsBaseVal(m) { const b = S.xhs.base || {}; return m === 'f' ? (b.followers || 0) : m === 'n' ? (b.notes || 0) : (b.zanCang || 0); }
function xhsRecsWith(m) {
  return (S.xhs.records || []).filter(r => r[m] != null).slice().sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
}
function xhsCurrent(m) { const L = xhsRecsWith(m); return L.length ? L[0][m] : xhsBaseVal(m); }
function xhsDelta(m) {
  const L = xhsRecsWith(m);
  if (L.length < 2) return null;          // 不足两条记录时暂不显示增长
  return L[0][m] - L[1][m];               // 最新 − 上一条(日常即对比昨天；同日多次填写取最新)
}
function deltaHTML(delta) {
  if (delta == null) return `<span class="delta flat">— 暂无对比</span>`;
  if (delta > 0) return `<span class="delta up">▲ 较上次 +${delta}</span>`;
  if (delta < 0) return `<span class="delta down">▼ 较上次 ${delta}</span>`;
  return `<span class="delta flat">— 与上次持平</span>`;
}
function xhsMonthChart() {
  const expenses = xhsFlatExpenses();
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: `${d.getMonth() + 1}月`, total: 0 });
  }
  expenses.forEach(e => {
    const k = (e.date || '').slice(0, 7);
    const m = months.find(x => x.key === k);
    if (m) m.total += (e.amount || 0);
  });
  const max = Math.max(1, ...months.map(m => m.total));
  return months.map(m => `
    <div class="bar-col">
      <div class="bar-val">${m.total > 0 ? money(m.total) : ''}</div>
      <div class="bar-track"><div class="bar" style="height:${Math.max(4, (m.total / max * 100)).toFixed(1)}%"></div></div>
      <div class="bar-label">${m.label}</div>
    </div>`).join('');
}

function renderXhs() {
  const cur = { f: xhsCurrent('f'), n: xhsCurrent('n'), z: xhsCurrent('z') };

  // 待返款
  const rebates = S.xhs.rebates || [];
  const outPending = rebates.filter(r => r.dir === 'out' && !r.done).reduce((s, r) => s + (r.amount || 0), 0);
  const inPending = rebates.filter(r => r.dir === 'in' && !r.done).reduce((s, r) => s + (r.amount || 0), 0);
  const pgyPending = rebates.filter(r => r.src === 'pgy' && !r.done).reduce((s, r) => s + (r.amount || 0), 0);
  const doneCount = rebates.filter(r => r.done).length;
  const rebateHTML = rebates.length ? rebates.map(r => {
    const isOut = r.dir === 'out';
    const isPgy = r.src === 'pgy';
    const amtColor = isOut ? 'var(--rose-deep)' : 'var(--sage-deep)';
    const typeTag = isPgy
      ? `<span class="t-type pgy">🌼 蒲公英</span>`
      : `<span class="t-type ${isOut ? 'cash' : 'note'}">${isOut ? '我返PR' : 'PR返我'}</span>`;
    return `<div class="xhs-todo ${r.done ? 'done' : ''}">
      <div class="check ${r.done ? 'on' : ''}" data-action="rebrate-toggle" data-id="${r.id}">${r.done ? icCheck() : ''}</div>
      ${typeTag}
      <span class="tl-text"><b>${esc(r.item || '未命名物品')}</b>
        <span class="date-chip soft">📅 发布 ${esc(r.pub || '—')}</span>
        <span class="date-chip">${isPgy ? '⏰ 交易确认 ' : '⏰ 最晚 '}${esc(r.prom || '—')}</span>
        ${r.done && r.rdate ? `<span class="date-chip ok">✓ ${esc(r.rdate)}${r.channel ? ' · ' + esc(r.channel) : ''}</span>` : ''}
      </span>
      <span class="r-amt" style="color:${amtColor};font-weight:800">${isOut ? '-' : '+'}${money(r.amount || 0)}</span>
      <button class="icon-btn danger" data-action="rebrate-del" data-id="${r.id}">${icTrash()}</button>
    </div>`;
  }).join('') : '<div class="empty">暂无返款记录，点右上角「+ 添加」</div>';

  // 限流笔记备注（摘要放在「笔记数量」统计格，点击打开弹窗）
  const L = S.xhs.limit || { count: 0, names: '' };

  // 笔记支出（按笔记名称分组，每条含封面图 + 多条明细）
  const now = new Date();
  const notes = S.xhs.noteExpenses || [];
  const flatExp = xhsFlatExpenses();
  const mKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const monthTotal = flatExp.filter(e => (e.date || '').slice(0, 7) === mKey).reduce((s, e) => s + (e.amount || 0), 0);
  const totalAll = flatExp.reduce((s, e) => s + (e.amount || 0), 0);
  const expCount = flatExp.length;
  const noteCards = notes.map(n => {
    const isCart = (n.type || 'note') === 'cart';
    const noteTotal = xhsNoteItemsTotal(n.items);
    return `
    <div class="note-exp-card ${isCart ? 'cart' : ''}">
      <div class="note-cover" data-action="xhs-note-detail" data-id="${n.id}" title="点封面看支出明细">
        <img src="${noteCoverUrl(n)}" alt="封面" />
      </div>
      <div class="note-info">
        <div class="note-name"><b>${esc(n.name || '未命名笔记')}</b> <span class="etype-tag ${isCart ? 'cart' : 'note'}">${isCart ? '作业车' : '笔记'}</span></div>
        <div class="note-sub">${(n.items || []).length} 项明细${n.date ? ' · ' + esc(n.date) : ''}</div>
        <div class="note-total">总花费 <b>${money(noteTotal)}</b></div>
      </div>
      <div class="note-ops">
        <button class="icon-btn" data-action="xhs-note-edit" data-id="${n.id}" title="编辑">✏️</button>
        <button class="icon-btn danger" data-action="xhs-note-del" data-id="${n.id}" title="删除整条">${icTrash()}</button>
      </div>
    </div>`;
  }).join('');

  // 数据记录入口（点「查看统计」弹窗查看按日期的累计值与每日增长）
  const recHistory = `
    <div class="card">
      <div class="card-title"><span class="dot" style="background:var(--clay)"></span>数据记录历史
        <button class="btn btn-sm btn-ghost" data-action="xhs-open-history">📊 查看统计</button>
        <button class="btn btn-sm btn-ghost" data-action="xhs-open-base">⚙️ 设置起始基准</button>
        <button class="btn btn-sm btn-ghost" style="margin-left:auto" data-action="xhs-reset" title="清掉所有记录与基准数，从头开始">🧹 重置统计</button>
      </div>
      <div style="color:var(--ink-soft);font-size:13px">点「查看统计」可按日期查看每条数据的累计值，以及<span style="color:#D6453D;font-weight:700">每日增长</span>（涨红跌绿）。顶部数字 = <b>起始基准</b> + 你后来记录的变动。若看到不对的旧数字（如遗留的 15），点「设置起始基准」改成正确值，或「重置统计」从零开始。</div>
    </div>`;

  $('#view-xhs').innerHTML = `
    <div class="xhs-stat" style="margin-bottom:18px">
      <div class="xhs-cell"><div class="big">${cur.f.toLocaleString()}</div><div class="lbl">粉丝量</div>${deltaHTML(xhsDelta('f'))}</div>
      <div class="xhs-cell xhs-cell-limit ${L.count ? 'has-limit' : ''}" data-action="xhs-open-limit" title="点击管理限流笔记">
        <div class="big">${cur.n.toLocaleString()}</div>
        <div class="lbl">笔记数量</div>
        ${deltaHTML(xhsDelta('n'))}
        ${L.count ? `<div class="limit-mini">🚫 ${L.count} 篇限流</div>` : '<div class="limit-mini ok">未限流</div>'}
      </div>
      <div class="xhs-cell"><div class="big">${cur.z.toLocaleString()}</div><div class="lbl">赞藏数量</div>${deltaHTML(xhsDelta('z'))}</div>
    </div>
    <button class="btn btn-primary" style="margin-bottom:16px" data-action="xhs-add">+ 记录当前数据（粉丝 / 笔记 / 赞藏 当前总数）</button>
    ${recHistory}

    <div class="card" style="margin-top:20px">
      <div class="card-title"><span class="dot" style="background:var(--sage)"></span>待返款
        <button class="btn btn-sm btn-ghost" data-action="rebrate-add-pgy">🌼 蒲公英商单</button>
        <button class="btn btn-sm btn-ghost" style="margin-left:auto" data-action="rebrate-add">+ 添加</button>
      </div>
      <div class="rb-summary">
        <span class="rb-sum out">我返PR 还需 <b>${money(outPending)}</b></span>
        <span class="rb-sum in">PR返我 待收 <b>${money(inPending)}</b></span>
        ${pgyPending ? `<span class="rb-sum pgy">🌼 蒲公英待收 <b>${money(pgyPending)}</b></span>` : ''}
        ${doneCount ? `<span class="rb-done">已完成 ${doneCount} 笔</span>` : ''}
      </div>
      ${rebateHTML}
    </div>

    <div class="card" style="margin-top:20px">
      <div class="card-title"><span class="dot" style="background:var(--clay)"></span>笔记支出
        <span class="stat-pill" style="margin-left:auto">金额合计<b>${money(totalAll)}</b></span>
      </div>
      ${notes.length ? `<div class="note-exp-list">${noteCards}</div>` : '<div class="empty">还没有笔记支出。点下方「+ 记一笔」，按<b>笔记名称</b>记录，可上传封面图、填多条花费（如真人推广、评论互动），点封面即可看明细合计。</div>'}
      <div class="note-exp-foot"><button class="btn btn-sm btn-primary" data-action="xhs-exp-add">+ 记一笔</button></div>
    </div>

    <div class="card" style="margin-top:20px">
      <div class="card-title"><span class="dot" style="background:var(--sand)"></span>金额统计表
        <span class="stat-pills">
          <span class="stat-pill">月度<b>${money(monthTotal)}</b></span>
          <span class="stat-pill">总支出<b>${money(totalAll)}</b></span>
        </span>
      </div>
      <div class="xhs-chart">${xhsMonthChart()}</div>
      <div class="total-line">总支出金额 <b>${money(totalAll)}</b><span class="total-sub">共 ${expCount} 笔（含笔记支出与作业车）</span></div>
    </div>

    <div class="card" style="margin-top:20px">
      <div class="card-title"><span class="dot" style="background:var(--blue)"></span>数据备份
        <span style="margin-left:auto;display:flex;gap:8px">
          <button class="btn btn-sm btn-ghost" data-action="xhs-export-backup">⬇️ 导出备份</button>
          <button class="btn btn-sm btn-ghost" data-action="xhs-import-backup">⬆️ 导入备份</button>
        </span>
      </div>
      <div style="color:var(--ink-soft);font-size:13px">建议定期点「导出备份」把数据下载到电脑。换浏览器、清缓存或同步异常时，可用「导入备份」恢复。</div>
    </div>`;
}

/* ===================== 小红书：数据增长统计（按日期） ===================== */
/* 按日期聚合累计快照：每格数值 = 截至该日的最新累计（向上沿用），
   增量 = 当日累计 − 前一日累计（首日为 − 起始基线）。同日多次填写取最新。 */
function xhsHistoryRows() {
  const recs = (S.xhs.records || []).slice().sort((a, b) => (a.ts || '').localeCompare(b.ts || ''));
  const baseSnap = { f: xhsBaseVal('f'), n: xhsBaseVal('n'), z: xhsBaseVal('z') };
  const groups = {}; const order = [];
  recs.forEach(r => { if (!groups[r.date]) { groups[r.date] = []; order.push(r.date); } groups[r.date].push(r); });
  order.sort();
  let rf = baseSnap.f, rn = baseSnap.n, rz = baseSnap.z;
  let prev = { f: baseSnap.f, n: baseSnap.n, z: baseSnap.z };
  const rows = [];
  order.forEach(ds => {
    const dayRecs = groups[ds].slice().sort((a, b) => (a.ts || '').localeCompare(b.ts || ''));
    dayRecs.forEach(r => { if (r.f != null) rf = r.f; if (r.n != null) rn = r.n; if (r.z != null) rz = r.z; });
    rows.push({ date: ds, f: rf, n: rn, z: rz, df: rf - prev.f, dn: rn - prev.n, dz: rz - prev.z, recIds: dayRecs.map(r => r.id) });
    prev = { f: rf, n: rn, z: rz };
  });
  return rows;
}
function histMetricCell(val, delta) {
  const v = (val == null ? '—' : val.toLocaleString());
  let d = '持平', cls = 'flat';
  if (delta > 0) { d = '+' + delta.toLocaleString(); cls = 'up'; }
  else if (delta < 0) { d = delta.toLocaleString(); cls = 'down'; }
  return `<div class="xhs-hist-metric">
    <div class="xhs-hist-val">${v}</div>
    <div class="xhs-hist-delta ${cls}">${d}</div>
  </div>`;
}
function openXhsHistoryModal() {
  const rows = xhsHistoryRows();
  let body;
  if (!rows.length) {
    body = '<div class="empty">还没有记录，先点「记录当前数据」添加吧 🌱</div>';
  } else {
    const head = `
      <div class="xhs-hist-hc h-date">日期</div>
      <div class="xhs-hist-hc">粉丝量</div>
      <div class="xhs-hist-hc">赞藏数量</div>
      <div class="xhs-hist-hc">笔记数量</div>
      <div class="xhs-hist-hc h-act"></div>`;
    const cells = rows.map(r => {
      const dt = new Date(r.date + 'T00:00:00');
      const md = `${dt.getMonth() + 1}月${dt.getDate()}日`;
      const wk = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()];
      return `
        <div class="xhs-hist-date"><span class="d">${md}</span><span class="w">周${wk}</span></div>
        ${histMetricCell(r.f, r.df)}
        ${histMetricCell(r.n, r.dn)}
        ${histMetricCell(r.z, r.dz)}
        <div class="xhs-hist-act"><button class="icon-btn danger" data-action="xhs-hist-del" data-ids="${r.recIds.join(',')}" title="删除该日记录">${icTrash()}</button></div>`;
    }).join('');
    body = `<div class="xhs-hist"><div class="xhs-hist-table">${head}${cells}</div></div>
      <p class="modal-tip" style="margin-top:12px">每格下方小字为「较前一天」的增量：<b style="color:#D6453D">红色加粗 = 涨</b>，绿色 = 跌，持平则灰色。删除某一天会移除该日全部记录。</p>`;
  }
  openModal(`<h3>📊 数据增长统计</h3>${body}`, 'modal-wide');
}

/* 小红书：设置起始基准（起始数字，顶部显示 = 基准 + 后续记录变动） */
function openXhsBaseModal() {
  const b = S.xhs.base || { followers: 0, notes: 0, zanCang: 0 };
  openModal(`
    <h3>⚙️ 设置起始基准</h3>
    <p class="modal-tip">这是你「开始记录之前」的起始数字。顶部显示的粉丝/笔记/赞藏 = 起始基准 + 你后来记录的变动。<br>
    如果看到不对的旧数字（如遗留的 15），在这里改成正确的起始值即可；想从零开始就把三项都填 0。</p>
    <div class="field"><label>起始粉丝量</label><input class="input" id="bFollowers" type="number" min="0" value="${b.followers || 0}" /></div>
    <div class="field"><label>起始笔记数量</label><input class="input" id="bNotes" type="number" min="0" value="${b.notes || 0}" /></div>
    <div class="field"><label>起始赞藏数量</label><input class="input" id="bZan" type="number" min="0" value="${b.zanCang || 0}" /></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="close-modal">取消</button>
      <button class="btn btn-primary" data-action="xhs-save-base">保存基准</button>
    </div>`);
}

/* ===================== 事件委托 ===================== */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action, id = el.dataset.id;

  switch (a) {
    case 'close-modal': closeModal(); renderView(currentView); break;

    /* APP 图标切换 */
    case 'open-icon-modal': openIconModal(); break;
    case 'icon-preset': selectPreset(el.dataset.key); break;
    case 'icon-reset': resetIcon(); break;

    /* 导航 */
    case 'nav': break;

    /* 首页 */
    case 'home-cal-prev': homeCal.m--; if (homeCal.m < 0) { homeCal.m = 11; homeCal.y--; } renderHome(); break;
    case 'home-cal-next': homeCal.m++; if (homeCal.m > 11) { homeCal.m = 0; homeCal.y++; } renderHome(); break;
    case 'home-pick': homeCal.sel = el.dataset.date; renderHome(); break;
    case 'baby-cal-prev': babyCal.m--; if (babyCal.m < 0) { babyCal.m = 11; babyCal.y--; } renderView('baby'); break;
    case 'baby-cal-next': babyCal.m++; if (babyCal.m > 11) { babyCal.m = 0; babyCal.y++; } renderView('baby'); break;
    case 'baby-pick': openBabyDayModal(el.dataset.date); break;
    case 'baby-save': {
      const ds = el.dataset.date;
      const time = ($('#bpTime').value || '').trim() || '00:00';
      const type = ($('#bpType').value || BABY_TYPES[0]).trim();
      const note = ($('#bpNote').value || '').trim();
      S.baby.poops.push({ id: uid(), date: ds, time, type, note });
      save(); openBabyDayModal(ds); toast('已记录芽芽拉屎 💩'); break;
    }
    case 'baby-del': {
      const rec = (S.baby.poops || []).find(p => p.id === id);
      S.baby.poops = S.baby.poops.filter(p => p.id !== id);
      save(); if (rec) openBabyDayModal(rec.date); toast('已删除'); break;
    }
    case 'toggle-rest': {
      const ds = el.dataset.date; const set = S.home.rest || (S.home.rest = []);
      const i = set.indexOf(ds);
      if (i >= 0) set.splice(i, 1); else set.push(ds);
      save(); renderHome(); break;
    }
    case 'add-cd': openCdModal(); break;
    case 'cd-save': {
      const label = ($('#cdLabel').value || '').trim(); if (!label) { toast('请输入纪念日名称', 'warn'); return; }
      const lunar = document.querySelector('input[name="cdMode"]:checked').value === 'lunar';
      let item;
      if (lunar) {
        const y = parseInt($('#cdLy').value, 10) || null;
        const m = parseInt($('#cdLm').value, 10), d = parseInt($('#cdLd').value, 10);
        const leap = $('#cdLeap').checked;
        if (leap && leapMonth(y || new Date().getFullYear()) !== m) { toast('该农历年没有这个闰月', 'warn'); return; }
        item = { id: uid(), label, lunar: { y, m, d, leap }, date: '' };
      } else {
        const date = ($('#cdDate').value || '').trim(); if (!date) { toast('请选择日期', 'warn'); return; }
        item = { id: uid(), label, date };
      }
      S.home.countdowns.push(item); save(); closeModal(); renderHome(); toast('已添加纪念日'); break;
    }
    case 'del-cd': S.home.countdowns = S.home.countdowns.filter(c => c.id !== id); save(); renderHome(); break;

    /* 待办 */
    case 'todo-filter': todoFilter = el.dataset.cat; renderTodo(); break;
    case 'todo-toggle': { const t = S.todos.find(x => x.id === id); if (t) { t.done = !t.done; save(); renderTodo(); } break; }
    case 'todo-del': S.todos = S.todos.filter(x => x.id !== id); save(); renderTodo(); break;

    /* 饮食 */
    case 'diet-prev': dietDate = addDays(dietDate, -1); renderDiet(); break;
    case 'diet-next': dietDate = addDays(dietDate, 1); renderDiet(); break;
    case 'diet-today': dietDate = todayStr(); renderDiet(); break;
    case 'add-food': openFoodModal(el.dataset.meal); break;
    case 'ai-kcal': {
      const box = $('#recogBox'), st = $('#recogState');
      const name = ($('#foodContent').value || '').trim();
      if (!name) { toast('先填写食物内容再估算哦', 'warn'); return; }
      box.classList.add('show'); st.innerHTML = `<span class="spinner"></span>正在识别「${esc(name)}」…`;
      setTimeout(() => {
        const r = aiEstimate(name);
        if (!r) {
          st.innerHTML = `🌿 未匹配到「${esc(name)}」，请手动填写热量（可参考包装营养标签）`;
          toast('未识别，请手动输入', 'warn');
          return;
        }
        $('#foodContent').value = r.name;
        $('#foodKcal').value = r.kcal;
        dietModal.content = r.name; dietModal.kcal = r.kcal;
        st.innerHTML = `🌿 识别为 <b>${esc(r.name)}</b>，约 <b>${r.kcal}</b> kcal（演示估算，仅供参考）`;
        toast('已智能估算热量');
      }, 1100);
      break;
    }
    case 'food-save': {
      const content = ($('#foodContent').value || '').trim() || dietModal.content || '未命名';
      const kcal = Math.max(0, parseInt($('#foodKcal').value || '0', 10) || dietModal.kcal || 0);
      const note = ($('#foodNote').value || '').trim();
      const now = new Date();
      const rec = { id: uid(), meal: dietModal.meal, time: `${pad(now.getHours())}:${pad(now.getMinutes())}`, content, kcal, note, photo: dietModal.photo };
      (S.diet.days[dietDate] = S.diet.days[dietDate] || []).push(rec);
      save(); closeModal(); renderDiet(); toast('已记录～'); break;
    }
    case 'recalc-goal': syncGoalFromProfile(); save(); renderDiet(); toast('已按身高体重重算目标'); break;
    case 'food-del': {
      const arr = S.diet.days[dietDate] || [];
      S.diet.days[dietDate] = arr.filter(f => f.id !== id); save(); renderDiet(); break;
    }

    /* 记账 */
    case 'cal-prev': ledgerMonth.m--; if (ledgerMonth.m < 0) { ledgerMonth.m = 11; ledgerMonth.y--; } renderLedger(); break;
    case 'cal-next': ledgerMonth.m++; if (ledgerMonth.m > 11) { ledgerMonth.m = 0; ledgerMonth.y++; } renderLedger(); break;
    case 'ledger-pick': ledgerSel = el.dataset.date; renderLedger(); break;
    case 'ledger-add': openLedgerModal(el.dataset.date); break;
    case 'ledger-save': {
      const type = window.__lgType ? window.__lgType() : 'out';
      const cat = $('#lgCat').value;
      const amount = Math.max(0, parseFloat($('#lgAmt').value || '0'));
      const note = ($('#lgNote').value || '').trim();
      if (!amount) { toast('请输入金额', 'warn'); return; }
      S.ledger.push({ id: uid(), date: el.dataset.date, type, cat, amount, note });
      save(); closeModal(); renderLedger(); toast('已记一笔'); break;
    }
    case 'ledger-del': S.ledger = S.ledger.filter(r => r.id !== id); save(); renderLedger(); break;

    /* 小红书 */
    case 'goto-xhs': showView('xhs'); break;
    case 'xhs-add': openXhsAddModal(); break;
    case 'xhs-open-history': openXhsHistoryModal(); break;
    case 'xhs-open-base': openXhsBaseModal(); break;
    case 'xhs-save-base': {
      S.xhs.base = {
        followers: Math.max(0, parseInt($('#bFollowers').value || '0', 10) || 0),
        notes: Math.max(0, parseInt($('#bNotes').value || '0', 10) || 0),
        zanCang: Math.max(0, parseInt($('#bZan').value || '0', 10) || 0)
      };
      save(); closeModal(); renderXhs(); toast('已更新起始基准'); break;
    }
    case 'xhs-reset': {
      if (window.confirm('确定要重置小红书统计吗？\n\n会清空当前的「基准数」和所有已记录的数据（粉丝/笔记/赞藏），之后你需要重新用「记录当前数据」填入真实数字。\n\n此操作无法撤销。')) {
        S.xhs.base = { followers: 0, notes: 0, zanCang: 0 };
        S.xhs.records = [];
        save(); closeModal(); renderXhs(); toast('已重置，请重新记录真实数据');
      }
      break;
    }
    case 'xhs-hist-del': {
      const ids = (el.dataset.ids || '').split(',').filter(Boolean);
      if (ids.length) { S.xhs.records = (S.xhs.records || []).filter(r => !ids.includes(r.id)); save(); }
      openXhsHistoryModal(); toast('已删除该日记录'); break;
    }
    case 'xhs-save-day': {
      const date = ($('#xDate').value || todayStr()).trim();
      const fv = ($('#xFollowers').value || '').trim();
      const nv = ($('#xNotes').value || '').trim();
      const zv = ($('#xZan').value || '').trim();
      const rec = { id: uid(), date, ts: new Date().toISOString() };
      if (fv !== '') rec.f = Math.max(0, parseInt(fv, 10) || 0);
      if (nv !== '') rec.n = Math.max(0, parseInt(nv, 10) || 0);
      if (zv !== '') rec.z = Math.max(0, parseInt(zv, 10) || 0);
      if (rec.f == null && rec.n == null && rec.z == null) { toast('至少填一项', 'warn'); return; }
      S.xhs.records = S.xhs.records || [];
      S.xhs.records.push(rec);
      save(); closeModal(); renderXhs(); toast('已记录（最新一条即为当前数）'); break;
    }
    case 'xhs-edit-limit':
    case 'xhs-open-limit': openXhsLimitModal(); break;
    case 'xhs-export-backup': exportBackup(); break;
    case 'xhs-import-backup': openImportPicker(); break;
    case 'xhs-save-limit': {
      const count = Math.max(0, parseInt($('#xLimitCount').value || '0', 10) || 0);
      const names = ($('#xLimitNames').value || '').trim();
      S.xhs.limit = { count, names };
      save(); closeModal(); renderXhs(); toast('已保存限流笔记备注'); break;
    }
    case 'xhs-exp-add': openXhsNoteExpModal(); break;
    case 'xhs-note-edit': openXhsNoteExpModal(id); break;
    case 'xhs-note-detail': openXhsNoteDetail(id); break;
    case 'xhs-item-del': {
      const iid = el.dataset.iid || id;
      const row = document.querySelector(`#neItems .exp-item-row[data-iid="${iid}"]`);
      if (row) {
        row.remove();
        let s = 0; $$('#neItems .exp-amt').forEach(inp => { s += parseFloat(inp.value || '0') || 0; });
        const tv = $('#neTotalVal'); if (tv) tv.textContent = money(s);
      }
      break;
    }
    case 'xhs-note-save': {
      const editId = id || '';
      const name = ($('#neName').value || '').trim();
      const date = ($('#neDate').value || '').trim();
      const type = (window.__neType ? window.__neType() : 'note');
      const cover = (window.__neCover ? window.__neCover() : '');
      const items = [];
      $$('#neItems .exp-item-row').forEach(row => {
        const desc = (row.querySelector('.exp-desc').value || '').trim();
        const amt = Math.max(0, parseFloat(row.querySelector('.exp-amt').value || '0'));
        const kindSel = row.querySelector('.exp-kind');
        const kind = kindSel ? kindSel.value : 'custom';
        if (desc || amt) items.push({ id: row.dataset.iid && !row.dataset.iid.startsWith('_') ? row.dataset.iid : uid(), desc, amount: amt, kind });
      });
      if (!name) { toast('请填写笔记名称', 'warn'); return; }
      if (!items.length) { toast('请至少填写一项支出金额或说明', 'warn'); return; }
      S.xhs.noteExpenses = S.xhs.noteExpenses || [];
      if (editId) {
        const n = S.xhs.noteExpenses.find(x => x.id === editId);
        if (n) { n.name = name; n.date = date; n.type = type; n.cover = cover; n.items = items; }
      } else {
        S.xhs.noteExpenses.push({ id: uid(), name, date, type, cover, items });
      }
      save(); closeModal(); renderXhs(); toast(editId ? '已更新笔记支出' : '已记一笔笔记支出'); break;
    }
    case 'xhs-note-del': {
      if (window.confirm('确定删除这条笔记支出（含封面图与全部明细）吗？此操作无法撤销。')) {
        S.xhs.noteExpenses = (S.xhs.noteExpenses || []).filter(n => n.id !== id);
        save(); renderXhs();
      }
      break;
    }
    case 'xhs-rec-del': S.xhs.records = (S.xhs.records || []).filter(r => r.id !== id); save(); renderXhs(); toast('已删除该条记录'); break;
    case 'rebrate-add': openRebrateModal(); break;
    case 'rebrate-add-pgy': openRebrateModal('pgy'); break;
    case 'rebrate-save': {
      const amount = Math.max(0, parseFloat($('#rbAmt').value || '0'));
      const item = ($('#rbItem').value || '').trim();
      const pub = ($('#rbPub').value || '').trim();
      const prom = ($('#rbProm').value || todayStr()).trim();
      if (!amount || !item) { toast('请输入金额和物品名称', 'warn'); return; }
      S.xhs.rebates = S.xhs.rebates || [];
      S.xhs.rebates.push({ id: uid(), dir: window.__rbDir ? window.__rbDir() : 'out', src: window.__rbSrc ? window.__rbSrc() : 'rebate', amount, item, pub, prom, done: false });
      save(); closeModal(); renderXhs(); toast('已添加待返款'); break;
    }
    case 'rebrate-toggle': {
      const r = (S.xhs.rebates || []).find(z => z.id === id);
      if (!r) break;
      if (r.done) {
        // 取消打勾：撤销已完成状态（含账本收入）
        r.done = false;
        if (r.dir === 'in' && r.ledgerId) S.ledger = S.ledger.filter(x => x.id !== r.ledgerId);
        delete r.ledgerId; delete r.rdate; delete r.channel;
        save(); renderXhs();
        toast('已取消，从账本移除');
      } else {
        // 打勾：弹窗填写实际返款日期 + 渠道
        openRebateConfirmModal(r);
      }
      break;
    }
    case 'rebrate-confirm-save': {
      const r = (S.xhs.rebates || []).find(z => z.id === id);
      if (!r) break;
      const rdate = ($('#rbDate').value || todayStr()).trim();
      const channel = ($('#rbChannel').value || '其他').trim();
      r.done = true; r.rdate = rdate; r.channel = channel;
      S.ledger = S.ledger || [];
      if (r.dir === 'in') {
        const lid = uid();
        r.ledgerId = lid;
        const cat = (r.src === 'pgy') ? '蒲公英' : '返款';
        S.ledger.push({ id: lid, date: rdate, type: 'in', cat, amount: r.amount || 0, note: `${cat} · ${r.item || '待返款'} · ${channel}` });
      }
      save(); closeModal(); renderXhs();
      toast(r.dir === 'in' ? '已确认收款并记入账本' : '已确认返款给 PR');
      break;
    }
    case 'rebrate-del': {
      const r = (S.xhs.rebates || []).find(z => z.id === id);
      if (r && r.ledgerId) S.ledger = S.ledger.filter(x => x.id !== r.ledgerId);
      S.xhs.rebates = (S.xhs.rebates || []).filter(z => z.id !== id);
      save(); renderXhs(); break;
    }

    /* 红薯日历（出稿笔记 · 万年历含农历） */
    case 'hs-cal-prev-year': hongshuCal.y--; renderHome(); break;
    case 'hs-cal-next-year': hongshuCal.y++; renderHome(); break;
    case 'hs-cal-prev': hongshuCal.m--; if (hongshuCal.m < 0) { hongshuCal.m = 11; hongshuCal.y--; } renderHome(); break;
    case 'hs-cal-next': hongshuCal.m++; if (hongshuCal.m > 11) { hongshuCal.m = 0; hongshuCal.y++; } renderHome(); break;
    case 'hs-cal-today': hongshuCal = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: todayStr() }; renderHome(); break;
    case 'hs-pick': openHongshuDayModal(el.dataset.date); break;
    case 'hs-add-note': {
      const ds = el.dataset.date;
      const item = ($('#hsItem').value || '').trim();
      const content = ($('#hsContent').value || '').trim();
      const type = ($('#hsType').value || PUB_TYPES[0]).trim();
      const status = ($('#hsStatus').value || '待出稿').trim();
      const deadline = ($('#hsDeadline').value || '').trim();
      if (!content) { toast('请填写出稿笔记内容', 'warn'); return; }
      let quote = 0, rebatePct = 0, rebate = 0, fee = 0, net = 0;
      if (type === '蒲公英商单') {
        quote = Math.max(0, parseFloat($('#hsQuote').value || '0') || 0);
        rebatePct = parseFloat($('#hsRebatePct').value || '0') || 0;
        fee = Math.round(quote * 0.1 * 100) / 100;
        rebate = -Math.round(quote * rebatePct / 100 * 100) / 100;
        net = Math.round((quote - fee + rebate) * 100) / 100;
      }
      S.publish.notes.push({ id: uid(), date: ds, item, content, type, status, deadline, quote, rebatePct, rebate, fee, net });
      save(); closeModal(); renderHome(); toast('已保存出稿笔记 🍠'); break;
    }
    case 'hs-note-del': {
      const n = (S.publish.notes || []).find(x => x.id === id);
      S.publish.notes = (S.publish.notes || []).filter(x => x.id !== id);
      save(); if (n) openHongshuDayModal(n.date); toast('已删除'); break;
    }
  }
});

/* 表单提交（待办新增 / 便签新增） */
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  if (f.dataset.form === 'todo-add') {
    const text = f.elements.text.value.trim(); if (!text) return;
    const order = S.todos.reduce((m, t) => Math.min(m, t.order), 9999) - 1;
    S.todos.push({ id: uid(), text, date: f.elements.date.value || todayStr(), cat: f.elements.cat.value, prio: f.elements.prio.value, done: false, order });
    save(); renderTodo();
  }
});

/* 失焦保存（可编辑文本） */
document.addEventListener('blur', e => {
  const el = e.target.closest('[data-edit]'); if (!el) return;
  const id = el.dataset.id, val = el.textContent.trim();
  const kind = el.dataset.edit;
  if (kind === 'todo-text') { const t = S.todos.find(x => x.id === id); if (t && val) { t.text = val; save(); } }
  else if (kind === 'food-content') {
    const day = S.diet.days[dietDate] || []; const f = day.find(x => x.id === id);
    if (f) { f.content = val; save(); }
  }
}, true);

/* 饮食身体数据（change 即时保存 + 自动换算目标） */
document.addEventListener('change', e => {
  if (e.target.id === 'weightInput') { S.diet.profile = S.diet.profile || { weight: 0, height: 0 }; S.diet.profile.weight = parseFloat(e.target.value) || 0; syncGoalFromProfile(); save(); renderDiet(); }
  else if (e.target.id === 'heightInput') { S.diet.profile = S.diet.profile || { weight: 0, height: 0 }; S.diet.profile.height = parseFloat(e.target.value) || 0; syncGoalFromProfile(); save(); renderDiet(); }
  else if (e.target.id === 'goalInput') { S.diet.goal = Math.max(0, parseInt(e.target.value, 10) || 0); save(); renderDiet(); }
});

/* 待办拖拽排序 */
(() => {
  const list = $('#view-todo');
  let dragId = null;
  list.addEventListener('dragstart', e => {
    const item = e.target.closest('.todo'); if (!item) return;
    dragId = item.dataset.id; item.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move';
  });
  list.addEventListener('dragend', e => { const it = e.target.closest('.todo'); if (it) it.classList.remove('dragging'); });
  list.addEventListener('dragover', e => { e.preventDefault(); });
  list.addEventListener('drop', e => {
    e.preventDefault(); if (!dragId) return;
    const after = getDragAfter(list, e.clientY);
    const ids = [...list.querySelectorAll('.todo')].map(n => n.dataset.id);
    const from = ids.indexOf(dragId);
    ids.splice(from, 1);
    const afterId = after ? after.dataset.id : null;
    const insertAt = afterId ? ids.indexOf(afterId) : ids.length;
    ids.splice(insertAt, 0, dragId);
    // 重新编号 order
    ids.forEach((iid, idx) => { const t = S.todos.find(x => x.id === iid); if (t) t.order = idx; });
    save(); renderTodo(); dragId = null;
  });
  function getDragAfter(container, y) {
    const els = [...container.querySelectorAll('.todo:not(.dragging)')];
    return els.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, el: child };
      return closest;
    }, { offset: -Infinity, el: null }).el;
  }
})();

/* 导航点击 */
$('#nav').addEventListener('click', e => {
  const b = e.target.closest('.nav-item'); if (!b) return;
  showView(b.dataset.view);
});

/* ===================== 小图标 ===================== */
function icCheck() { return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 6"/></svg>'; }
function icTrash() { return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>'; }
function icPin() { return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6l-1 7 3 3H7l3-3-1-7zM12 14v6"/></svg>'; }
function icPrev() { return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>'; }
function icNext() { return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>'; }
function sproutSVG(sz) {
  return `<svg viewBox="0 0 48 48" width="${sz}" height="${sz}">
    <path d="M24 42 V22" stroke="#CD8E6B" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M24 27 C15 27 10 21 10 12 C19 12 24 18 24 27 Z" fill="#E0A98A"/>
    <path d="M24 23 C33 23 38 17 38 8 C29 8 24 14 24 23 Z" fill="#CD8E6B"/>
    <circle cx="24" cy="44" r="3" fill="#E9C7A1"/></svg>`;
}

/* ===================== 云端同步（Supabase） ===================== */
let sbClient = null, lastSaveTime = 0, syncTimer = null, cloudHasData = null;
function setSync(state, detail) {
  const pill = $('#syncPill'); if (!pill) return;
  pill.className = 'sync-pill sync-' + state;
  const map = { online: '已同步', offline: '未连接', syncing: '同步中' };
  $('#syncTxt').textContent = map[state] + (detail ? ' · ' + detail : '');
}
function initSync() {
  if (!SUPABASE_CFG.url || !SUPABASE_CFG.anon) { setSync('offline', '未配置云端'); return; }
  if (typeof supabase !== 'undefined') { connectSupabase(); return; }
  /* 已配置但未加载客户端：动态加载（避免阻塞首屏） */
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  s.onload = connectSupabase;
  s.onerror = () => setSync('offline', '客户端未加载');
  document.head.appendChild(s);
}
function connectSupabase() {
  if (typeof supabase === 'undefined') { setSync('offline', '客户端未加载'); return; }
  try { sbClient = supabase.createClient(SUPABASE_CFG.url, SUPABASE_CFG.anon); }
  catch (e) { setSync('offline', '初始化失败'); return; }
  setSync('syncing');
  pullSync();
  setInterval(pullSync, 20000); /* 每 20s 拉取他端更新 */
}
async function pullSync() {
  if (!sbClient) return;
  try {
    const { data, error } = await sbClient.from('workbench')
      .select('data, updated_at').eq('user_id', SUPABASE_CFG.userId).maybeSingle();
    if (error) throw error;
    if (data && data.data) {
      cloudHasData = true;
      const remote = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
      const localMtime = S._modifiedAt || 0;
      if (new Date(data.updated_at).getTime() > localMtime && JSON.stringify(remote) !== JSON.stringify(S)) {
        S = Object.assign(defaultState(), remote);
        renderView(currentView);
        toast('已从云端同步最新数据', 'ok');
      }
    } else if (data === null) {
      cloudHasData = false;
      pushSync(); /* 云端暂无本机数据：首次打开即上传本地备份 */
    }
    setSync('online');
  } catch (e) { setSync('offline', '同步失败'); }
}
/* 判断当前状态是否是「空白默认」（除了种子纪念日外没有任何真实录入）。
   用于防止空白设备把云端已有的真实数据覆盖成空。 */
function isFreshDefault(s) {
  const x = s.xhs || {};
  return (s.todos || []).length === 0
    && (s.ledger || []).length === 0
    && Object.keys(s.diet.days || {}).length === 0
    && (x.records || []).length === 0
    && (x.noteExpenses || []).length === 0
    && (x.rebates || []).length === 0
    && (x.limit ? x.limit.count === 0 : true)
    && (x.base ? (x.base.followers || 0) === 0 && (x.base.notes || 0) === 0 && (x.base.zanCang || 0) === 0 : true);
}
function pushSync() {
  if (!sbClient) { setSync('offline', '未配置云端'); return; }
  /* 安全护栏：空白设备不要覆盖云端已有数据（避免误清空真实记录） */
  if (isFreshDefault(S) && cloudHasData === true) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const { error } = await sbClient.from('workbench').upsert({
        user_id: SUPABASE_CFG.userId, data: S, updated_at: new Date().toISOString()
      });
      if (error) throw error;
      lastSaveTime = Date.now();
      setSync('online');
    } catch (e) { setSync('offline', '同步失败'); }
  }, 600);
}
/* ---------- 手动备份：导出 / 导入 ---------- */
function exportBackup() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `changruyi_backup_${todayStr()}.json`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  toast('备份文件已下载', 'ok');
}
function importBackup(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const raw = JSON.parse(fr.result);
      if (!raw || typeof raw !== 'object' || !raw.xhs) throw new Error('文件格式不对');
      if (!confirm('导入备份会覆盖当前所有数据（笔记支出、返款、历史记录等）。确定继续？')) return;
      S = Object.assign(defaultState(), raw);
      save(); renderView(currentView);
      toast('备份已导入', 'ok');
    } catch (e) { toast('导入失败：' + e.message, 'warn'); }
  };
  fr.onerror = () => toast('读取文件失败', 'warn');
  fr.readAsText(file);
}
function openImportPicker() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => { if (inp.files && inp.files[0]) importBackup(inp.files[0]); };
  inp.click();
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ===================== 启动 ===================== */
/* 迁移：旧版 daily 模型已废弃。不再把旧数据加总成「基准数」（会生成错误数字且丢失历史），
   而是直接丢弃旧格式、空白起步；历史需用户用「记录当前数据」重新录入。 */
(function migrateXhs() {
  if (S.xhs && S.xhs.daily && !S.xhs.records) {
    S.xhs.base = { followers: 0, notes: 0, zanCang: 0 };
    S.xhs.records = [];
    delete S.xhs.daily;
    save();
  }
  /* 旧版扁平 expenses → 按笔记名称分组的新结构（保留历史支出） */
  if (S.xhs && S.xhs.expenses && S.xhs.expenses.length && (!S.xhs.noteExpenses || !S.xhs.noteExpenses.length)) {
    const map = {};
    S.xhs.expenses.forEach(e => {
      const key = (e.noteName || '未命名笔记') + '|' + (e.date || '');
      if (!map[key]) map[key] = { id: uid(), name: e.noteName || '未命名笔记', type: (e.etype === 'cart') ? 'cart' : 'note', cover: '', date: e.date || '', items: [] };
      map[key].items.push({ id: uid(), desc: e.note || '', amount: e.amount || 0 });
    });
    S.xhs.noteExpenses = Object.values(map);
    delete S.xhs.expenses;
    save();
  }
})();

$('#topDate').textContent = fmtDateCN(todayStr());
showView('home');
applyAppIcon();
initSync();
registerSW();
