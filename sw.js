const VERSION = "1.6";
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
];

self.addEventListener("message", function (ev) {
  console.log("== message ==", ev);
  if (ev?.data?.type === "INIT_PORT") {
    self._port = ev.ports[0];
  }
});

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
      } else {
        // 通过条件控制请求是否从缓存中获取数据
        self._port?.postMessage({
          type: "REQUEST",
          data: {
            ts: +new Date(),
            url: request.url,
          },
        });
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
  console.log("== install ==", ev);
  self._port?.postMessage({
    type: "LOG",
    data: {
      msg: "== install ==",
    },
  });
  const cache = await caches.open(VERSION);
  cache.addAll(cacheList);
  self.skipWaiting();
});

self.addEventListener("activate", async function (ev) {
  console.log("== activate ==", ev);
  self._port?.postMessage({
    type: "LOG",
    data: {
      msg: "== activate ==",
    },
  });
  const cacheKeys = await caches.keys();
  console.log(cacheKeys);
  cacheKeys.forEach((key) => {
    if (key !== VERSION) {
      caches.delete(key);
    }
  });

  await clients.claim();
});
