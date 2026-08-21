/* 常如意工作台 · Service Worker（离线缓存壳，保证稳定打开） */
const CACHE = 'changruyi-workbench-v4';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 自定义 APP 图标：页面把用户上传的图存进 IndexedDB（key: appIconCustom），
   SW 拦截 /app-custom-icon*.png 请求并从 IDB 返回，从而让 iPhone 主屏图标换成真实同源 URL。 */
function serveCustomIcon(reqUrl) {
  return new Promise((resolve) => {
    let req;
    try { req = indexedDB.open('changruyi', 1); } catch (e) { resolve(fetch(reqUrl)); return; }
    req.onsuccess = () => {
      const db = req.result;
      try {
        const tx = db.transaction('kv', 'readonly');
        const get = tx.objectStore('kv').get('appIconCustom');
        get.onsuccess = () => {
          const val = get.result;
          if (val && val.dataUrl && val.dataUrl.indexOf('data:image') === 0) {
            try {
              const b64 = val.dataUrl.split(',')[1];
              const bin = atob(b64);
              const arr = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
              resolve(new Response(arr.buffer, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } }));
            } catch (e) { resolve(fetch(reqUrl)); }
          } else { resolve(fetch(reqUrl)); }
        };
        get.onerror = () => resolve(fetch(reqUrl));
      } catch (e) { resolve(fetch(reqUrl)); }
    };
    req.onerror = () => resolve(fetch(reqUrl));
  });
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // 跨域（如 Supabase）走网络，不缓存
  if (u.origin !== location.origin) return;
  // 自定义图标：从 IndexedDB 返回
  if (u.pathname.indexOf('/app-custom-icon') !== -1) {
    e.respondWith(serveCustomIcon(e.request));
    return;
  }
  // 网络优先：联网时永远拉最新文件（保证部署后刷新即生效），离线才用缓存兜底
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
