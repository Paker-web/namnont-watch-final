/* Service worker ของน้ำนนท์ Watch — เก็บเฉพาะ "หน้าคงที่" ไว้ใช้ตอนออฟไลน์
 * - ไม่แคชหน้าที่มีข้อมูลสด (/, /water, /weather, /dams) และไม่แคช /api เลย
 *   เพราะข้อมูลน้ำที่เก่าโดยไม่มีป้าย "ค้าง" อันตรายกว่าไม่แสดง
 * - เมื่อเปลี่ยนเวอร์ชัน แก้ VERSION เพื่อล้างแคชเก่า */
const VERSION = "v1";
const STATIC_CACHE = `nnw-static-${VERSION}`;
const PAGE_CACHE = `nnw-pages-${VERSION}`;
const OFFLINE_URL = "/offline";
const CACHEABLE_PAGES = ["/help", "/prepare", "/about", "/map", OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => Promise.allSettled(CACHEABLE_PAGES.map((u) => cache.add(u)))).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGE_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // ไฟล์ static ที่มี hash ในชื่อ: cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // การเปิดหน้า: network-first → ถ้าเน็ตล่ม ใช้หน้าที่แคชไว้ → ไม่มี ก็ไปหน้า /offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && CACHEABLE_PAGES.includes(url.pathname)) {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) ?? (await caches.match(OFFLINE_URL)) ?? Response.error()),
    );
  }
});
