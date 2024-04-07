const VERSION = "1.8";
const cacheList = [
  // "/w/",
  // "/w/index.html",
  // "/w/index.mjs",
  "/w/animation.mjs",
  "/w/api.mjs",
  "/w/common.mjs",
  "/w/dev.mjs",
  // "/w/manifest.json",
  // "/w/manifest_dark.json",
  // "/w/style.css",
];
/**
 * 检查历史记录中当前请求对应的保存信息
 * 如果没有，则返回结果，立刻去拉取最新结果
 * 如果有，且时间存储过久(过期时间可由 destination 决定)，也去拉取最新结果
 * 反正，则告知使用缓存即可
 * @param {*} data
 * @returns
 */
async function checkCacheInfo(data) {
  self._port?.postMessage({ type: self._portMsgType.REQUEST, data });
  return new Promise((resolve) => {
    const { url } = data;
    if (!self._port) {
      resolve({ msg: `request too fast: ${url}`, isExpired: true });
      return;
    }
    //TODO: messageChannel 通信处理检查缓存过期的方式存在多过程异步，需改进
    setTimeout(() => {
      if (self._requestList.has(url)) {
        const { isExpired } = self._requestList.get(url);
        resolve({ msg: `checkCacheInfo res:${url}`, isExpired });
        self._requestList.delete(url);
      } else {
        resolve({ msg: `checkCacheInfo timeout:${url}`, isExpired: true });
      }
    }, 50);
  });
}

function sendCacheMsg(data) {
  self._port?.postMessage({
    type: self._portMsgType.CACHE,
    data: {
      ts: new Date(),
      ...data,
    },
  });
}

function sendLogMsg(data) {
  self._port?.postMessage({
    type: self._portMsgType.LOG,
    data: {
      ts: new Date(),
      ...data,
    },
  });
}

self.addEventListener("message", function (ev) {
  console.log("== message ==", ev);
  if (ev.data?.type === "INIT_PORT") {
    self._port = ev.ports[0];
    self._portMsgType = ev.data.data;
    self._requestList = new Map();
    self._port.onmessage = (ev) => {
      const { type, data } = ev.data;
      if (type === self._portMsgType.CACHEINFO) {
        if (data) {
          const { ts, destination, url } = data;
          const deltaTs = +new Date() - new Date(ts);
          const expiredTime = destination ? 864e5 : 30 * 60e3;
          self._requestList.set(url, { isExpired: deltaTs >= expiredTime });
        }
      }
    };
  }
});

self.addEventListener("fetch", function (ev) {
  ev.respondWith(
    (async (request) => {
      const cache = await caches.open(VERSION);
      // 通过条件控制请求是否从缓存中获取数据
      const { isExpired, msg } = await checkCacheInfo({ url: request.url });
      // console.log(isExpired, msg);
      const cacheRes = await cache.match(request);
      if (!isExpired && cacheRes) {
        console.log(`[cache: ${request.destination}]`, request.url);
        return cacheRes;
      }
      try {
        const resp = await fetch(request);
        if (["http:", "https:"].includes(new URL(request.url).protocol)) {
          sendCacheMsg({
            url: request.url,
            destination: request.destination,
          });
          cache.put(request, resp.clone()).catch((err) => {
            console.log(request, err);
          });
        }
        console.log("[online]", request.url);
        return resp;
      } catch (err) {
        if (cacheRes) {
          return cacheRes;
        }
        console.log("[offline & no cache]", err);
      }
    })(ev.request)
  );
});

self.addEventListener("install", async function (ev) {
  console.log("== install ==", ev);
  sendLogMsg({
    msg: "== install ==",
  });
  const cache = await caches.open(VERSION);
  cache.addAll(cacheList);
  self.skipWaiting();
});

self.addEventListener("activate", async function (ev) {
  console.log("== activate ==", ev);
  sendLogMsg({
    msg: "== activate ==",
  });
  const cacheKeys = await caches.keys();
  cacheKeys.forEach((key) => {
    if (key !== VERSION) {
      caches.delete(key);
    }
  });

  await clients.claim();
});
