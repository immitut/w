const VERSION = "1.2";
const cacheList = [
  "/w/",
  "/w/index.html",
  "/w/index.mjs",
  "/w/animation.mjs",
  "/w/api.mjs",
  "/w/common.mjs",
  "/w/dev.mjs",
  // "/w/manifest.json",
  // "/w/manifest_dark.json",
  "/w/style.css",
  // "/w/assets/",
];

self.addEventListener("fetch", function (ev) {
  ev.respondWith(
    (async (request) => {
      const cache = await caches.open(VERSION);
      try {
        const resp = await fetch(request);
        cache.put(request, resp.clone()).catch((err) => {
          console.log(request, err);
        });
        console.log("[online]", request.url);
        return resp;
      } catch (err) {
        const cacheRes = await cache.match(request);
        if (cacheRes) {
          console.log("[cache]", request.url, cacheRes);
          return cacheRes;
        }
        console.log("[既无网络,也无缓存]", err);
      }
    })(ev.request)
  );
});

self.addEventListener("install", async function (ev) {
  console.log("install", ev);
  const cache = await caches.open(VERSION);
  cache.addAll(cacheList);
  self.skipWaiting();
});

self.addEventListener("activate", async function (ev) {
  console.log("activate", ev);
  const cacheKeys = await caches.keys();
  console.log(cacheKeys);
  cacheKeys.forEach((key) => {
    if (key !== VERSION) {
      caches.delete(key);
    }
  });

  await clients.claim();
});
