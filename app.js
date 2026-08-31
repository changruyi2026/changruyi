/* ===================== 常如意工作台 · 应用逻辑 ===================== */

'use strict';



const KEY = 'changruyi_workbench_v1';

const APP_VERSION = 'v46'; /* 与 sw.js / index.html 的缓存版本号保持一致；用于「本地旧版本」检测与提示刷新 */



/* ===================== GitHub 云端同步配置 =====================

 * 用 GitHub 仓库里的 data.json 做多设备同步（浏览器直连 api.github.com，支持 CORS）。

 * token 需拥有该仓库的写权限（repo 范围）；多设备共用同一 token + 同一文件即可共享数据。

 * ⚠️ 此 token 会被打包进前端代码、任何人打开页面都能看到，请仅用于个人私有仓库，并定期轮换。 */

const GITHUB_CFG = {

  token: 'ghp_FVQ2XxjWw' + 'v2ybbkG26udllhcKuS2UA4YuysC',

  owner: 'changruyi2026',

  repo: 'changruyi',

  path: 'data.json',

  branch: 'main'

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

      rest: [],

      hsReadCount: 0

    },

    ledger: [],

    xhs: {

      base: { followers: 0, notes: 0, zanCang: 0 },

      records: [],

      limit: { '常如意i': { count: 0, names: '' }, '芽芽Mochi': { count: 0, names: '' } },

      noteExpenses: [],

      rebates: []

    },

    baby: { poops: [], meds: [] },

    publish: { notes: [] }, /* 旧版兼容：迁移后数据写入 ruyiNotes / yayaNotes */

    ruyiNotes: [],

    yayaNotes: [],

    backups: []

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



/* 旧版 S.publish.notes 全部属于芽芽Mochi，整体并入 yayaNotes；如意日历保持空白；幂等，不丢数据 */

function migrateCalendarSplit() {

  try {

    const raw = localStorage.getItem(KEY);

    if (!raw) return;

    const data = JSON.parse(raw);

    if (!data || typeof data !== 'object') return;

    if (!Array.isArray(data.ruyiNotes)) data.ruyiNotes = [];

    if (!Array.isArray(data.yayaNotes)) data.yayaNotes = [];

    /* 任何残留在旧 publish.notes 里的历史笔记，全部归入芽芽日历（用户确认旧红薯日历数据都属于芽芽Mochi） */

    const old = Array.isArray(data.publish && data.publish.notes) ? data.publish.notes : [];

    if (old.length) {

      for (const n of old) data.yayaNotes.push(n);

      if (!data.publish) data.publish = {};

      data.publish.notes = []; /* 清空旧数组，避免重复统计；publish 容器保留做兼容 */

      localStorage.setItem(KEY, JSON.stringify(data));

    }

  } catch (e) { console.warn('migrateCalendarSplit failed', e); }

}



let S = load();

function load() {
  migrateCalendarSplit(); /* 迁移旧版红薯日历数据到如意/芽芽两个日历 */

  try { const r = localStorage.getItem(KEY); if (r) return Object.assign(defaultState(), JSON.parse(r)); }

  catch (e) { console.warn('load failed', e); }

  return defaultState();

}

function save() { S._modifiedAt = Date.now(); snapshotIfNeeded(); trimBackups(S); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('保存失败：本地存储已满（图片过多）', 'warn'); } pushSync(); updateHomeBadge(); }

/* 清理备份：保留最近 7 天，防止 localStorage 和云端 data.json 体积膨胀 */

function trimBackups(s) {

  try {

    if (s && Array.isArray(s.backups) && s.backups.length > 7) s.backups = s.backups.slice(0, 7);

  } catch (e) {}

}

/* 每日自动备份：每天首次保存时，把当前完整状态存一份到 S.backups（保留最近 7 天，控制体积）。

   与云端同步共用同一个云端行，恢复时可选某一天「回退」。 */

function snapshotIfNeeded() {

  try {

    if (!S.backups) S.backups = [];

    const today = todayStr();

    if (S.backups[0] && S.backups[0].date === today) return;

    /* 保存快照时去掉 backups 自身，避免嵌套导致体积指数膨胀 */

    const snap = JSON.parse(JSON.stringify(S));

    delete snap.backups;

    S.backups.unshift({ date: today, ts: Date.now(), data: snap });

    if (S.backups.length > 7) S.backups = S.backups.slice(0, 7);

  } catch (e) {}

}



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

  ledger: ['记账', '每一笔，都是生活的痕迹'],

  xhs: ['红薯概况', '发芽芽的日常 · 常如意i'],

  baby: ['女鹅记录', '女鹅的成长日记 · 拉屎打卡 💩'],

  ruyi: ['如意日历', '大号常如意i · 出稿笔记 📕'],
  yaya: ['芽芽日历', '小号芽芽Mochi · 出稿笔记 🌱']

};

let currentView = 'home';



function showView(v) {

  currentView = v;

  const tt = TITLES[v] || ['', ''];

  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === v));

  $('#viewTitle').textContent = tt[0];

  $('#viewSub').textContent = tt[1];

  $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));

  renderView(v);

  $('.views').scrollTop = 0;

}



function renderView(v) {

  if (v === 'home') renderHome();

  else if (v === 'ledger') renderLedger();

  else if (v === 'xhs') renderXhs();

  else if (v === 'baby') renderBaby();

  else if (v === 'ruyi') renderRuyi();
  else if (v === 'yaya') renderYaya();

}



/* ===================== 0. 首页 ===================== */

const QUOTES = [

  '慢慢来，比较快。', '你种下的每颗小芽，都会开花。', '今天的努力，是明天的礼物。',

  '带娃很累，但爱很甜。', '把日子过成喜欢的样子。', '认真生活的人，会被生活偏爱。',

  '一点点变好，就是最好。', '温柔而坚定，是妈妈的力量。', '今天也要给自己一个拥抱。',

  '发芽芽的日常，平凡也闪亮。', '先照顾好自己，才能照顾好女鹅。', '热爱可抵岁月漫长。'

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

  ledger: { color: 'var(--blue-deep)', label: '记账' },

  exp:    { color: 'var(--rose-deep)', label: '小红书支出' },

  rebate: { color: 'var(--lilac)',     label: '待返款' }

};



/* 聚合某一天在全站各模块中的带日期事项 */

function homeDayItems(ds) {

  const items = [];

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



/* 首页：红薯日历中所有待出稿笔记（按截止日期近→远，无截止日期排最后） */

function homeDraftNotes() {

  /* 首页「今日待出稿」合并如意、芽芽两个日历，只显示截止日期为今天且仍是待出稿的笔记 */

  const ds = todayStr();

  const ruyi = (S.ruyiNotes || []).filter(n => n.deadline === ds && normStatus(n.status) === '待出稿').map(n => ({ ...n, cal: '常如意i' }));

  const yaya = (S.yayaNotes || []).filter(n => n.deadline === ds && normStatus(n.status) === '待出稿').map(n => ({ ...n, cal: '芽芽Mochi' }));

  const list = [...ruyi, ...yaya];

  list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return list;

}



/* 首页 badge：两个日历今日待出稿总数 */

function totalPendingCount() {

  const ds = todayStr();

  const ruyi = (S.ruyiNotes || []).filter(n => n.deadline === ds && normStatus(n.status) === '待出稿').length;

  const yaya = (S.yayaNotes || []).filter(n => n.deadline === ds && normStatus(n.status) === '待出稿').length;

  return ruyi + yaya;

}



function renderHome() {

  const now = new Date();

  const quote = QUOTES[dayOfYear() % QUOTES.length];

  const pending = totalPendingCount();

  S.home.hsReadCount = pending; /* 进入首页即标记已读 */

  const alertBanner = pending > 0

    ? `<div class="hs-alert-banner">

        <span class="hs-alert-ico">🔔</span>

        <div class="hs-alert-txt">请注意，您有${pending}条笔记今日需出稿！</div>

      </div>`

    : '';



  const draftNotes = homeDraftNotes();

  const draftCard = draftNotes.length

    ? `<div class="card home-draft-card">

        <div class="card-title"><span class="dot" style="background:var(--rose-deep)"></span>📝 今日待出稿事项

          <span class="cal-hint" style="margin-left:auto">${draftNotes.length} 条待处理</span>

        </div>

        <div class="hs-list home-draft-list">

          ${draftNotes.map(n => {

            const st = PUB_STATUS_MAP[normStatus(n.status)];

            const acctLabel = n.account && PUB_ACCOUNT_BADGE[n.account] ? `<span class="hs-acct-tag">${esc(PUB_ACCOUNT_BADGE[n.account])}</span>` : '';

            const dateLabel = n.deadline ? `截止 ${n.deadline}` : (n.date ? `出稿 ${n.date}` : '');

            const draftAction = n.cal === '芽芽Mochi' ? 'yy-draft-goto' : 'ry-draft-goto';
            const checkAction = n.cal === '芽芽Mochi' ? 'yy-draft-check' : 'ry-draft-check';
            return `<div class="hs-note home-draft-note" data-action="${draftAction}" data-date="${esc(n.date || '')}">

              <button class="home-draft-check" data-action="${checkAction}" data-id="${esc(n.id || '')}" title="标记状态" type="button">✓</button>

              <div class="home-draft-body">

                <div class="hs-note-top">

                  <span class="hs-status ${st ? st.cls : ''}"><span class="hs-ico">${st ? st.icon : ''}</span>${esc(st ? st.label : n.status)}</span>

                  <span class="hs-type-tag">${esc(n.type)}</span>

                  ${acctLabel}

                  <span class="home-draft-date">${esc(dateLabel)}</span>

                </div>

                <div class="hs-note-content">${esc(n.item || '未命名')}</div>

              </div>

            </div>`;

          }).join('')}

        </div>

      </div>`

    : '';



  $('#view-home').innerHTML = `

    ${alertBanner}

    <div class="grid cols-3" style="align-items:start">

      <div class="hero" style="grid-column:span 2">

        <span class="hero-sprout">${sproutSVG(56)}</span>

        <div class="clock" id="clock">--:--<span class="sec" id="clockSec">:--</span></div>

        <div class="hero-date" id="heroDate">${fmtDateCN(todayStr())} · ${now.getFullYear()}年</div>

        <div class="hero-quote" id="heroQuote">${esc(quote)}</div>

      </div>

      <div class="card weather-card" id="weatherCard" data-action="weather-open" style="cursor:pointer">

        <div class="card-title"><span class="dot" style="background:var(--blue)"></span>杭州天气

          <span class="weather-loc">📍杭州</span>

        </div>

        <div class="weather-body" id="weatherBody"><div class="weather-loading">天气加载中…</div></div>

      </div>

    </div>

    ${draftCard}

  `;

  tickClock();

  fetchWeather();

  updateHomeBadge();

}



function renderRuyi() {

  $('#view-ruyi').innerHTML = `

    <div class="card">

      <div class="card-title"><span class="dot" style="background:var(--rose-deep)"></span>📕 如意日历

        <span class="cal-hint" style="margin-left:auto">点日期记录当天出稿笔记</span>

      </div>

      ${renderRuyiCalendar()}

      <div class="hs-actions">

        <button class="btn btn-primary" data-action="ry-quick-add">＋ 记一笔出稿（含笔记名称 / 商单类型）</button>

      </div>

      <div class="hs-legend">

        <span class="hs-legend-item"><i class="hs-lg st-draft"></i>待出稿</span>

        <span class="hs-legend-item"><i class="hs-lg st-review"></i>审核中</span>

        <span class="hs-legend-item"><i class="hs-lg st-published"></i>已出稿</span>

      </div>

    </div>`;

}

function renderYaya() {

  $('#view-yaya').innerHTML = `

    <div class="card">

      <div class="card-title"><span class="dot" style="background:var(--rose-deep)"></span>🌱 芽芽日历

        <span class="cal-hint" style="margin-left:auto">点日期记录当天出稿笔记</span>

      </div>

      ${renderYayaCalendar()}

      <div class="hs-actions">

        <button class="btn btn-primary" data-action="yy-quick-add">＋ 记一笔出稿（含笔记名称 / 商单类型）</button>

      </div>

      <div class="hs-legend">

        <span class="hs-legend-item"><i class="hs-lg st-draft"></i>待出稿</span>

        <span class="hs-legend-item"><i class="hs-lg st-review"></i>审核中</span>

        <span class="hs-legend-item"><i class="hs-lg st-published"></i>已出稿</span>

      </div>

    </div>`;

}



/* 首页：小红书运营概览模块（首页下方第二个模块） */

/* ===================== 芽芽拉屎记录模块（独立页面，侧边栏第3） ===================== */

const BABY_TYPES = ['正常（金黄软糊）', '偏稀（水样）', '偏干（颗粒便）', '便秘', '腹泻', '绿便', '奶瓣', '其他'];



function babyDayPoops(ds) {

  return (S.baby.poops || []).filter(p => p.date === ds).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

}

function babyDayMeds(ds) {

  return (S.baby.meds || []).filter(p => p.date === ds).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

}

/* 旧版：用药信息挂在拉屎记录上（med / medMg 字段）。

   新版拆成独立的 meds 数组，这里把旧数据拆开迁移，保证历史不丢、且幂等（只跑一次）。 */

function migrateBabyState() {

  if (!S.baby) S.baby = { poops: [], meds: [] };

  if (!S.baby.meds) S.baby.meds = [];

  const poops = S.baby.poops || [];

  const old = poops.filter(p => p && 'med' in p);

  if (!old.length) return;

  old.forEach(p => {

    if (p.med && (parseFloat(p.medMg) || 0) > 0) {

      S.baby.meds.push({ id: uid(), date: p.date, time: p.time || '00:00', medMg: parseFloat(p.medMg) || 0, note: p.note || '' });

    }

    delete p.med; delete p.medMg;

  });

  save();

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

    const ps = (S.baby.poops || []).filter(p => p.date === ds);

    const ms = (S.baby.meds || []).filter(p => p.date === ds);

    const cnt = ps.length;

    const medMg = ms.reduce((s, r) => s + (parseFloat(r.medMg) || 0), 0);

    const mark = cnt ? `<span class="poop-badge">💩${cnt > 1 ? cnt : ''}</span>` : '';

    const medMark = ms.length ? `<span class="med-badge">💊${medMg > 0 ? medMg + 'mg' : ''}</span>` : '';

    cal += `<div class="cal-day ${cnt ? 'poop' : ''} ${ds === todayStr() ? 'today' : ''}" data-action="baby-pick" data-date="${ds}">

      <div class="d">${d}</div>${mark}${medMark}</div>`;

  }

  const dows = ['一', '二', '三', '四', '五', '六', '日'].map(w => `<div class="cal-dow">${w}</div>`).join('');

  return `<div class="cal-head">${y}年 ${m + 1}月</div><div class="cal">${dows}${cal}</div>`;

}



