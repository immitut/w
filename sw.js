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

      const queryCache = async () => {
        const res = await cache.match(request);
        if (res) {
          console.log(`[cache: ${request.destination}]`, request.url);
        }
        return res;
      };

      if (request.destination) {
        const cacheRes = await queryCache();
        if (cacheRes) return cacheRes;
      }
      try {
        const resp = await fetch(request);
        if (["http:", "https:"].includes(new URL(request.url).protocol)) {
          cache.put(request, resp.clone()).catch((err) => {
            console.log(request, err);
          });
        }
        console.log("[online]", request.url);
        return resp;
      } catch (err) {
        const cacheRes = await queryCache();
        if (cacheRes) return cacheRes;
        console.log("[offline & no cache]", err);
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
