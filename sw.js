const VERSION = "1.9";
const DBINFO = {
  name: "Nexus",
  version: 1,
  storeName: "Record",
  key: "id",
};

const cacheList = [
  // "/w/",
  // "/w/index.html",
  // "/w/index.mjs",
  "/w/animation.mjs",
  "/w/api.mjs",
  "/w/common.mjs",
  // "/w/dev.mjs",
  // "/w/manifest.json",
  // "/w/manifest_dark.json",
  // "/w/style.css",
];

const _ts = (t) => (t === undefined ? +new Date() : +new Date(t));

/**
 * 检查历史记录中当前请求对应的保存信息
 * 如果没有，则返回结果，立刻去拉取最新数据
 * 如果有，且时间存储过期(过期时间可由 destination 决定)，同上
 * 反之，则告知使用缓存即可
 * @param {string} url
 * @returns {Promise}
 */
function checkCacheInfo(url) {
  return new Promise(async (resolve) => {
    const db = await openDB();
    const data = await findDataByKey(url, db);
    closeDB(db);
    if (!data) {
      resolve({ msg: `${url}: no cache`, isExpired: true });
    } else {
      const { ts, destination } = data;
      const deltaTs = _ts() - _ts(ts);
      const expiredTime = destination ? 864e5 : 30 * 60e3;
      resolve({
        msg: `checkCacheInfo: ${url}`,
        isExpired: deltaTs >= expiredTime,
      });
    }
  });
}

async function saveCacheInfo({ url, destination }) {
  const db = await openDB();
  await updateData({ id: url, destination, ts: _ts() }, db);
  closeDB(db);
}

// function sendLogMsg(data) {
//   self._port?.postMessage({
//     type: self._portMsgType.LOG,
//     data: {
//       ts: new Date(),
//       ...data,
//     },
//   });
// }

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DBINFO.name, DBINFO.version);
    request.onsuccess = (ev) => {
      const db = ev.target.result;
      resolve(db);
    };
    request.onerror = reject;
    // 初始化/升级时调用
    request.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      const obStore = db.createObjectStore(DBINFO.storeName, {
        keyPath: DBINFO.key,
      });
      obStore.createIndex("type", "type", { unique: false });
    };
  });
}

function closeDB(db) {
  db?.close();
}

function addData(data, db, storeName = DBINFO.storeName) {
  return _dbCommonActions("add", db, storeName, data);
}

function updateData(data, db, storeName = DBINFO.storeName) {
  return _dbCommonActions("put", db, storeName, data);
}

function deleteDataByKey(key, db, storeName = DBINFO.storeName) {
  return _dbCommonActions("delete", db, storeName, key);
}

function _dbCommonActions(action, db, storeName, data) {
  return new Promise((resolve, reject) => {
    const request = db
      .transaction([storeName], "readwrite")
      .objectStore(storeName)
      [action](data);
    request.onsuccess = resolve;
    request.onerror = reject;
  });
}

function findDataByKey(key, db, storeName = DBINFO.storeName) {
  return new Promise((resovle, reject) => {
    const obStore = db.transaction([storeName]).objectStore(storeName);
    const request = obStore.get(key);
    request.onsuccess = (ev) => {
      resovle(request.result);
    };
    request.onerror = reject;
  });
}

self.addEventListener("message", (ev) => {
  console.log("== message ==", ev);
  if (ev.data?.type === "INIT_PORT") {
    self._port = ev.ports[0];
    self._portMsgType = ev.data.data;
    self._port.onmessage = (ev) => {
      // const { type, data } = ev.data;
    };
  }
});

self.addEventListener("fetch", (ev) => {
  if (["http:", "https:"].includes(new URL(ev.request.url).protocol)) {
    ev.respondWith(
      (async (request) => {
        const { url, destination } = request;
        const cache = await caches.open(VERSION);
        const cacheRes = await cache.match(request);
        if (cacheRes) {
          // 通过条件控制请求是否从缓存中获取数据
          const { isExpired } = await checkCacheInfo(url);
          if (!isExpired) {
            console.log(`[cache: ${destination}]`, url);
            return cacheRes;
          }
        }
        try {
          const resp = await fetch(request);
          saveCacheInfo({ url, destination });
          cache.put(request, resp.clone()).catch((err) => {
            console.log(request, err);
          });
          console.log("[online]", url);
          return resp;
        } catch (err) {
          if (cacheRes) {
            console.log(`[cache: ${destination}]`, url);
            return cacheRes;
          }
          console.log("[offline & no cache]", err);
        }
      })(ev.request)
    );
  }
});

self.addEventListener("install", async (ev) => {
  console.log("== install ==", ev);
  const cache = await caches.open(VERSION);
  cache.addAll(cacheList);
  self.skipWaiting();
});

self.addEventListener("activate", async (ev) => {
  console.log("== activate ==", ev);
  const cacheKeys = await caches.keys();
  cacheKeys.forEach((key) => {
    if (key !== VERSION) {
      caches.delete(key);
    }
  });
  await clients.claim();
});