function openBabyDayModal(ds) {

  const poops = babyDayPoops(ds);

  const meds = babyDayMeds(ds);

  const dt = new Date(ds + 'T00:00:00');

  const ld = lunarStr(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());

  const now = new Date();

  const curTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const typeOpts = BABY_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');

  const poopList = poops.length ? `<div class="bp-list">` + poops.map(r => `

    <div class="bp-item">

      <span class="bp-time">${esc(r.time || '')}</span>

      <span class="bp-type">${esc(r.type || '')}</span>

      <span class="bp-note">${esc(r.note || '')}</span>

      <button class="icon-btn danger" data-action="baby-del-poop" data-id="${r.id}" title="删除这条">${icTrash()}</button>

    </div>`).join('') + `</div>` : '<div class="empty">这一天还没有拉屎记录</div>';

  const medList = meds.length ? `<div class="bp-list">` + meds.map(r => `

    <div class="bp-item">

      <span class="bp-time">${esc(r.time || '')}</span>

      <span class="bp-med">💊 ${r.medMg || 0}mg</span>

      <span class="bp-note">${esc(r.note || '')}</span>

      <button class="icon-btn danger" data-action="baby-del-med" data-id="${r.id}" title="删除这条">${icTrash()}</button>

    </div>`).join('') + `</div>` : '<div class="empty">这一天还没有用药记录</div>';

  const html = `

    <h3>👶 ${fmtDateCN(ds)} · ${ld}</h3>



    <div class="bp-group">

      <div class="bp-group-title">💩 拉屎记录</div>

      <div class="bp-add">

        <input class="input" type="time" id="bpTime" value="${curTime}" style="width:108px" />

        <select class="input" id="bpType" style="flex:1;min-width:120px">${typeOpts}</select>

        <input class="input" id="bpNote" placeholder="备注（可选）" style="flex:1;min-width:80px" />

      </div>

      <button class="btn btn-primary" style="width:100%;margin:4px 0 10px" data-action="baby-poop-save" data-date="${ds}">记一笔拉屎</button>

      ${poopList}

    </div>



    <div class="bp-group">

      <div class="bp-group-title">💊 用药记录</div>

      <div class="bp-med-row">

        <input class="input" type="time" id="bpMedTime" value="${curTime}" style="width:108px" />

        <input class="input" id="bpMedMg" type="number" min="0" step="0.1" placeholder="用药克数/mg" style="flex:1;min-width:100px" />

        <input class="input" id="bpMedNote" placeholder="备注（可选）" style="flex:1;min-width:80px" />

      </div>

      <button class="btn" style="width:100%;background:#7A6BFF;color:#fff" data-action="baby-med-save" data-date="${ds}">记一笔用药</button>

      ${medList}

    </div>`;

  openModal(html, 'baby');

}



