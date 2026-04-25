const CACHE_NAME = 'apinya-laundry-v1';
const CACHE_FILES = [
  './',
  './index.html'
];

// Install — cache ไฟล์หลัก
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

// Activate — ลบ cache เก่า
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — HTML ใช้ cache ก่อน (เปิดเร็ว) แล้วอัพเดทใน background
// API calls ผ่าน network เสมอ ไม่ cache ข้อมูล
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ไม่ cache API calls (Google Apps Script)
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('promptpay.io') ||
      url.hostname.includes('drive.google.com')) {
    return; // ผ่าน network ตามปกติ
  }

  // HTML/assets — cache first, update in background
  e.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(e.request);
      const fetchPromise = fetch(e.request)
        .then(res => { cache.put(e.request, res.clone()); return res; })
        .catch(() => null);
      return cached || fetchPromise;
    })
  );
});
