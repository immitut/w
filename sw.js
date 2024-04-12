const CACHEVERSION = '1.12'
const DBINFO = {
  name: 'Nexus',
  version: 1,
  storeName: 'Record',
  key: 'id',
}

const cacheList = [
  // "/w/",
  // "/w/index.html",
  // "/w/index.mjs",
  '/w/animation.mjs',
  '/w/api.mjs',
  '/w/common.mjs',
  // "/w/dev.mjs",
  // "/w/manifest.json",
  // "/w/manifest_dark.json",
  // "/w/style.css",
]

const _ts = t => (t === undefined ? +new Date() : +new Date(t))

/**
 * Check the history for saved information corresponding to the current request
 * If not, return the result, immediately go to pull the latest data
 * If there is, and the time store expires (the expiration time can be determined by the destination), ditto
 * Instead, just tell to use cache
 * @param {string} url
 * @returns {Promise}
 */
function checkCacheInfo(url) {
  return new Promise(async resolve => {
    const db = await openDB()
    const {
      target: { result },
    } = await findDataByKey(url, db)
    closeDB(db)
    if (!result) {
      resolve({ msg: `${url}: no cache`, isExpired: true })
    } else {
      const { ts, destination } = result
      const expiredTimeMap = {
        image: 2592e6, // 30 days
        '': 18e5, // 30 mins
        // TODO: remove for better dev
        // document: 432e5, // half day
        // script: 432e5,
        // style: 432e5,
      }
      const expiredTime = expiredTimeMap[destination] ?? 6e5 // 10mins
      resolve({
        msg: `checkCacheInfo: ${url}`,
        isExpired: _ts() - _ts(ts) >= expiredTime,
      })
    }
  })
}

async function saveCacheInfo({ url, destination }) {
  const db = await openDB()
  await updateData({ id: url, destination, ts: _ts() }, db)
  closeDB(db)
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DBINFO.name, DBINFO.version)
    request.onsuccess = ev => {
      resolve(ev.target.result)
    }
    request.onerror = reject
    // Callback on initialization/upgrade
    request.onupgradeneeded = ev => {
      const db = ev.target.result
      const obStore = db.createObjectStore(DBINFO.storeName, {
        keyPath: DBINFO.key,
      })
      obStore.createIndex('type', 'type', { unique: false })
    }
  })
}

function closeDB(db) {
  db?.close()
}

function deleteDB(dbName = DBINFO.name) {
  console.log('deleteDB', dbName)
  return _dbCommonPromise(indexedDB.deleteDatabase(dbName))
}

function addData(data, db, storeName = DBINFO.storeName) {
  return _dbCommonPromise(_dbCommonRequest('add', db, storeName, data))
}

function updateData(data, db, storeName = DBINFO.storeName) {
  return _dbCommonPromise(_dbCommonRequest('put', db, storeName, data))
}

function deleteDataByKey(key, db, storeName = DBINFO.storeName) {
  return _dbCommonPromise(_dbCommonRequest('delete', db, storeName, key))
}

function _dbCommonRequest(action, db, storeName, data) {
  return db.transaction([storeName], 'readwrite').objectStore(storeName)[action](data)
}

function _dbCommonPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = resolve
    request.onerror = reject
  })
}

function findDataByKey(key, db, storeName = DBINFO.storeName) {
  const obStore = db.transaction([storeName]).objectStore(storeName)
  const request = obStore.get(key)
  return _dbCommonPromise(request)
}

self.addEventListener('message', ev => {
  // console.log("sw msg receive:", ev);
  if (ev.data?.type === 'INIT_PORT') {
    const port = ev.ports[0]
    // self._portMsgType = ev.data.data;
    port.onmessage = async ev => {
      const { type, data } = ev.data
      // console.log("sw msgChannel receive:", type, data);
      let resp
      if (type === 'reset') {
        // clear cache
        resp = await caches.delete(CACHEVERSION)
        port.postMessage({
          type: `${type}_response`,
          data: resp,
        })
        port.close()
      }
    }
  }
})

self.addEventListener('fetch', ev => {
  // console.log("fetch ev", ev);
  if (['https:'].includes(new URL(ev.request.url).protocol)) {
    // if (['http:', 'https:'].includes(new URL(ev.request.url).protocol)) {
    ev.respondWith(
      (async request => {
        const { url, destination } = request
        const cache = await caches.open(CACHEVERSION)
        const cacheRes = await cache.match(request)
        if (cacheRes) {
          // Controls whether a request get data from the cache by checking for expiration dates
          const { isExpired } = await checkCacheInfo(url)
          if (!isExpired) {
            console.log(`[cache: ${destination}]`, url)
            return cacheRes
          }
        }
        try {
          const resp = await fetch(request)
          cache
            .put(request, resp.clone())
            .then(() => {
              saveCacheInfo({ url, destination })
            })
            .catch(err => {
              console.warn(request, err)
            })
          console.log('[online]', url)
          return resp
        } catch (err) {
          if (cacheRes) {
            console.log(`[cache: ${destination}]`, url)
            return cacheRes
          }
          console.log('[offline & no cache]', err)
        }
      })(ev.request),
    )
  }
})

self.addEventListener('install', async ev => {
  console.log('== install ==', ev)
  await deleteDB()
  const cache = await caches.open(CACHEVERSION)
  cache.addAll(cacheList)
  self.skipWaiting()
})

self.addEventListener('activate', async ev => {
  console.log('== activate ==', ev)
  const cacheKeys = await caches.keys()
  cacheKeys.forEach(async key => {
    if (key !== CACHEVERSION) {
      caches.delete(key)
    }
  })
  await clients.claim()
})