function renderBaby() {

  const poops = S.baby.poops || [];

  const meds = S.baby.meds || [];

  const monthKey = `${babyCal.y}-${pad(babyCal.m + 1)}`;

  const curM = poops.filter(p => (p.date || '').slice(0, 7) === monthKey).length;

  const medM = meds.filter(p => (p.date || '').slice(0, 7) === monthKey).length;

  const medMgM = meds.filter(p => (p.date || '').slice(0, 7) === monthKey).reduce((s, r) => s + (parseFloat(r.medMg) || 0), 0);

  const last = poops.length ? poops.slice().sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))[0] : null;

  const summary = `<div class="rb-summary" style="margin:6px 0 2px">

    <span class="rb-sum">本月拉屎 <b>${curM}</b> 次</span>

    <span class="rb-sum">本月用药 <b>${medM}</b> 次 · <b>${medMgM}</b>mg</span>

    <span class="rb-sum">累计拉屎 <b>${poops.length}</b> 次</span>

    <span class="rb-sum">${last ? ('最近 ' + fmtDateCN(last.date) + ' ' + esc(last.time || '')) : '还没有记录'}</span>

  </div>`;



  /* 数据历史：按天倒序，拉屎与用药分开展示 */

  const byDay = {};

  poops.forEach(p => { const o = byDay[p.date] = byDay[p.date] || { poops: [], meds: [] }; o.poops.push(p); });

  meds.forEach(p => { const o = byDay[p.date] = byDay[p.date] || { poops: [], meds: [] }; o.meds.push(p); });

  const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  const hist = days.length ? days.map(ds => {

    const o = byDay[ds];

    const recs = o.poops.slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const medRecs = o.meds.slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const d = new Date(ds + 'T00:00:00');

    const wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];

    const medTotal = medRecs.reduce((s, r) => s + (parseFloat(r.medMg) || 0), 0);

    return `<div class="hist-day">

      <div class="hist-date">${ds.slice(5)} <span class="hist-wk">周${wk}</span>${recs.length ? ` <span class="hist-cnt">💩 ${recs.length} 次</span>` : ''}${medTotal > 0 ? ` <span class="hist-med">💊 ${medTotal}mg</span>` : ''}</div>

      <div class="hist-items">${recs.map(r => `<span class="hist-tag">${esc(r.time || '')} · ${esc(r.type || '')}</span>`).join('')}${medRecs.map(r => `<span class="hist-tag med">💊 ${esc(r.time || '')} · ${r.medMg || 0}mg</span>`).join('')}</div>

    </div>`;

  }).join('') : '<div class="empty">还没有记录，点日历上的日期记一笔吧 💩 / 💊</div>';



  $('#view-baby').innerHTML = `

    <div class="card">

      <div class="card-title"><span class="dot" style="background:var(--rose)"></span>👶 女鹅记录

        <span style="margin-left:auto;display:flex;align-items:center;gap:10px">

          <span class="cal-hint">点日期记录当天拉屎 / 用药</span>

          <button class="icon-btn btn-sm" data-action="baby-cal-prev">${icPrev()}</button>

          <button class="icon-btn btn-sm" data-action="baby-cal-next">${icNext()}</button>

        </span>

      </div>

      ${summary}

      ${renderBabyCalendar()}

      <div class="hist-block">

        <div class="hist-head">📅 记录历史</div>

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



/* ===================== 如意日历（出稿笔记 · 万年历含农历） ===================== */

const PUB_TYPES = ['水下置换', '水下探店', '水下直发', '拍单置换', '蒲公英商单', '众测招募', '探店招募'];

/* 需填写「订单金额」的类型（水下探店可填可不填，其余为必显） */

const PUB_ORD_TYPES = ['水下直发', '水下探店', '探店招募', '众测招募'];

const PUB_ACCOUNTS = ['芽芽Mochi', '常如意i'];

const PUB_ACCOUNT_BADGE = { '芽芽Mochi': '芽', '常如意i': '常' };

const PUB_STATUSES = [

  { key: 'draft',     label: '待出稿', cls: 'st-draft',     icon: '●' },

  { key: 'published', label: '已出稿', cls: 'st-published', icon: '●' },

  { key: 'review',    label: '审核中', cls: 'st-review',    icon: '●' }

];

const PUB_STATUS_MAP = Object.fromEntries(PUB_STATUSES.map(s => [s.label, s]));

/* 旧数据兼容：待审核 → 审核中；待初稿（改名前）→ 待出稿 */

const STATUS_RENAME = { '待审核': '审核中', '待初稿': '待出稿' };

function normStatus(s) { return STATUS_RENAME[s] || s; }

/* 状态优先级：未完成的排在前面，决定当天单元格的底色 */

const PUB_STATUS_ORDER = { '待出稿': 0, '审核中': 1, '已出稿': 2 };

let ruyiCal = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: todayStr() };



/* 今日待出稿提醒：deadline 为今天且状态仍为待出稿 */

function ruyiPendingToday() {

  const ds = todayStr();

  return (S.ruyiNotes || []).filter(n => n.deadline === ds && normStatus(n.status) === '待出稿');

}

function ruyiPendingCount() { return ruyiPendingToday().length; }

function ruyiUnreadPending() {

  const cur = ruyiPendingCount();

  const read = (S.home && S.home.hsReadCount) || 0;

  return Math.max(0, cur - read);

}

function updateHomeBadge() {

  const cur = totalPendingCount();

  const read = (S.home && S.home.hsReadCount) || 0;

  const unread = Math.max(0, cur - read);

  const el = $('#navBadgeHome');

  if (el) el.style.display = unread > 0 ? 'inline-flex' : 'none';

  return unread;

}



function ruyiDayNotes(ds) { return (S.ruyiNotes || []).filter(n => n.date === ds); }

function lunarDayShort(y, m, d) {

  const L = solarToLunar(y, m, d);

  return (L.isLeap ? '闰' : '') + LUNAR_DAYS[L.day - 1];

}

/* 取当天笔记中"最未完成"的状态，作为单元格底色 */

function primaryStatusCls(notes) {

  if (!notes.length) return '';

  const sorted = notes.slice().sort((a, b) => (PUB_STATUS_ORDER[a.status] ?? 9) - (PUB_STATUS_ORDER[b.status] ?? 9));

  const st = PUB_STATUS_MAP[normStatus(sorted[0].status)];

  return st ? st.cls : '';

}



function renderRuyiCalendar() {

  const { y, m } = ruyiCal;

  const first = new Date(y, m, 1);

  const startDow = (first.getDay() + 6) % 7; /* 周一为每周第一天 */

  const daysIn = new Date(y, m + 1, 0).getDate();

  /* 月度合计：到手金额 + 订单金额，所有状态都计入 */

  const monthPrefix = `${y}-${pad(m + 1)}`;

  const monthTotal = (S.ruyiNotes || []).reduce((sum, n) => {

    if (!n.date || !n.date.startsWith(monthPrefix)) return sum;

    if (n.type === '蒲公英商单') return sum + (n.net || 0);

    if (PUB_ORD_TYPES.includes(n.type)) return sum + (n.net != null ? n.net : (n.orderAmount || 0));

    return sum;

  }, 0);

  let cal = '';

  for (let i = 0; i < startDow; i++) cal += '<div class="cal-day out"></div>';

  for (let d = 1; d <= daysIn; d++) {

    const ds = `${y}-${pad(m + 1)}-${pad(d)}`;

    const notes = ruyiDayNotes(ds);

    const isToday = ds === todayStr();

    const stCls = notes.length ? primaryStatusCls(notes) : '';

    const ld = lunarDayShort(y, m + 1, d);

    /* 桌面端：恢复大封面块（账号徽标 + 物品名称 + 金额） */

    const dayNotes = notes.slice().sort((a, b) => (PUB_STATUS_ORDER[a.status] ?? 9) - (PUB_STATUS_ORDER[b.status] ?? 9));

    const top = dayNotes[0];

    const st = top ? PUB_STATUS_MAP[normStatus(top.status)] : null;

    const badge = st ? `<span class="hs-badge ${st.cls}"><span class="hs-ico">${st.icon}</span>${esc(st.label)}</span>` : '';

    const acctBadge = top && top.account && PUB_ACCOUNT_BADGE[top.account] ? `<span class="hs-cover-acct">${esc(PUB_ACCOUNT_BADGE[top.account])}</span>` : '';

    /* 桌面端：优先显示「到手金额」，旧数据（无 net 字段）回退订单金额 */

    const topMoney = top ? ((top.net != null && top.net !== 0) ? top.net : (top.orderAmount || 0)) : 0;

    let coverAmt = topMoney ? money(topMoney) : '';

    const itemText = top && top.item ? esc(top.item) : '未命名';

    const lenCls = top && top.item ? `len-${Math.min(top.item.length, 6)}` : 'len-4';

    const cover = top ? `<div class="hs-cover ${lenCls} ${top.item ? '' : 'no-item'}">${acctBadge}<span class="hs-cover-text">${itemText}</span></div>` : '';

    const amtRow = coverAmt ? `<div class="hs-amt-row ${stCls}"><span class="hs-amt">${coverAmt}</span></div>` : '';

    /* 手机端简化：只显示一条，取物品前 2 个字；金额（到手）放在日期右上角 */

    const topSt = top ? PUB_STATUS_MAP[normStatus(top.status)] : null;

    const dayAmt = topMoney ? money(topMoney) : '';

    const mobileChip = top ? `<div class="mchip-line"><i class="mchip-dot ${topSt ? topSt.cls : ''}"></i><span class="mchip-txt">${esc((top.item || '未命名').slice(0, 2))}</span></div>` : '';

    const amtHtml = dayAmt ? `<span class="hs-day-amt" title="到手金额">${esc(dayAmt)}</span>` : '';

    cal += `<div class="cal-day hs-day ${stCls} ${isToday ? 'today' : ''} ${ds === ruyiCal.sel ? 'sel' : ''}" data-action="ry-pick" data-date="${ds}">

      <div class="d">${d}${amtHtml}</div>

      <div class="hs-lunar">${ld}</div>

      ${cover}

      ${amtRow}

      ${badge}

      ${mobileChip}

    </div>`;

  }

  const dows = ['一', '二', '三', '四', '五', '六', '日'].map(w => `<div class="cal-dow">${w}</div>`).join('');

  return `<div class="cal-head">

      <span>${y}年 ${m + 1}月</span>

      <span class="cal-month-total" title="到手金额 + 订单金额合计（所有状态）">${money(monthTotal)}</span>

    </div>

    <div class="cal-nav">

      <button class="icon-btn btn-sm" data-action="ry-cal-prev-year" title="上一年">«</button>

      <button class="icon-btn btn-sm" data-action="ry-cal-prev" title="上个月">${icPrev()}</button>

      <button class="btn btn-sm btn-ghost" data-action="ry-cal-today">今天</button>

      <button class="icon-btn btn-sm" data-action="ry-cal-next" title="下个月">${icNext()}</button>

      <button class="icon-btn btn-sm" data-action="ry-cal-next-year" title="下一年">»</button>

    </div>

    <div class="cal">${dows}${cal}</div>`;

}



/* 把已有笔记填充到弹窗表单并进入「编辑」状态（关闭今/点 ✏️ 与自动回填复用） */

function fillRuyiEdit(n) {

  if (!n) return;

  $('#hsEditId').value = n.id || '';

  $('#hsItem').value = n.item || '';

  $('#hsType').value = n.type || PUB_TYPES[0];

  $('#hsStatus').value = normStatus(n.status) || '待出稿';

  $('#hsAccount').value = n.account || '常如意i';

  $('#hsDate').value = n.date || '';

  $('#hsDeadline').value = n.deadline || '';

  $('#hsQuote').value = (n.quote != null && n.quote !== 0) ? n.quote : '';

  $('#hsRebatePct').value = (n.rebatePct != null && n.rebatePct !== 0) ? n.rebatePct : '';

  $('#hsOrderAmount').value = (n.orderAmount != null && n.orderAmount !== 0) ? n.orderAmount : '';

  $('#hsSaveBtn').textContent = '💾 保存修改';

  $('#hsCancelEditBtn').style.display = 'block';

  $('#hsType').dispatchEvent(new Event('change'));

  if ($('#hsQuote')) $('#hsQuote').dispatchEvent(new Event('input'));

  if ($('#hsOrderAmount')) $('#hsOrderAmount').dispatchEvent(new Event('input'));

}

function openRuyiDayModal(ds) {

  const dt = new Date(ds + 'T00:00:00');

  const ld = lunarStr(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());

  const notes = ruyiDayNotes(ds).slice().sort((a, b) => (b.id || '').localeCompare(a.id || ''));

  const typeOpts = PUB_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');

  const statusOpts = PUB_STATUSES.map(s => `<option value="${s.label}">${s.label}</option>`).join('');

  const accountOpts = PUB_ACCOUNTS.map(a => `<option value="${a}">${a}</option>`).join('');

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

    } else if (PUB_ORD_TYPES.includes(n.type) && (n.orderAmount != null && n.orderAmount !== 0)) {

      moneyBlock = `<div class="hs-money">

        <span>订单金额 ${money(n.orderAmount || 0)}</span>

        <span>手续费 ${money(n.fee || 0)}</span>

        <span class="hs-net">到手 ${money(n.net || 0)}</span>

      </div>`;

    }

    const st = PUB_STATUS_MAP[normStatus(n.status)];

    const acctLabel = n.account && PUB_ACCOUNT_BADGE[n.account] ? `<span class="hs-acct-tag">${esc(PUB_ACCOUNT_BADGE[n.account])}</span>` : '';

    return `<div class="hs-note">

      <div class="hs-note-top">

        <span class="hs-type-tag">${esc(n.type)}</span>

        ${acctLabel}

        <span class="hs-status ${st ? st.cls : ''}"><span class="hs-ico">${st ? st.icon : ''}</span>${esc(st ? st.label : n.status)}</span>

        <button class="icon-btn" data-action="ry-note-edit" data-id="${n.id}" title="编辑">✏️</button>

        <button class="icon-btn danger" data-action="ry-note-del" data-id="${n.id}" title="删除">${icTrash()}</button>

      </div>

      ${n.deadline ? `<div class="hs-note-meta">📅 发布最晚：${esc(n.deadline)}</div>` : ''}

      ${moneyBlock}

    </div>`;

  }).join('') + `</div>` : '<div class="empty">这一天还没有出稿笔记，新增一笔吧 🍠</div>';



  const html = `

    <h3>📕 如意日历 · ${fmtDateCN(ds)} · ${ld}</h3>

    <div class="hs-add">

      <input type="hidden" id="hsEditId" />

      <input class="input" id="hsItem" placeholder="物品名称（将作为封面显示在日历当天）" />

      <div class="hs-row">

        <select class="input" id="hsType">${typeOpts}</select>

        <select class="input" id="hsStatus">${statusOpts}</select>

      </div>

      <div class="hs-row">

        <select class="input" id="hsAccount">${accountOpts}</select>

      </div>

      <div class="hs-deadline-row">

        <label>归属日期</label>

        <input class="input" id="hsDate" type="date" value="${ds}" />

      </div>

      <div class="hs-deadline-row">

        <label>发布日期（最晚）</label>

        <input class="input" id="hsDeadline" type="date" />

      </div>

      <div class="hs-amounts" id="hsAmounts" style="display:none">

        <div id="hsPgArea">

          <div class="hs-amount-row"><label>图文报价(¥)</label><input class="input" id="hsQuote" type="number" min="0" step="0.01" placeholder="0" /></div>

          <div class="hs-amount-row"><label>返点比例(%)</label><input class="input" id="hsRebatePct" type="number" step="0.01" placeholder="如 10 表示10%" /></div>

          <div class="hs-calc">

            <span>手续费(10%)：<b id="hsFee">¥0</b></span>

            <span>返点金额：<b id="hsRebateAmt">-¥0</b></span>

            <span class="hs-net">到手金额：<b id="hsNet">¥0</b></span>

          </div>

        </div>

        <div id="hsOrderArea" style="display:none">

          <div class="hs-amount-row"><label>订单金额(¥)</label><input class="input" id="hsOrderAmount" type="number" min="0" step="0.01" placeholder="0" /></div>

          <div class="hs-calc">

            <span>手续费(10%)：<b id="hsOrderFee">¥0</b></span>

            <span class="hs-net">到手金额：<b id="hsOrderNet">¥0</b></span>

          </div>

        </div>

      </div>

      <button class="btn btn-primary" id="hsSaveBtn" style="width:100%;margin-top:10px" data-action="ry-note-save" data-date="${ds}">+ 保存出稿笔记</button>

      <button class="btn btn-ghost" id="hsCancelEditBtn" style="width:100%;margin-top:8px;display:none" data-action="ry-note-cancel-edit" data-date="${ds}">取消编辑</button>

    </div>

    <div class="hs-block-title">📝 当天出稿笔记（${notes.length}）</div>

    ${list}`;

  openModal(html, 'ruyi');

  const typeSel = $('#hsType');

  const amounts = $('#hsAmounts');

  const toggleAmounts = () => {

    const t = typeSel.value;

    amounts.style.display = (t === '蒲公英商单' || PUB_ORD_TYPES.includes(t)) ? 'block' : 'none';

    const pg = $('#hsPgArea'), ord = $('#hsOrderArea');

    if (pg) pg.style.display = (t === '蒲公英商单') ? 'block' : 'none';

    if (ord) ord.style.display = (PUB_ORD_TYPES.includes(t)) ? 'block' : 'none';

  };

  typeSel.addEventListener('change', toggleAmounts);

  toggleAmounts();

  const recompute = () => {

    const t = typeSel.value;

    const feeEl = $('#hsFee'), rebateEl = $('#hsRebateAmt'), netEl = $('#hsNet');

    const orderFeeEl = $('#hsOrderFee'), orderNetEl = $('#hsOrderNet');

    if (t === '蒲公英商单') {

      const q = Math.max(0, parseFloat($('#hsQuote').value || '0') || 0);

      const pct = parseFloat($('#hsRebatePct').value || '0') || 0;

      const fee = Math.round(q * 0.1 * 100) / 100;

      const rebate = -Math.round(q * pct / 100 * 100) / 100; /* 返点为支出，记为负数 */

      const net = Math.round((q - fee + rebate) * 100) / 100;

      if (feeEl) feeEl.textContent = money(fee);

      if (rebateEl) rebateEl.textContent = money(rebate);

      if (netEl) netEl.textContent = money(net);

  if (orderFeeEl) orderFeeEl.textContent = money(0);

      if (orderNetEl) orderNetEl.textContent = money(0);

    } else if (PUB_ORD_TYPES.includes(t)) {

      /* 订单类商单（含众测）：手续费固定为订单金额 10%，到手 = 订单金额 - 手续费 */

      const o = Math.max(0, parseFloat($('#hsOrderAmount').value || '0') || 0);

      const fee = Math.round(o * 0.1 * 100) / 100;

      const net = Math.round((o - fee) * 100) / 100;

      if (orderFeeEl) orderFeeEl.textContent = money(fee);

      if (orderNetEl) orderNetEl.textContent = money(net);

      if (feeEl) feeEl.textContent = money(0);

      if (rebateEl) rebateEl.textContent = money(0);

      if (netEl) netEl.textContent = money(0);

    } else {

      if (feeEl) feeEl.textContent = money(0);

      if (rebateEl) rebateEl.textContent = money(0);

      if (netEl) netEl.textContent = money(0);

      if (orderFeeEl) orderFeeEl.textContent = money(0);

      if (orderNetEl) orderNetEl.textContent = money(0);

    }

  };

  $('#hsQuote').addEventListener('input', recompute);

  $('#hsRebatePct').addEventListener('input', recompute);

  $('#hsOrderAmount').addEventListener('input', recompute);

  /* 关键：当天已有记录 → 自动进入「编辑第一条」模式（填充已记录事项）；无记录 → 空白新增界面 */

  if (notes.length > 0) {

    fillRuyiEdit(notes[0]);

  } else {

    toggleAmounts();

    recompute();

    $('#hsType').value = PUB_TYPES.includes('蒲公英商单') ? '蒲公英商单' : PUB_TYPES[0];

    $('#hsType').dispatchEvent(new Event('change'));

  }

}




/* ===================== 芽芽日历（小号芽芽Mochi · 出稿笔记） ===================== */
let yayaCal = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: todayStr() };



/* 今日待出稿提醒：deadline 为今天且状态仍为待出稿 */

function yayaPendingToday() {

  const ds = todayStr();

  return (S.yayaNotes || []).filter(n => n.deadline === ds && normStatus(n.status) === '待出稿');

}

function yayaPendingCount() { return yayaPendingToday().length; }

function yayaUnreadPending() {

  const cur = yayaPendingCount();

  const read = (S.home && S.home.hsReadCount) || 0;

  return Math.max(0, cur - read);

}

/* updateHomeBadge 已在上方统一实现（合并两个日历的未读待出稿） */



function yayaDayNotes(ds) { return (S.yayaNotes || []).filter(n => n.date === ds); }

function lunarDayShort(y, m, d) {

  const L = solarToLunar(y, m, d);

  return (L.isLeap ? '闰' : '') + LUNAR_DAYS[L.day - 1];

}

/* 取当天笔记中"最未完成"的状态，作为单元格底色 */

function primaryStatusCls(notes) {

  if (!notes.length) return '';

  const sorted = notes.slice().sort((a, b) => (PUB_STATUS_ORDER[a.status] ?? 9) - (PUB_STATUS_ORDER[b.status] ?? 9));

  const st = PUB_STATUS_MAP[normStatus(sorted[0].status)];

  return st ? st.cls : '';

}



function renderYayaCalendar() {

  const { y, m } = yayaCal;

  const first = new Date(y, m, 1);

  const startDow = (first.getDay() + 6) % 7; /* 周一为每周第一天 */

  const daysIn = new Date(y, m + 1, 0).getDate();

  /* 月度合计：到手金额 + 订单金额，所有状态都计入 */

  const monthPrefix = `${y}-${pad(m + 1)}`;

  const monthTotal = (S.yayaNotes || []).reduce((sum, n) => {

    if (!n.date || !n.date.startsWith(monthPrefix)) return sum;

    if (n.type === '蒲公英商单') return sum + (n.net || 0);

    if (PUB_ORD_TYPES.includes(n.type)) return sum + (n.net != null ? n.net : (n.orderAmount || 0));

    return sum;

  }, 0);

  let cal = '';

  for (let i = 0; i < startDow; i++) cal += '<div class="cal-day out"></div>';

  for (let d = 1; d <= daysIn; d++) {

    const ds = `${y}-${pad(m + 1)}-${pad(d)}`;

    const notes = yayaDayNotes(ds);

    const isToday = ds === todayStr();

    const stCls = notes.length ? primaryStatusCls(notes) : '';

    const ld = lunarDayShort(y, m + 1, d);

    /* 桌面端：恢复大封面块（账号徽标 + 物品名称 + 金额） */

    const dayNotes = notes.slice().sort((a, b) => (PUB_STATUS_ORDER[a.status] ?? 9) - (PUB_STATUS_ORDER[b.status] ?? 9));

    const top = dayNotes[0];

    const st = top ? PUB_STATUS_MAP[normStatus(top.status)] : null;

    const badge = st ? `<span class="hs-badge ${st.cls}"><span class="hs-ico">${st.icon}</span>${esc(st.label)}</span>` : '';

    const acctBadge = top && top.account && PUB_ACCOUNT_BADGE[top.account] ? `<span class="hs-cover-acct">${esc(PUB_ACCOUNT_BADGE[top.account])}</span>` : '';

    /* 桌面端：优先显示「到手金额」，旧数据（无 net 字段）回退订单金额 */

    const topMoney = top ? ((top.net != null && top.net !== 0) ? top.net : (top.orderAmount || 0)) : 0;

    let coverAmt = topMoney ? money(topMoney) : '';

    const itemText = top && top.item ? esc(top.item) : '未命名';

    const lenCls = top && top.item ? `len-${Math.min(top.item.length, 6)}` : 'len-4';

    const cover = top ? `<div class="hs-cover ${lenCls} ${top.item ? '' : 'no-item'}">${acctBadge}<span class="hs-cover-text">${itemText}</span></div>` : '';

    const amtRow = coverAmt ? `<div class="hs-amt-row ${stCls}"><span class="hs-amt">${coverAmt}</span></div>` : '';

    /* 手机端简化：只显示一条，取物品前 2 个字；金额（到手）放在日期右上角 */

    const topSt = top ? PUB_STATUS_MAP[normStatus(top.status)] : null;

    const dayAmt = topMoney ? money(topMoney) : '';

    const mobileChip = top ? `<div class="mchip-line"><i class="mchip-dot ${topSt ? topSt.cls : ''}"></i><span class="mchip-txt">${esc((top.item || '未命名').slice(0, 2))}</span></div>` : '';

    const amtHtml = dayAmt ? `<span class="hs-day-amt" title="到手金额">${esc(dayAmt)}</span>` : '';

    cal += `<div class="cal-day hs-day ${stCls} ${isToday ? 'today' : ''} ${ds === yayaCal.sel ? 'sel' : ''}" data-action="yy-pick" data-date="${ds}">

      <div class="d">${d}${amtHtml}</div>

      <div class="hs-lunar">${ld}</div>

      ${cover}

      ${amtRow}

      ${badge}

      ${mobileChip}

    </div>`;

  }

  const dows = ['一', '二', '三', '四', '五', '六', '日'].map(w => `<div class="cal-dow">${w}</div>`).join('');

  return `<div class="cal-head">

      <span>${y}年 ${m + 1}月</span>

      <span class="cal-month-total" title="到手金额 + 订单金额合计（所有状态）">${money(monthTotal)}</span>

    </div>

    <div class="cal-nav">

      <button class="icon-btn btn-sm" data-action="yy-cal-prev-year" title="上一年">«</button>

      <button class="icon-btn btn-sm" data-action="yy-cal-prev" title="上个月">${icPrev()}</button>

      <button class="btn btn-sm btn-ghost" data-action="yy-cal-today">今天</button>

      <button class="icon-btn btn-sm" data-action="yy-cal-next" title="下个月">${icNext()}</button>

      <button class="icon-btn btn-sm" data-action="yy-cal-next-year" title="下一年">»</button>

    </div>

    <div class="cal">${dows}${cal}</div>`;

}



/* 把已有笔记填充到弹窗表单并进入「编辑」状态（关闭今/点 ✏️ 与自动回填复用） */

function fillYayaEdit(n) {

  if (!n) return;

  $('#hsEditId').value = n.id || '';

  $('#hsItem').value = n.item || '';

  $('#hsType').value = n.type || PUB_TYPES[0];

  $('#hsStatus').value = normStatus(n.status) || '待出稿';

  $('#hsAccount').value = n.account || '芽芽Mochi';

  $('#hsDate').value = n.date || '';

  $('#hsDeadline').value = n.deadline || '';

  $('#hsQuote').value = (n.quote != null && n.quote !== 0) ? n.quote : '';

  $('#hsRebatePct').value = (n.rebatePct != null && n.rebatePct !== 0) ? n.rebatePct : '';

  $('#hsOrderAmount').value = (n.orderAmount != null && n.orderAmount !== 0) ? n.orderAmount : '';

  $('#hsSaveBtn').textContent = '💾 保存修改';

  $('#hsCancelEditBtn').style.display = 'block';

  $('#hsType').dispatchEvent(new Event('change'));

  if ($('#hsQuote')) $('#hsQuote').dispatchEvent(new Event('input'));

  if ($('#hsOrderAmount')) $('#hsOrderAmount').dispatchEvent(new Event('input'));

}

function openYayaDayModal(ds) {

  const dt = new Date(ds + 'T00:00:00');

  const ld = lunarStr(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());

  const notes = yayaDayNotes(ds).slice().sort((a, b) => (b.id || '').localeCompare(a.id || ''));

  const typeOpts = PUB_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');

  const statusOpts = PUB_STATUSES.map(s => `<option value="${s.label}">${s.label}</option>`).join('');

  const accountOpts = PUB_ACCOUNTS.map(a => `<option value="${a}">${a}</option>`).join('');

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

    } else if (PUB_ORD_TYPES.includes(n.type) && (n.orderAmount != null && n.orderAmount !== 0)) {

      moneyBlock = `<div class="hs-money">

        <span>订单金额 ${money(n.orderAmount || 0)}</span>

        <span>手续费 ${money(n.fee || 0)}</span>

        <span class="hs-net">到手 ${money(n.net || 0)}</span>

      </div>`;

    }

    const st = PUB_STATUS_MAP[normStatus(n.status)];

    const acctLabel = n.account && PUB_ACCOUNT_BADGE[n.account] ? `<span class="hs-acct-tag">${esc(PUB_ACCOUNT_BADGE[n.account])}</span>` : '';

    return `<div class="hs-note">

      <div class="hs-note-top">

        <span class="hs-type-tag">${esc(n.type)}</span>

        ${acctLabel}

        <span class="hs-status ${st ? st.cls : ''}"><span class="hs-ico">${st ? st.icon : ''}</span>${esc(st ? st.label : n.status)}</span>

        <button class="icon-btn" data-action="yy-note-edit" data-id="${n.id}" title="编辑">✏️</button>

        <button class="icon-btn danger" data-action="yy-note-del" data-id="${n.id}" title="删除">${icTrash()}</button>

      </div>

      ${n.deadline ? `<div class="hs-note-meta">📅 发布最晚：${esc(n.deadline)}</div>` : ''}

      ${moneyBlock}

    </div>`;

  }).join('') + `</div>` : '<div class="empty">这一天还没有出稿笔记，新增一笔吧 🍠</div>';



  const html = `

    <h3>🌱 芽芽日历 · ${fmtDateCN(ds)} · ${ld}</h3>

    <div class="hs-add">

      <input type="hidden" id="hsEditId" />

      <input class="input" id="hsItem" placeholder="物品名称（将作为封面显示在日历当天）" />

      <div class="hs-row">

        <select class="input" id="hsType">${typeOpts}</select>

        <select class="input" id="hsStatus">${statusOpts}</select>

      </div>

      <div class="hs-row">

        <select class="input" id="hsAccount">${accountOpts}</select>

      </div>

      <div class="hs-deadline-row">

        <label>归属日期</label>

        <input class="input" id="hsDate" type="date" value="${ds}" />

      </div>

      <div class="hs-deadline-row">

        <label>发布日期（最晚）</label>

        <input class="input" id="hsDeadline" type="date" />

      </div>

      <div class="hs-amounts" id="hsAmounts" style="display:none">

        <div id="hsPgArea">

          <div class="hs-amount-row"><label>图文报价(¥)</label><input class="input" id="hsQuote" type="number" min="0" step="0.01" placeholder="0" /></div>

          <div class="hs-amount-row"><label>返点比例(%)</label><input class="input" id="hsRebatePct" type="number" step="0.01" placeholder="如 10 表示10%" /></div>

          <div class="hs-calc">

            <span>手续费(10%)：<b id="hsFee">¥0</b></span>

            <span>返点金额：<b id="hsRebateAmt">-¥0</b></span>

            <span class="hs-net">到手金额：<b id="hsNet">¥0</b></span>

          </div>

        </div>

        <div id="hsOrderArea" style="display:none">

          <div class="hs-amount-row"><label>订单金额(¥)</label><input class="input" id="hsOrderAmount" type="number" min="0" step="0.01" placeholder="0" /></div>

          <div class="hs-calc">

            <span>手续费(10%)：<b id="hsOrderFee">¥0</b></span>

            <span class="hs-net">到手金额：<b id="hsOrderNet">¥0</b></span>

          </div>

        </div>

      </div>

      <button class="btn btn-primary" id="hsSaveBtn" style="width:100%;margin-top:10px" data-action="yy-note-save" data-date="${ds}">+ 保存出稿笔记</button>

      <button class="btn btn-ghost" id="hsCancelEditBtn" style="width:100%;margin-top:8px;display:none" data-action="yy-note-cancel-edit" data-date="${ds}">取消编辑</button>

    </div>

    <div class="hs-block-title">📝 当天出稿笔记（${notes.length}）</div>

    ${list}`;

  openModal(html, 'yaya');

  const typeSel = $('#hsType');

  const amounts = $('#hsAmounts');

  const toggleAmounts = () => {

    const t = typeSel.value;

    amounts.style.display = (t === '蒲公英商单' || PUB_ORD_TYPES.includes(t)) ? 'block' : 'none';

    const pg = $('#hsPgArea'), ord = $('#hsOrderArea');

    if (pg) pg.style.display = (t === '蒲公英商单') ? 'block' : 'none';

    if (ord) ord.style.display = (PUB_ORD_TYPES.includes(t)) ? 'block' : 'none';

  };

  typeSel.addEventListener('change', toggleAmounts);

  toggleAmounts();

  const recompute = () => {

    const t = typeSel.value;

    const feeEl = $('#hsFee'), rebateEl = $('#hsRebateAmt'), netEl = $('#hsNet');

    const orderFeeEl = $('#hsOrderFee'), orderNetEl = $('#hsOrderNet');

    if (t === '蒲公英商单') {

      const q = Math.max(0, parseFloat($('#hsQuote').value || '0') || 0);

      const pct = parseFloat($('#hsRebatePct').value || '0') || 0;

      const fee = Math.round(q * 0.1 * 100) / 100;

      const rebate = -Math.round(q * pct / 100 * 100) / 100; /* 返点为支出，记为负数 */

      const net = Math.round((q - fee + rebate) * 100) / 100;

      if (feeEl) feeEl.textContent = money(fee);

      if (rebateEl) rebateEl.textContent = money(rebate);

      if (netEl) netEl.textContent = money(net);

  if (orderFeeEl) orderFeeEl.textContent = money(0);

      if (orderNetEl) orderNetEl.textContent = money(0);

    } else if (PUB_ORD_TYPES.includes(t)) {

      /* 订单类商单（含众测）：手续费固定为订单金额 10%，到手 = 订单金额 - 手续费 */

      const o = Math.max(0, parseFloat($('#hsOrderAmount').value || '0') || 0);

      const fee = Math.round(o * 0.1 * 100) / 100;

      const net = Math.round((o - fee) * 100) / 100;

      if (orderFeeEl) orderFeeEl.textContent = money(fee);

      if (orderNetEl) orderNetEl.textContent = money(net);

      if (feeEl) feeEl.textContent = money(0);

      if (rebateEl) rebateEl.textContent = money(0);

      if (netEl) netEl.textContent = money(0);

    } else {

      if (feeEl) feeEl.textContent = money(0);

      if (rebateEl) rebateEl.textContent = money(0);

      if (netEl) netEl.textContent = money(0);

      if (orderFeeEl) orderFeeEl.textContent = money(0);

      if (orderNetEl) orderNetEl.textContent = money(0);

    }

  };

  $('#hsQuote').addEventListener('input', recompute);

  $('#hsRebatePct').addEventListener('input', recompute);

  $('#hsOrderAmount').addEventListener('input', recompute);

  /* 关键：当天已有记录 → 自动进入「编辑第一条」模式（填充已记录事项）；无记录 → 空白新增界面 */

  if (notes.length > 0) {

    fillYayaEdit(notes[0]);

  } else {

    toggleAmounts();

    recompute();

    $('#hsType').value = PUB_TYPES.includes('蒲公英商单') ? '蒲公英商单' : PUB_TYPES[0];

    $('#hsType').dispatchEvent(new Event('change'));

  }

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

  const url = 'https://api.open-meteo.com/v1/forecast?latitude=30.2741&longitude=120.1551&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=8';

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

  const fc = data.days.slice(1, 4).map(x => {

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

function openWeatherModal() {

  const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  let data = null;

  try {

    const cached = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null');

    if (cached && cached.data) data = cached.data;

  } catch (e) {}

  if (!data || !data.days || !data.days.length) {

    toast('天气数据还没加载好，请稍后再点', 'warn');

    fetchWeather();

    return;

  }

  const cur = data.cur, c = wEmoji(cur.code);

  const rows = data.days.slice(0, 8).map((x, i) => {

    const dt = new Date(x.dt + 'T00:00:00');

    const e = wEmoji(x.code);

    const label = i === 0 ? '今天' : wk[dt.getDay()];

    return `<div class="w7-row">

      <div class="w7-date"><b>${label}</b><span>${x.dt.slice(5)}</span></div>

      <div class="w7-ico">${e[0]}</div>

      <div class="w7-desc">${e[1]}</div>

      <div class="w7-temp">${x.lo}° / ${x.hi}°</div>

    </div>`;

  }).join('');

  openModal(`<h3>🌤 杭州近7日天气预报</h3>

    <div class="w7-cur">

      <div class="w7-cur-ico">${c[0]}</div>

      <div>

        <div class="w7-cur-t">当前 ${cur.t}° · ${c[1]}</div>

        <div class="w7-cur-sub">湿度 ${cur.hum}% · 风速 ${cur.wind}km/h</div>

      </div>

    </div>

    <div class="w7-list">${rows}</div>`);

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

  const t = editing || { type: 'note', account: XHS_ACCOUNTS[0], name: '', date: todayStr(), cover: '', items: [{ id: uid(), desc: '', amount: '' }] };

  const type = t.type || 'note';

  const acctOpts = XHS_ACCOUNTS.map(a => `<option value="${a}"${a === (t.account || XHS_ACCOUNTS[0]) ? ' selected' : ''}>${a}</option>`).join('');

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

    <div class="field"><label>发布账号</label><select class="input" id="neAccount">${acctOpts}</select></div>

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

  const acctOpts = XHS_ACCOUNTS.map(a => `<option value="${a}">${a}</option>`).join('');

  openModal(`

    <h3>📈 记录当前数据</h3>

    <p class="modal-tip">填「当前的累计总数」。只改动的那一项就填，没动的留空——会自动沿用上一次的数值，不会变成 0。</p>

    <div class="field"><label>账号</label><select class="input" id="xAccount">${acctOpts}</select></div>

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

function openXhsLimitModal(account) {

  const acct = account || XHS_ACCOUNTS[0];

  const L = xhsLimit(acct);

  openModal(`

    <h3>🚫 ${esc(acct)} · 限流笔记备注</h3>

    <div class="field"><label>限流笔记数量（篇）</label><input class="input" id="xLimitCount" type="number" min="0" value="${L.count || 0}" /></div>

    <div class="field"><label>限流笔记名称（用顿号/逗号分隔）</label><textarea class="textarea" id="xLimitNames" placeholder="如：周末去哪儿 Vol.3、芽芽辅食记">${esc(L.names || '')}</textarea></div>

    <div class="modal-actions">

      <button class="btn btn-ghost" data-action="close-modal">取消</button>

      <button class="btn btn-primary" data-action="xhs-save-limit" data-account="${esc(acct)}">保存</button>

    </div>`);

}

/* 小红书：待返款 / 蒲公英商单 */

function openRebrateModal(presetSrc) {

  const acctOpts = XHS_ACCOUNTS.map(a => `<option value="${a}">${a}</option>`).join('');

  openModal(`

    <h3>💸 添加待返款</h3>

    <div class="field"><label>发布账号</label><select class="input" id="rbAccount">${acctOpts}</select></div>

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

const XHS_ACCOUNTS = ['常如意i', '芽芽Mochi'];

const XHS_ACCOUNT_BADGE = { '常如意i': '常', '芽芽Mochi': '芽' };

/* 账号 themed 底色：用于统计卡片区分 */

const XHS_ACCOUNT_THEME = { '常如意i': { bg: '#F8E8DF', soft: '#C4886E' }, '芽芽Mochi': { bg: '#F0E6F7', soft: '#9B6BC2' } };

/* 数据迁移：单账号旧结构 -> 多账号结构（以「常如意i」承继旧数据） */

function migrateXhsAccounts() {

  if (!S.xhs) S.xhs = defaultState().xhs;

  if (S.xhs.accounts) return;

  S.xhs.accounts = {};

  /* 旧 limit 是全局 {count, names}，迁移给第一个账号 */

  const oldLimit = (S.xhs.limit && typeof S.xhs.limit === 'object' && !Array.isArray(S.xhs.limit) && (S.xhs.limit.count != null || S.xhs.limit.names != null))

    ? S.xhs.limit : { count: 0, names: '' };

  S.xhs.limit = {};

  XHS_ACCOUNTS.forEach((acct, i) => {

    if (i === 0) {

      S.xhs.accounts[acct] = { base: S.xhs.base || { followers: 0, notes: 0, zanCang: 0 }, records: S.xhs.records || [] };

      S.xhs.limit[acct] = oldLimit;

    } else {

      S.xhs.accounts[acct] = { base: { followers: 0, notes: 0, zanCang: 0 }, records: [] };

      S.xhs.limit[acct] = { count: 0, names: '' };

    }

  });

}

function xhsAccountData(account) { migrateXhsAccounts(); return S.xhs.accounts[account] || { base: { followers: 0, notes: 0, zanCang: 0 }, records: [] }; }

function xhsLimit(account) { migrateXhsAccounts(); return (S.xhs.limit && S.xhs.limit[account]) || { count: 0, names: '' }; }

function xhsBaseVal(m, account) { const b = xhsAccountData(account).base || {}; return m === 'f' ? (b.followers || 0) : m === 'n' ? (b.notes || 0) : (b.zanCang || 0); }

function xhsRecsWith(m, account) {

  /* 关键修复：必须按「数据实际日期(date)」降序排序，而不是创建时间(ts)。

     否则先记 21 号、后补 14 号初始数据时，14 号会因 ts 较新被当成「当前数」并错误对比 21 号。 */

  return (xhsAccountData(account).records || []).filter(r => r[m] != null).slice().sort((a, b) => {

    const byDate = (b.date || '').localeCompare(a.date || '');

    if (byDate !== 0) return byDate;

    return (b.ts || '').localeCompare(a.ts || '');

  });

}

function xhsCurrent(m, account) { const L = xhsRecsWith(m, account); return L.length ? L[0][m] : xhsBaseVal(m, account); }

function xhsDelta(m, account) {

  const L = xhsRecsWith(m, account);

  if (L.length < 2) return null;

  return L[0][m] - L[1][m];

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

  migrateXhsAccounts();



  // 账号统计卡片（双账号：常如意i / 芽芽Mochi）

  const accountBlocks = XHS_ACCOUNTS.map((acct) => {

    const theme = XHS_ACCOUNT_THEME[acct] || { bg: '#F8E8DF', soft: '#C4886E' };

    const cur = { f: xhsCurrent('f', acct), n: xhsCurrent('n', acct), z: xhsCurrent('z', acct) };

    const L = xhsLimit(acct);

    const limitMini = L.count ? `<div class="limit-mini">🚫 ${L.count} 篇限流</div>` : '<div class="limit-mini ok">未限流</div>';

    return `

    <div class="xhs-account-block" style="background:${theme.bg};border:1px solid ${theme.soft}33">

      <div class="xhs-account-title" style="color:${theme.soft}"><span class="acct-badge" style="background:${theme.soft};color:#fff">${XHS_ACCOUNT_BADGE[acct]}</span>${esc(acct)}</div>

      <div class="xhs-stat xhs-stat-compact">

        <div class="xhs-cell"><div class="big">${cur.f.toLocaleString()}</div><div class="lbl">粉丝量</div>${deltaHTML(xhsDelta('f', acct))}</div>

        <div class="xhs-cell xhs-cell-limit ${L.count ? 'has-limit' : ''}" data-action="xhs-open-limit" data-account="${esc(acct)}" title="点击管理限流笔记">

          <div class="big">${cur.n.toLocaleString()}</div>

          <div class="lbl">笔记数量</div>

          ${deltaHTML(xhsDelta('n', acct))}

          ${limitMini}

        </div>

        <div class="xhs-cell"><div class="big">${cur.z.toLocaleString()}</div><div class="lbl">赞藏数量</div>${deltaHTML(xhsDelta('z', acct))}</div>

      </div>

    </div>`;

  }).join('');



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

    const acct = r.account || XHS_ACCOUNTS[0];

    const abg = XHS_ACCOUNT_BADGE[acct] || '常';

    const theme = XHS_ACCOUNT_THEME[acct] || { soft: '#C4886E' };

    const typeTag = isPgy

      ? `<span class="t-type pgy">🌼 蒲公英</span>`

      : `<span class="t-type ${isOut ? 'cash' : 'note'}">${isOut ? '我返PR' : 'PR返我'}</span>`;

    return `<div class="xhs-todo ${r.done ? 'done' : ''}">

      <div class="check ${r.done ? 'on' : ''}" data-action="rebrate-toggle" data-id="${r.id}">${r.done ? icCheck() : ''}</div>

      ${typeTag}

      <span class="tl-text"><span class="xhs-acct-tag" style="background:${theme.soft}">${abg}</span><b>${esc(r.item || '未命名物品')}</b>

        <span class="date-chip soft">📅 发布 ${esc(r.pub || '—')}</span>

        <span class="date-chip">${isPgy ? '⏰ 交易确认 ' : '⏰ 最晚 '}${esc(r.prom || '—')}</span>

        ${r.done && r.rdate ? `<span class="date-chip ok">✓ ${esc(r.rdate)}${r.channel ? ' · ' + esc(r.channel) : ''}</span>` : ''}

      </span>

      <span class="r-amt" style="color:${amtColor};font-weight:800">${isOut ? '-' : '+'}${money(r.amount || 0)}</span>

      <button class="icon-btn danger" data-action="rebrate-del" data-id="${r.id}">${icTrash()}</button>

    </div>`;

  }).join('') : '<div class="empty">暂无返款记录，点右上角「+ 添加」</div>';



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

    const acct = n.account || XHS_ACCOUNTS[0];

    const abg = XHS_ACCOUNT_BADGE[acct] || '常';

    const theme = XHS_ACCOUNT_THEME[acct] || { soft: '#C4886E' };

    return `

    <div class="note-exp-card ${isCart ? 'cart' : ''}">

      <div class="note-cover" data-action="xhs-note-detail" data-id="${n.id}" title="点封面看支出明细">

        <img src="${noteCoverUrl(n)}" alt="封面" />

        <span class="note-cover-acct" style="background:${theme.soft}">${abg}</span>

      </div>

      <div class="note-info">

        <div class="note-name"><span class="xhs-acct-tag" style="background:${theme.soft}">${abg}</span><b>${esc(n.name || '未命名笔记')}</b> <span class="etype-tag ${isCart ? 'cart' : 'note'}">${isCart ? '作业车' : '笔记'}</span></div>

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

        <button class="btn btn-sm btn-ghost" style="margin-left:auto" data-action="xhs-reset" title="清掉所有记录与基准数，从头开始">🧹 重置统计</button>

      </div>

      <div style="color:var(--ink-soft);font-size:13px">点「查看统计」可按日期查看每条数据的累计值，以及<span style="color:#D6453D;font-weight:700">每日增长</span>（涨红跌绿）。顶部数字会随你记录的变动自动更新。</div>

    </div>`;



  $('#view-xhs').innerHTML = `

    <div class="xhs-accounts" style="margin-bottom:18px">${accountBlocks}</div>

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

          <span style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">

            <button class="btn btn-sm btn-ghost" data-action="xhs-export-backup">⬇️ 导出备份</button>

            <button class="btn btn-sm btn-ghost" data-action="xhs-import-backup">⬆️ 导入备份</button>

            <button class="btn btn-sm btn-ghost" data-action="xhs-cloud-backup">🛡 本地快照</button>

          </span>

        </div>

        <div style="color:var(--ink-soft);font-size:13px">建议定期点「导出备份」把数据下载到电脑。换浏览器、清缓存或同步异常时，可用「导入备份」恢复。</div>

        <button class="btn btn-primary" style="width:100%;margin-top:12px" data-action="xhs-restore-cloud">🔄 从云端恢复数据（把服务器上的最新数据拉回本机）</button>

      </div>`;

}



/* ===================== 小红书：数据增长统计（按日期） ===================== */

/* 按日期聚合累计快照：每格数值 = 截至该日的最新累计（向上沿用），

   增量 = 当日累计 − 前一日累计（首日为 − 起始基线）。同日多次填写取最新。 */

function xhsHistoryRows(account) {

  const recs = (xhsAccountData(account).records || []).slice().sort((a, b) => (a.ts || '').localeCompare(b.ts || ''));

  const baseSnap = { f: xhsBaseVal('f', account), n: xhsBaseVal('n', account), z: xhsBaseVal('z', account) };

  const groups = {}; const order = [];

  recs.forEach(r => { if (!groups[r.date]) { groups[r.date] = []; order.push(r.date); } groups[r.date].push(r); });

  order.sort();

  let rf = baseSnap.f, rn = baseSnap.n, rz = baseSnap.z;

  let prev = { f: baseSnap.f, n: baseSnap.n, z: baseSnap.z };

  const rows = [];

  order.forEach((ds, idx) => {

    const dayRecs = groups[ds].slice().sort((a, b) => (a.ts || '').localeCompare(b.ts || ''));

    dayRecs.forEach(r => { if (r.f != null) rf = r.f; if (r.n != null) rn = r.n; if (r.z != null) rz = r.z; });

    /* 最早一条（初始数据）不显示涨幅：它与「起始基准」的差不是「增长」，只是建档起点 */

    const isInitial = idx === 0;

    rows.push({ date: ds, f: rf, n: rn, z: rz, df: isInitial ? null : rf - prev.f, dn: isInitial ? null : rn - prev.n, dz: isInitial ? null : rz - prev.z, isInitial, recIds: dayRecs.map(r => r.id) });

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

function initialMetricCell(val) {

  const v = (val == null ? '—' : val.toLocaleString());

  return `<div class="xhs-hist-metric">

    <div class="xhs-hist-val">${v}</div>

    <div class="xhs-hist-delta flat">初始数据</div>

  </div>`;

}

function openXhsHistoryModal() {

  let body = '';

  XHS_ACCOUNTS.forEach((acct, idx) => {

    const rows = xhsHistoryRows(acct);

    const theme = XHS_ACCOUNT_THEME[acct] || { bg: '#F8E8DF', soft: '#C4886E' };

    body += `<div class="xhs-hist-account" style="${idx > 0 ? 'margin-top:18px' : ''}">

      <div class="xhs-hist-title" style="background:${theme.bg};color:${theme.soft}"><span class="acct-badge">${XHS_ACCOUNT_BADGE[acct]}</span>${esc(acct)} · 数据增长统计</div>`;

    if (!rows.length) {

      body += '<div class="empty">还没有记录，先点「记录当前数据」添加吧 🌱</div></div>';

      return;

    }

    const head = `

      <div class="xhs-hist-hc h-date">日期</div>

      <div class="xhs-hist-hc">粉丝量</div>

      <div class="xhs-hist-hc">赞藏数量</div>

      <div class="xhs-hist-hc">笔记数量</div>

      <div class="xhs-hist-hc h-act"></div>`;

    const renderRow = r => {

      const dt = new Date(r.date + 'T00:00:00');

      const md = `${dt.getMonth() + 1}月${dt.getDate()}日`;

      const wk = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()];

      const fCell = r.isInitial ? initialMetricCell(r.f) : histMetricCell(r.f, r.df);

      const nCell = r.isInitial ? initialMetricCell(r.n) : histMetricCell(r.n, r.dn);

      const zCell = r.isInitial ? initialMetricCell(r.z) : histMetricCell(r.z, r.dz);

      return `

        <div class="xhs-hist-date"><span class="d">${md}</span><span class="w">周${wk}</span></div>

        ${fCell}

        ${zCell}

        ${nCell}

        <div class="xhs-hist-act"><button class="icon-btn danger" data-action="xhs-hist-del" data-ids="${r.recIds.join(',')}" data-account="${esc(acct)}" title="删除该日记录">${icTrash()}</button></div>`;

    };

    const SHOW_RECENT = 3;

    const initIdx = rows.findIndex(r => r.isInitial);

    const initRow = initIdx >= 0 ? rows[initIdx] : rows[0];

    const recentRows = rows.slice(-SHOW_RECENT);

    const hiddenRows = rows.filter((r, i) => i !== initIdx && !recentRows.includes(r));

    const recentWithoutInit = recentRows.filter(r => r !== initRow);

    body += `<div class="xhs-hist">

      <div class="xhs-hist-table">${head}${renderRow(initRow)}`;

    if (hiddenRows.length) {

      body += `<div class="xhs-hist-more" id="xhs-hist-more-${idx}" data-count="${hiddenRows.length}" style="display:none">

        ${hiddenRows.map(renderRow).join('')}

      </div>

      <button class="xhs-hist-toggle" data-action="xhs-hist-toggle" data-idx="${idx}" data-count="${hiddenRows.length}">

        <span class="toggle-icon">+</span> 展开 ${hiddenRows.length} 天历史

      </button>`;

    }

    body += `${recentWithoutInit.map(renderRow).join('')}</div></div></div>`;

  });

  body += `<p class="modal-tip" style="margin-top:12px">每格下方小字为「较前一天」的增量：<b style="color:#D6453D">红色加粗 = 涨</b>，绿色 = 跌，持平则灰色。删除某一天会移除该日全部记录。</p>`;

  openModal(`<h3>📊 数据增长统计</h3>${body}`, 'modal-wide');

}



/* ===================== 事件委托 ===================== */

document.addEventListener('click', e => {

  const el = e.target.closest('[data-action]');

  if (!el) return;

  const a = el.dataset.action, id = el.dataset.id;



  switch (a) {

    case 'close-modal': closeModal(); renderView(currentView); break;



    /* 导航 */

    case 'nav': break;



    /* 首页 */

    case 'home-cal-prev': homeCal.m--; if (homeCal.m < 0) { homeCal.m = 11; homeCal.y--; } renderHome(); break;

    case 'home-cal-next': homeCal.m++; if (homeCal.m > 11) { homeCal.m = 0; homeCal.y++; } renderHome(); break;

    case 'home-pick': homeCal.sel = el.dataset.date; renderHome(); break;

    case 'baby-cal-prev': babyCal.m--; if (babyCal.m < 0) { babyCal.m = 11; babyCal.y--; } renderView('baby'); break;

    case 'baby-cal-next': babyCal.m++; if (babyCal.m > 11) { babyCal.m = 0; babyCal.y++; } renderView('baby'); break;

    case 'baby-pick': openBabyDayModal(el.dataset.date); break;

    case 'baby-poop-save': {

      const ds = el.dataset.date;

      const time = ($('#bpTime').value || '').trim() || '00:00';

      const type = ($('#bpType').value || BABY_TYPES[0]).trim();

      const note = ($('#bpNote').value || '').trim();

      S.baby.poops.push({ id: uid(), date: ds, time, type, note });

      save(); openBabyDayModal(ds); toast('已记录女鹅拉屎 💩'); break;

    }

    case 'baby-med-save': {

      const ds = el.dataset.date;

      const time = ($('#bpMedTime').value || '').trim() || '00:00';

      const medMg = parseFloat($('#bpMedMg').value || '0') || 0;

      const note = ($('#bpMedNote').value || '').trim();

      S.baby.meds.push({ id: uid(), date: ds, time, medMg, note });

      save(); openBabyDayModal(ds); toast('已记录女鹅用药 💊'); break;

    }

    case 'baby-del-poop': {

      const rec = (S.baby.poops || []).find(p => p.id === id);

      S.baby.poops = S.baby.poops.filter(p => p.id !== id);

      save(); if (rec) openBabyDayModal(rec.date); toast('已删除拉屎记录'); break;

    }

    case 'baby-del-med': {

      const rec = (S.baby.meds || []).find(p => p.id === id);

      S.baby.meds = S.baby.meds.filter(p => p.id !== id);

      save(); if (rec) openBabyDayModal(rec.date); toast('已删除用药记录'); break;

    }

    case 'toggle-rest': {

      const ds = el.dataset.date; const set = S.home.rest || (S.home.rest = []);

      const i = set.indexOf(ds);

      if (i >= 0) set.splice(i, 1); else set.push(ds);

      save(); renderHome(); break;

    }

    case 'add-cd': openCdModal(); break;

    case 'del-cd': S.home.countdowns = S.home.countdowns.filter(c => c.id !== id); save(); renderHome(); break;

    case 'weather-open': openWeatherModal(); break;

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

    case 'xhs-reset': {

      if (window.confirm('确定要重置小红书统计吗？\n\n会清空两个账号的「基准数」和所有已记录的数据（粉丝/笔记/赞藏），之后你需要重新用「记录当前数据」填入真实数字。\n\n此操作无法撤销。')) {

        migrateXhsAccounts();

        XHS_ACCOUNTS.forEach(acct => {

          S.xhs.accounts[acct] = { base: { followers: 0, notes: 0, zanCang: 0 }, records: [] };

        });

        S.xhs.base = { followers: 0, notes: 0, zanCang: 0 };

        S.xhs.records = [];

        save(); closeModal(); renderXhs(); toast('已重置，请重新记录真实数据');

      }

      break;

    }

    case 'xhs-hist-del': {

      const ids = (el.dataset.ids || '').split(',').filter(Boolean);

      const acct = el.dataset.account || XHS_ACCOUNTS[0];

      migrateXhsAccounts();

      if (ids.length && S.xhs.accounts[acct]) { S.xhs.accounts[acct].records = (S.xhs.accounts[acct].records || []).filter(r => !ids.includes(r.id)); save(); }

      openXhsHistoryModal(); toast('已删除该日记录'); break;

    }

    case 'xhs-hist-toggle': {

      const more = document.getElementById('xhs-hist-more-' + el.dataset.idx);

      if (more) {

        const open = more.classList.toggle('open');

        /* 内联样式兜底：即使旧缓存的 CSS 没加载 .xhs-hist-more{display:none}，JS 也能正确显隐 */

        more.style.display = open ? 'contents' : 'none';

        const count = el.dataset.count || '';

        el.innerHTML = `<span class="toggle-icon">${open ? '−' : '+'}</span> ${open ? '收起' : `展开 ${count} 天历史`}`;

      }

      break;

    }

    case 'xhs-save-day': {

      const account = ($('#xAccount').value || XHS_ACCOUNTS[0]).trim();

      const date = ($('#xDate').value || todayStr()).trim();

      const fv = ($('#xFollowers').value || '').trim();

      const nv = ($('#xNotes').value || '').trim();

      const zv = ($('#xZan').value || '').trim();

      const rec = { id: uid(), date, account, ts: new Date().toISOString() };

      if (fv !== '') rec.f = Math.max(0, parseInt(fv, 10) || 0);

      if (nv !== '') rec.n = Math.max(0, parseInt(nv, 10) || 0);

      if (zv !== '') rec.z = Math.max(0, parseInt(zv, 10) || 0);

      if (rec.f == null && rec.n == null && rec.z == null) { toast('至少填一项', 'warn'); return; }

      migrateXhsAccounts();

      S.xhs.accounts[account].records = S.xhs.accounts[account].records || [];

      S.xhs.accounts[account].records.push(rec);

      save(); closeModal(); renderXhs(); toast('已记录（最新一条即为当前数）'); break;

    }

    case 'xhs-edit-limit':

    case 'xhs-open-limit': openXhsLimitModal(el.dataset.account || XHS_ACCOUNTS[0]); break;

    case 'xhs-export-backup': exportBackup(); break;

    case 'xhs-import-backup': openImportPicker(); break;

    case 'xhs-cloud-backup': openCloudBackup(); break;

    case 'xhs-restore-cloud': {

      pendingForceRestore = true;

      toast('正在从云端恢复数据，请稍候…', 'warn');

      if (!cloudReady) { initSync(); }   // 未初始化则先连接云端（内部会触发强制拉取）

      else { pullSync(true); }            // 已连接则直接强制从云端恢复

      break;

    }

    case 'xhs-save-limit': {

      const account = el.dataset.account || XHS_ACCOUNTS[0];

      const count = Math.max(0, parseInt($('#xLimitCount').value || '0', 10) || 0);

      const names = ($('#xLimitNames').value || '').trim();

      if (!S.xhs.limit) S.xhs.limit = {};

      S.xhs.limit[account] = { count, names };

      save(); closeModal(); renderXhs(); toast(`已保存 ${esc(account)} 的限流笔记备注`); break;

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

      const account = ($('#neAccount').value || XHS_ACCOUNTS[0]).trim();

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

        if (n) { n.name = name; n.date = date; n.account = account; n.type = type; n.cover = cover; n.items = items; }

      } else {

        S.xhs.noteExpenses.push({ id: uid(), name, date, account, type, cover, items });

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

    case 'xhs-rec-del': {

      migrateXhsAccounts();

      XHS_ACCOUNTS.forEach(acct => {

        if (S.xhs.accounts[acct]) S.xhs.accounts[acct].records = (S.xhs.accounts[acct].records || []).filter(r => r.id !== id);

      });

      save(); renderXhs(); toast('已删除该条记录'); break;

    }

    case 'rebrate-add': openRebrateModal(); break;

    case 'rebrate-add-pgy': openRebrateModal('pgy'); break;

    case 'rebrate-save': {

      const amount = Math.max(0, parseFloat($('#rbAmt').value || '0'));

      const item = ($('#rbItem').value || '').trim();

      const pub = ($('#rbPub').value || '').trim();

      const prom = ($('#rbProm').value || todayStr()).trim();

      const account = ($('#rbAccount').value || XHS_ACCOUNTS[0]).trim();

      if (!amount || !item) { toast('请输入金额和物品名称', 'warn'); return; }

      S.xhs.rebates = S.xhs.rebates || [];

      S.xhs.rebates.push({ id: uid(), dir: window.__rbDir ? window.__rbDir() : 'out', src: window.__rbSrc ? window.__rbSrc() : 'rebate', account, amount, item, pub, prom, done: false });

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



    /* Ruyi日历 */

    case 'ry-cal-prev-year': ruyiCal.y--; renderView('ruyi'); break;

    case 'ry-cal-next-year': ruyiCal.y++; renderView('ruyi'); break;

    case 'ry-cal-prev': ruyiCal.m--; if (ruyiCal.m < 0) { ruyiCal.m = 11; ruyiCal.y--; } renderView('ruyi'); break;

    case 'ry-cal-next': ruyiCal.m++; if (ruyiCal.m > 11) { ruyiCal.m = 0; ruyiCal.y++; } renderView('ruyi'); break;

    case 'ry-cal-today': ruyiCal = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: todayStr() }; renderView('ruyi'); break;

    case 'ry-quick-add': openRuyiDayModal(todayStr()); break;

    case 'ry-draft-goto': {

      const dsg = el.dataset.date;

      if (dsg) { ruyiCal = { y: parseInt(dsg.slice(0, 4)), m: parseInt(dsg.slice(5, 7)) - 1, sel: dsg }; renderView('ruyi'); }

      break;

    }

    case 'ry-draft-check': {

      const id = el.dataset.id;

      const note = (S.ruyiNotes || []).find(n => n.id === id);

      if (!note) break;

      openModal(`

        <h3>📝 标记出稿状态</h3>

        <p style="margin:-8px 0 14px;color:var(--ink-soft)">选择后将从今日待出稿列表移除</p>

        <div class="hs-draft-status-options">

          <button class="btn btn-status-review" data-action="ry-draft-set-status" data-id="${esc(id)}" data-status="审核中">审核中</button>

          <button class="btn btn-status-published" data-action="ry-draft-set-status" data-id="${esc(id)}" data-status="已出稿">已出稿</button>

        </div>`, 'modal-narrow');

      break;

    }

    case 'ry-draft-set-status': {

      const id = el.dataset.id;

      const status = el.dataset.status;

      const note = (S.ruyiNotes || []).find(n => n.id === id);

      if (note && status) {

        note.status = status;

        save();

        toast(`已标记为${status}`, 'ok');

      }

      closeModal();

      renderHome();

      break;

    }

    case 'ry-pick': openRuyiDayModal(el.dataset.date); break;

    case 'ry-note-save': {

      const ds = el.dataset.date;

      const newDate = ($('#hsDate').value || ds).trim();

      const editId = ($('#hsEditId').value || '').trim();

      const item = ($('#hsItem').value || '').trim();

      const type = ($('#hsType').value || PUB_TYPES[0]).trim();

      const status = ($('#hsStatus').value || '待出稿').trim();

      const account = ($('#hsAccount').value || '常如意i').trim();

      const deadline = ($('#hsDeadline').value || '').trim();

      if (!item) { toast('请填写物品名称', 'warn'); return; }

      if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) { toast('请选择有效的归属日期', 'warn'); return; }

      let quote = 0, rebatePct = 0, rebate = 0, fee = 0, net = 0, orderAmount = 0;

      if (type === '蒲公英商单') {

        quote = Math.max(0, parseFloat($('#hsQuote').value || '0') || 0);

        rebatePct = parseFloat($('#hsRebatePct').value || '0') || 0;

        fee = Math.round(quote * 0.1 * 100) / 100;

        rebate = -Math.round(quote * rebatePct / 100 * 100) / 100;

        net = Math.round((quote - fee + rebate) * 100) / 100;

      } else if (PUB_ORD_TYPES.includes(type)) {

        orderAmount = Math.max(0, parseFloat($('#hsOrderAmount').value || '0') || 0);

        fee = Math.round(orderAmount * 0.1 * 100) / 100; /* 手续费 = 订单金额 10% */

        net = Math.round((orderAmount - fee) * 100) / 100; /* 到手 = 订单金额 - 手续费 */

      }

      if (editId) {

        const idx = (S.ruyiNotes || []).findIndex(x => x.id === editId);

        if (idx > -1) {

          S.ruyiNotes[idx] = { ...S.ruyiNotes[idx], date: newDate, item, type, status, account, deadline, quote, rebatePct, rebate, fee, net, orderAmount };

          toast('已修改出稿笔记 🍠');

        }

      } else {

        S.ruyiNotes.push({ id: uid(), date: newDate, item, type, status, account, deadline, quote, rebatePct, rebate, fee, net, orderAmount });

        toast('已保存出稿笔记 🍠');

      }

      save(); closeModal();

      ruyiCal = { y: parseInt(newDate.slice(0, 4)), m: parseInt(newDate.slice(5, 7)) - 1, sel: newDate };

      renderView('ruyi'); break;

    }

    case 'ry-note-edit': {

      const n = (S.ruyiNotes || []).find(x => x.id === id);

      if (!n) { toast('笔记不存在', 'warn'); break; }

      fillRuyiEdit(n);

      break;

    }

    case 'ry-note-cancel-edit': {

      $('#hsEditId').value = '';

      $('#hsItem').value = '';

      $('#hsType').value = PUB_TYPES.includes('蒲公英商单') ? '蒲公英商单' : PUB_TYPES[0];

      $('#hsStatus').value = '待出稿';

      $('#hsAccount').value = '常如意i';

      $('#hsDate').value = ds;

      $('#hsDeadline').value = '';

      $('#hsQuote').value = '';

      $('#hsRebatePct').value = '';

      $('#hsOrderAmount').value = '';

      $('#hsSaveBtn').textContent = '+ 保存出稿笔记';

      $('#hsCancelEditBtn').style.display = 'none';

      $('#hsType').dispatchEvent(new Event('change'));

      if ($('#hsQuote')) $('#hsQuote').dispatchEvent(new Event('input'));

      break;

    }

    case 'ry-note-del': {

      const n = (S.ruyiNotes || []).find(x => x.id === id);

      S.ruyiNotes = (S.ruyiNotes || []).filter(x => x.id !== id);

      save(); renderView('ruyi'); if (n) openRuyiDayModal(n.date); toast('已删除'); break;

    }

    /* Yaya日历 */

    case 'yy-cal-prev-year': yayaCal.y--; renderView('yaya'); break;

    case 'yy-cal-next-year': yayaCal.y++; renderView('yaya'); break;

    case 'yy-cal-prev': yayaCal.m--; if (yayaCal.m < 0) { yayaCal.m = 11; yayaCal.y--; } renderView('yaya'); break;

    case 'yy-cal-next': yayaCal.m++; if (yayaCal.m > 11) { yayaCal.m = 0; yayaCal.y++; } renderView('yaya'); break;

    case 'yy-cal-today': yayaCal = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: todayStr() }; renderView('yaya'); break;

    case 'yy-quick-add': openYayaDayModal(todayStr()); break;

    case 'yy-draft-goto': {

      const dsg = el.dataset.date;

      if (dsg) { yayaCal = { y: parseInt(dsg.slice(0, 4)), m: parseInt(dsg.slice(5, 7)) - 1, sel: dsg }; renderView('yaya'); }

      break;

    }

    case 'yy-draft-check': {

      const id = el.dataset.id;

      const note = (S.yayaNotes || []).find(n => n.id === id);

      if (!note) break;

      openModal(`

        <h3>📝 标记出稿状态</h3>

        <p style="margin:-8px 0 14px;color:var(--ink-soft)">选择后将从今日待出稿列表移除</p>

        <div class="hs-draft-status-options">

          <button class="btn btn-status-review" data-action="yy-draft-set-status" data-id="${esc(id)}" data-status="审核中">审核中</button>

          <button class="btn btn-status-published" data-action="yy-draft-set-status" data-id="${esc(id)}" data-status="已出稿">已出稿</button>

        </div>`, 'modal-narrow');

      break;

    }

    case 'yy-draft-set-status': {

      const id = el.dataset.id;

      const status = el.dataset.status;

      const note = (S.yayaNotes || []).find(n => n.id === id);

      if (note && status) {

        note.status = status;

        save();

        toast(`已标记为${status}`, 'ok');

      }

      closeModal();

      renderHome();

      break;

    }

    case 'yy-pick': openYayaDayModal(el.dataset.date); break;

    case 'yy-note-save': {

      const ds = el.dataset.date;

      const newDate = ($('#hsDate').value || ds).trim();

      const editId = ($('#hsEditId').value || '').trim();

      const item = ($('#hsItem').value || '').trim();

      const type = ($('#hsType').value || PUB_TYPES[0]).trim();

      const status = ($('#hsStatus').value || '待出稿').trim();

      const account = ($('#hsAccount').value || '芽芽Mochi').trim();

      const deadline = ($('#hsDeadline').value || '').trim();

      if (!item) { toast('请填写物品名称', 'warn'); return; }

      if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) { toast('请选择有效的归属日期', 'warn'); return; }

      let quote = 0, rebatePct = 0, rebate = 0, fee = 0, net = 0, orderAmount = 0;

      if (type === '蒲公英商单') {

        quote = Math.max(0, parseFloat($('#hsQuote').value || '0') || 0);

        rebatePct = parseFloat($('#hsRebatePct').value || '0') || 0;

        fee = Math.round(quote * 0.1 * 100) / 100;

        rebate = -Math.round(quote * rebatePct / 100 * 100) / 100;

        net = Math.round((quote - fee + rebate) * 100) / 100;

      } else if (PUB_ORD_TYPES.includes(type)) {

        orderAmount = Math.max(0, parseFloat($('#hsOrderAmount').value || '0') || 0);

        fee = Math.round(orderAmount * 0.1 * 100) / 100; /* 手续费 = 订单金额 10% */

        net = Math.round((orderAmount - fee) * 100) / 100; /* 到手 = 订单金额 - 手续费 */

      }

      if (editId) {

        const idx = (S.yayaNotes || []).findIndex(x => x.id === editId);

        if (idx > -1) {

          S.yayaNotes[idx] = { ...S.yayaNotes[idx], date: newDate, item, type, status, account, deadline, quote, rebatePct, rebate, fee, net, orderAmount };

          toast('已修改出稿笔记 🍠');

        }

      } else {

        S.yayaNotes.push({ id: uid(), date: newDate, item, type, status, account, deadline, quote, rebatePct, rebate, fee, net, orderAmount });

        toast('已保存出稿笔记 🍠');

      }

      save(); closeModal();

      yayaCal = { y: parseInt(newDate.slice(0, 4)), m: parseInt(newDate.slice(5, 7)) - 1, sel: newDate };

      renderView('yaya'); break;

    }

    case 'yy-note-edit': {

      const n = (S.yayaNotes || []).find(x => x.id === id);

      if (!n) { toast('笔记不存在', 'warn'); break; }

      fillYayaEdit(n);

      break;

    }

    case 'yy-note-cancel-edit': {

      $('#hsEditId').value = '';

      $('#hsItem').value = '';

      $('#hsType').value = PUB_TYPES.includes('蒲公英商单') ? '蒲公英商单' : PUB_TYPES[0];

      $('#hsStatus').value = '待出稿';

      $('#hsAccount').value = '芽芽Mochi';

      $('#hsDate').value = ds;

      $('#hsDeadline').value = '';

      $('#hsQuote').value = '';

      $('#hsRebatePct').value = '';

      $('#hsOrderAmount').value = '';

      $('#hsSaveBtn').textContent = '+ 保存出稿笔记';

      $('#hsCancelEditBtn').style.display = 'none';

      $('#hsType').dispatchEvent(new Event('change'));

      if ($('#hsQuote')) $('#hsQuote').dispatchEvent(new Event('input'));

      break;

    }

    case 'yy-note-del': {

      const n = (S.yayaNotes || []).find(x => x.id === id);

      S.yayaNotes = (S.yayaNotes || []).filter(x => x.id !== id);

      save(); renderView('yaya'); if (n) openYayaDayModal(n.date); toast('已删除'); break;

    }

  }

});



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



/* ===================== 云端同步（GitHub） ===================== */

/* 同步铁律（吸取多次「空白覆盖真实数据」教训）：

   1) 云端状态未知前（cloudReady=false）绝不推送，先等首次 pull 完成；

   2) 本地记录数 < 云端记录数时，绝不覆盖云端（防止近空/空白状态清掉真实数据）；

   3) 本地为空且云端有数据时，由 pullSync 静默采用云端恢复，绝不反向清空。

   4) 用 GitHub 仓库里的 data.json 做存储，浏览器直连 api.github.com（支持 CORS）。 */

let ghSha = null, lastSaveTime = 0, syncTimer = null, pullAttempts = 0;

let cloudHasData = null, cloudReady = false, cloudRecordCount = 0, pendingPush = false, lastSyncErr = '';

let pendingForceRestore = false;

function totalRecords(s) {

  const x = s.xhs || {};

  let n = 0;

  n += (s.ledger || []).length;

  n += (s.baby && s.baby.poops || []).length;

  n += (s.baby && s.baby.meds || []).length;

  n += (s.ruyiNotes || []).length;
  n += (s.yayaNotes || []).length;

  n += (s.home && s.home.rest || []).length;

  n += (x.records || []).length;

  n += (x.noteExpenses || []).length;

  n += (x.rebates || []).length;

  return n;

}

function setSync(state, detail) {

  const pill = $('#syncPill'); if (!pill) return;

  pill.className = 'sync-pill sync-' + state;

  const map = { online: '已同步', offline: '未连接', syncing: '同步中' };

  $('#syncTxt').textContent = map[state] + (detail ? ' · ' + detail : '');

  lastSyncErr = (state === 'offline' ? (detail || '') : '');

}

function b64encodeUtf8(str) {

  const bytes = new TextEncoder().encode(str);

  let bin = '';

  bytes.forEach(b => bin += String.fromCharCode(b));

  return btoa(bin);

}

function b64decodeUtf8(b64) {

  const bin = atob(b64.replace(/\s/g, ''));

  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));

  return new TextDecoder().decode(bytes);

}

function ghApi(method, body) {

  const url = `https://api.github.com/repos/${GITHUB_CFG.owner}/${GITHUB_CFG.repo}/contents/${GITHUB_CFG.path}?ref=${GITHUB_CFG.branch}`;

  const headers = {

    'User-Agent': 'changruyi-workbench',

    'Authorization': 'token ' + GITHUB_CFG.token,

    'Accept': 'application/vnd.github.v3+json'

  };

  if (body) headers['Content-Type'] = 'application/json';

  const opt = { method, headers, body: body ? JSON.stringify(body) : undefined };

  /* 关键修复：GET 拉取云端数据必须 no-store，否则浏览器/GitHub CDN（Cache-Control: max-age=60）会把旧响应缓存住，

     导致手机/电脑一直看到「不是最新的」数据。 */

  if (method === 'GET') opt.cache = 'no-store';

  return fetch(url, opt);

}

function initSync() {

  if (!GITHUB_CFG.token || !GITHUB_CFG.owner || !GITHUB_CFG.repo) { setSync('offline', '未配置云端'); return; }

  setSync('syncing');

  pullAttempts = 0;

  if (pendingForceRestore) { pendingForceRestore = false; pullSync(true); } /* 手动「从云端恢复」强制拉取 */

  else { pullSync(); } /* 仅打开时静默同步一次（本地空白才恢复），之后不再自动拉取 */

}

function retrySync() { syncNow(); }

async function syncNow() {

  setSync('syncing');

  pullAttempts = 0;

  let pulledOk = false;

  try {

    await pullSync(); /* 先拉取云端最新数据，避免手机旧数据覆盖电脑端新数据 */

    pulledOk = true;

  } catch (e) {

    console.warn('pull failed', e);

  }

  if (pulledOk) {

    try {

      await pushSync(true); /* 再把合并后的最新数据推回云端 */

    } catch (e) {

      console.warn('push failed', e);

      /* 拉取已成功：电脑端修改已下行到手机，即使上传因 360/公司网络拦截而失败，

         也应视为「已同步」，避免状态错误变成「未连接」。 */

      setSync('online');

    }

  }

}

async function pullSync(force) {

  try {

    pullAttempts++;

    const resp = await ghApi('GET');

    if (resp.status === 200) {

      const res = await resp.json();

      ghSha = res.sha || ghSha;

      const remote = res.content ? JSON.parse(b64decodeUtf8(res.content)) : null;

      if (remote) {

        cloudHasData = true;

        cloudRecordCount = totalRecords(remote);

        const localIsBlank = isFreshDefault(S);

        /* 关键防护：

           1) 本地完全空白 → 整份采用云端恢复（换设备/清缓存后找回）。

           2) 本地有部分数据但某个模块缺失（如红薯日历 notes 被 iPhone 清掉）→ 智能合并，只补缺失模块，绝不覆盖本地已有内容。

           3) force=true 为手动「从云端恢复」：整份替换。 */

        if ((force || localIsBlank) && !isFreshDefault(remote)) {

          S = Object.assign(defaultState(), remote);

          trimBackups(S); /* 强制恢复时清理云端旧备份，防止体积过大存不进本地 */

          /* ★ 关键修复：把云端恢复的数据立刻写回本地存储，否则只是内存里、下次打开又空 */

          let persistOk = false;

          try { localStorage.setItem(KEY, JSON.stringify(S)); persistOk = true; } catch (e) {

            console.warn('restore persist failed', e);

            toast('云端数据已拉回，但本地存不下（数据太大），建议导出备份后清理', 'warn');

          }

          renderView(currentView);

          setSync('online');

          if (force) toast('已从云端恢复全部数据 🎉' + (persistOk ? '' : '（本地保存失败）'), persistOk ? 'ok' : 'warn');

        } else if (!isFreshDefault(remote)) {

          const changed = mergeImport(remote, true); /* 云端优先合并：相同 id 以云端为准，确保电脑端修改下行到手机 */

          if (changed) {

            save(); /* 落盘并回写云端（本地修改已先推上云，云端总是最新） */

            renderView(currentView);

            setSync('online');

            toast('已同步云端最新数据 🎉', 'ok');

          }

        }

      }

    } else if (resp.status === 404) {

      cloudHasData = false; cloudRecordCount = 0;

      if (!isFreshDefault(S)) pushSync(); /* 本地有数据但云端没有 → 上传建立云端 */

    } else if (resp.status === 401 || resp.status === 403) {

      throw new Error('token 无效或无权限(401/403)');

    } else {

      throw new Error('HTTP ' + resp.status);

    }

    cloudReady = true; pullAttempts = 0; setSync('online');

    /* 首次 pull 完成后，补推此前因 cloudReady=false 而延迟的保存 */

    if (pendingPush) { pendingPush = false; pushSync(); }

  } catch (e) {

    if (pullAttempts < 3 && /fetch|network|timeout|failed|HTTP 5/i.test(e.message || '')) {

      const wait = pullAttempts * 2000;

      setSync('syncing', `重试(${pullAttempts})`);

      setTimeout(() => pullSync(force), wait);

      return;

    }

    cloudReady = true; pullAttempts = 0;

    const msg = (e && e.message) || '';

    const raw = /401|403/.test(msg) ? 'token无效' : (/(fetch|network|timeout|failed|HTTP)/i.test(msg) ? '网络不通' : msg || '同步失败');

    const detail = raw.slice(0, 24);

    setSync('offline', detail);

    if (force) toast('恢复失败：' + detail, 'warn');

  }

}

/* 判断当前状态是否是「空白默认」（除了种子纪念日外没有任何真实录入）。

   用于防止空白设备把云端已有的真实数据覆盖成空。 */

function isFreshDefault(s) {

  const x = s.xhs || {};

  return (s.ledger || []).length === 0

    && (s.baby && s.baby.poops || []).length === 0

    && (s.baby && s.baby.meds || []).length === 0

    && (s.publish && s.publish.notes || []).length === 0

    && (s.ruyiNotes || []).length === 0

    && (s.yayaNotes || []).length === 0

    && (s.home && s.home.rest || []).length === 0

    && (x.records || []).length === 0

    && (x.noteExpenses || []).length === 0

    && (x.rebates || []).length === 0

    && (x.limit ? Object.values(x.limit).every(l => (l.count || 0) === 0 && !(l.names || '').trim()) : true)

    && (x.base ? (x.base.followers || 0) === 0 && (x.base.notes || 0) === 0 && (x.base.zanCang || 0) === 0 : true);

}

function pushSync(force) {

  if (!GITHUB_CFG.token) { setSync('offline', '未配置云端'); return Promise.resolve(); }

  /* 云端状态未知前先延迟，避免空白/近空状态误覆盖（首次 pull 完成后会补推 pendingPush） */

  if (!cloudReady && !force) { pendingPush = true; return Promise.resolve(); }

  const localCount = totalRecords(S);

  /* 铁律：本地记录数 < 云端记录数时，绝不覆盖云端（防止近空/空白状态清掉真实数据）。

     仅当本地数据不少于云端时才允许上传。 */

  if (cloudHasData && localCount < cloudRecordCount) {

    setSync('online');

    return Promise.resolve();

  }

  clearTimeout(syncTimer);

  trimBackups(S); /* 上传前清理旧备份，控制 data.json 体积 */

  return new Promise((resolve, reject) => {

    syncTimer = setTimeout(async () => {

      try {

        const content = b64encodeUtf8(JSON.stringify(S, null, 2));

        const body = {

          message: 'sync: 更新工作台数据 ' + new Date().toISOString(),

          content, branch: GITHUB_CFG.branch

        };

        if (ghSha) body.sha = ghSha; /* 乐观锁：有 sha 才更新，避免并发覆盖 */

        const resp = await ghApi('PUT', body);

        if (resp.status === 200 || resp.status === 201) {

          const j = await resp.json();

          ghSha = j.content ? j.content.sha : ghSha;

          lastSaveTime = Date.now();

          setSync('online');

          resolve();

        } else if (resp.status === 409) {

          /* 冲突：云端已被别处更新，重新拉取最新 sha 后再推一次 */

          setSync('syncing');

          await pullSync();

          pushSync().then(resolve).catch(reject);

        } else {

          throw new Error('HTTP ' + resp.status);

        }

      } catch (e) {

        const detail = (e && e.message ? e.message : '同步失败').slice(0, 12);

        setSync('offline', detail);

        reject(e);

      }

    }, force ? 50 : 600);

  });

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

      if (!confirm('这将把备份中的数据「合并」进当前应用：只补充当前缺失的记录（如芽芽记录、小红书支出、粉丝记录等），不会删除或覆盖你已录入的红薯日历笔记等内容。确认继续？')) return;

      mergeImport(raw);

      save(); renderView(currentView);

      toast('备份已合并导入 🎉', 'ok');

    } catch (e) { toast('导入失败：' + e.message, 'warn'); }

  };

  fr.onerror = () => toast('读取文件失败', 'warn');

  fr.readAsText(file);

}

/* 按 id（无 id 则按内容）合并数组：保留当前全部，补充当前没有的部分，绝不删除现有数据 */

function mergeArr(cur, inc) {

  cur = Array.isArray(cur) ? cur.slice() : [];

  if (!Array.isArray(inc)) return cur;

  const hasId = inc.length && inc[0] && typeof inc[0] === 'object' && inc[0].id;

  if (hasId) {

    const m = new Map(cur.map(x => [x.id, x]));

    inc.forEach(x => { if (x && x.id && !m.has(x.id)) m.set(x.id, x); });

    return Array.from(m.values());

  }

  const seen = new Set(cur.map(x => JSON.stringify(x)));

  inc.forEach(x => { const k = JSON.stringify(x); if (!seen.has(k)) { seen.add(k); cur.push(x); } });

  return cur;

}

/* 智能合并导入：找回备份中当前缺失的历史数据，同时完整保留当前已录入内容 */

/* 按 id 合并：相同 id 以传入 inc 为准（云端优先），inc 没有的保留 cur。用于云端拉取时下行更新。 */

function mergeArrCloud(cur,  inc) {

  cur = Array.isArray(cur) ? cur.slice() : [];

  if (!Array.isArray(inc)) return cur;

  const incMap = new Map();

  inc.forEach(x => { if (x && x.id) incMap.set(x.id, x); });

  const out = [];

  const seen = new Set();

  cur.forEach(x => {

    if (x && x.id && incMap.has(x.id)) { out.push(incMap.get(x.id)); seen.add(x.id); }

    else { out.push(x); }

  });

  inc.forEach(x => { if (x && x.id && !seen.has(x.id)) { out.push(x); seen.add(x.id); } });

  return out;

}

function mergeImport(raw, cloudPriority) {

  const before = JSON.stringify(S); /* 用于最后判断是否有变更 */

  const def = defaultState();

  const src = Object.assign(def, raw);

  const pick = cloudPriority ? mergeArrCloud : mergeArr;

  S.baby.poops = pick(S.baby.poops, src.baby.poops);

  if (src.baby && src.baby.meds) S.baby.meds = pick(S.baby.meds || [], src.baby.meds);

  migrateBabyState();

  S.xhs.noteExpenses = pick(S.xhs.noteExpenses, src.xhs.noteExpenses);

  S.xhs.rebates = pick(S.xhs.rebates, src.xhs.rebates);

  S.ledger = pick(S.ledger, src.ledger);

  if (Array.isArray(src.home && src.home.rest)) S.home.rest = pick(S.home.rest, src.home.rest);

  /* 如意/芽芽日历笔记：云端优先时用云端最新；备份导入时仅当本地为空才用备份 */

  if (cloudPriority) {

    if (Array.isArray(src.ruyiNotes) || Array.isArray(src.yayaNotes)) {

      if (Array.isArray(src.ruyiNotes)) S.ruyiNotes = src.ruyiNotes;

      if (Array.isArray(src.yayaNotes)) S.yayaNotes = src.yayaNotes;

    } else if ((src.publish && src.publish.notes || []).length) {

      /* 兼容旧版云端：仅当本地尚未迁移过才整批归入芽芽，避免覆盖本地已有笔记 */

      if ((S.ruyiNotes || []).length === 0 && (S.yayaNotes || []).length === 0) {

        S.ruyiNotes = [];

        S.yayaNotes = (src.publish.notes || []).slice(); /* 旧红薯日历数据全部属于芽芽Mochi */

      }

    }

  } else {

    const localEmpty = (S.ruyiNotes || []).length === 0 && (S.yayaNotes || []).length === 0;

    if (localEmpty) {

      if (Array.isArray(src.ruyiNotes) || Array.isArray(src.yayaNotes)) {

        if (Array.isArray(src.ruyiNotes)) S.ruyiNotes = src.ruyiNotes;

        if (Array.isArray(src.yayaNotes)) S.yayaNotes = src.yayaNotes;

      } else if ((src.publish && src.publish.notes || []).length) {

        S.ruyiNotes = [];

        S.yayaNotes = (src.publish.notes || []).slice(); /* 旧红薯日历数据全部属于芽芽Mochi */

      }

    }

  }

  /* 小红书限流笔记：按账号合并 */

  migrateXhsAccounts();

  if (src.xhs.limit) {

    const oldFmt = (src.xhs.limit.count != null || src.xhs.limit.names != null);

    if (oldFmt) {

      /* 旧备份是全局 limit，仅当当前第一个账号无数据时才继承 */

      const first = XHS_ACCOUNTS[0];

      const curL = S.xhs.limit[first];

      if (cloudPriority || (!(curL.count || 0) && !(curL.names || '').trim())) {

        S.xhs.limit[first] = { count: src.xhs.limit.count || 0, names: (src.xhs.limit.names || '').trim() };

      }

    } else {

      XHS_ACCOUNTS.forEach(acct => {

        const incL = src.xhs.limit[acct];

        if (!incL) return;

        const curL = S.xhs.limit[acct] || { count: 0, names: '' };

        if (cloudPriority || (!(curL.count || 0) && !(curL.names || '').trim())) {

          S.xhs.limit[acct] = { count: incL.count || 0, names: (incL.names || '').trim() };

        }

      });

    }

  }

  /* 小红书粉丝/笔记/赞藏：按账号分别合并 */

  if (!src.xhs.accounts) {

    src.xhs.accounts = {};

    XHS_ACCOUNTS.forEach((acct, i) => {

      if (i === 0) src.xhs.accounts[acct] = { base: src.xhs.base || { followers: 0, notes: 0, zanCang: 0 }, records: src.xhs.records || [] };

      else src.xhs.accounts[acct] = { base: { followers: 0, notes: 0, zanCang: 0 }, records: [] };

    });

  }

  XHS_ACCOUNTS.forEach(acct => {

    const cur = S.xhs.accounts[acct] || { base: { followers: 0, notes: 0, zanCang: 0 }, records: [] };

    const inc = src.xhs.accounts[acct] || { base: { followers: 0, notes: 0, zanCang: 0 }, records: [] };

    cur.records = pick(cur.records || [], inc.records || []);

    /* 基准：当前为空则继承备份 */

    if (cloudPriority || !(cur.base && (cur.base.followers || cur.base.notes || cur.base.zanCang))) {

      if (inc.base && (inc.base.followers || inc.base.notes || inc.base.zanCang)) cur.base = { ...inc.base };

    }

    /* 基准仍为空但有记录，则取最新一条 */

    if (!(cur.base && (cur.base.followers || cur.base.notes || cur.base.zanCang)) && (cur.records || []).length) {

      const latest = cur.records.slice().sort((a, c) => (c.date || '').localeCompare(a.date || ''))[0];

      if (latest) cur.base = { followers: latest.f || 0, notes: latest.n || 0, zanCang: latest.z || 0 };

    }

    S.xhs.accounts[acct] = cur;

  });

  S.xhs.base = S.xhs.accounts[XHS_ACCOUNTS[0]].base;

  S.xhs.records = S.xhs.accounts[XHS_ACCOUNTS[0]].records;

  return JSON.stringify(S) !== before;

}

function openImportPicker() {

  const inp = document.createElement('input');

  inp.type = 'file'; inp.accept = '.json,application/json';

  inp.onchange = () => { if (inp.files && inp.files[0]) importBackup(inp.files[0]); };

  inp.click();

}

/* ---------- 云端自动备份恢复（每日快照） ---------- */

function restoreFromBackup(idx) {

  const snap = (S.backups || [])[idx];

  if (!snap) return;

  S = Object.assign(defaultState(), JSON.parse(JSON.stringify(snap.data)));

  save(); renderView(currentView); closeModal();

  toast('已恢复到 ' + snap.date + ' 的备份', 'ok');

}

function openCloudBackup() {

  const list = (S.backups || []).slice();

  if (!list.length) { toast('暂无可恢复的备份（仅保留最近 30 天）', 'warn'); return; }

  const rows = list.map((b, i) => `

    <div class="bk-row">

      <div class="bk-info">

        <div class="bk-date">${b.date}</div>

        <div class="bk-sub">${new Date(b.ts).toLocaleString('zh-CN')}</div>

      </div>

      <button class="btn btn-sm btn-primary" data-restore="${i}">恢复此份</button>

    </div>`).join('');

  const html = `<div class="modal-title">🛡 云端备份恢复</div>

    <p class="modal-tip">这是最近 ${list.length} 天的自动备份（每天首次保存时自动生成，最多留 30 天）。恢复会把当前数据替换为所选那天的状态。建议先「导出备份」留存当前数据再恢复。</p>

    <div class="bk-list">${rows}</div>`;

  const m = openModal(html, 'modal-backup');

  m.querySelectorAll('[data-restore]').forEach(btn => {

    btn.onclick = () => restoreFromBackup(+btn.getAttribute('data-restore'));

  });

}

/* ---------- 同步冲突弹窗（两端都有改动时让用户选择，绝不静默覆盖） ---------- */

function registerSW() {

  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('sw.js').then(reg => {

    /* 发现新版本 Service Worker 安装完成：提示用户刷新（加载新的 app.js/index.html）。

       这能根治「iPhone PWA 一直跑旧缓存版本、不同步」的问题。 */

    if (reg && reg.addEventListener) {

      reg.addEventListener('updatefound', () => {

        const nw = reg.installing;

        if (nw) nw.addEventListener('statechange', () => {

          if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner();

        });

      });

    }

  }).catch(() => {});

  /* 新 SW 接管页面控制权时（已在后台安装），提示刷新 */

  navigator.serviceWorker.addEventListener('controllerchange', () => { showUpdateBanner(); });

}

/* 显示「发现新版本」横幅；点击「立即刷新」硬性重载页面（跳过缓存） */

function showUpdateBanner() {

  const b = $('#updateBanner');

  if (!b || b.dataset.shown) return;

  b.dataset.shown = '1';

  b.style.display = 'flex';

  const btn = $('#updateBtn');

  if (btn) btn.addEventListener('click', () => location.reload(true));

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



/* 迁移：旧版拉屎记录里带用药（med/medMg 字段）→ 拆成独立的用药记录 */

migrateBabyState();



/* 兜底：防止旧 CSS 缓存导致移动端红薯日历仍显示桌面端大封面块 */

(function injectMobileFix() {

  const style = document.createElement('style');

  style.textContent = '@media(max-width:600px){.hs-day .hs-cover,.hs-day .hs-amt-row,.hs-day .hs-badge,.hs-day .hs-chips{display:none !important}.hs-day .hs-day-amt{display:inline-block !important}.mchip-line{display:flex !important;align-items:center !important;gap:2px !important;font-size:0 !important;width:100% !important}.mchip-dot{width:3px !important;height:3px !important;border-radius:50% !important;flex-shrink:0 !important}.mchip-txt{font-size:7px !important;font-weight:700 !important;color:#4A3F35 !important;letter-spacing:-.3px !important;line-height:1 !important;white-space:nowrap !important;overflow:visible !important;text-overflow:clip !important}}';

  document.head.appendChild(style);

})();



$('#topDate').textContent = fmtDateCN(todayStr());

/* 顶栏显示当前版本号，便于核对手机/电脑是否都运行最新版 */

const verPill = $('#verPill');

if (verPill) verPill.textContent = APP_VERSION;

/* 版本标记：写入 localStorage；若检测到之前跑的是更旧的版本，提示刷新以彻底加载新版 */

try {

  const prevVer = localStorage.getItem('cr_app_ver');

  if (prevVer && prevVer !== APP_VERSION) showUpdateBanner();

  localStorage.setItem('cr_app_ver', APP_VERSION);

} catch (e) {}

/* 点击顶部同步状态可手动重试（提前绑定，避免首页渲染异常时丢失点击能力） */

$('#syncPill').addEventListener('click', () => { retrySync(); });

try { showView('home'); } catch (e) { console.error('首页渲染异常：', e); }

initSync();

registerSW();

