const DBINFO = {
  name: 'Nexus',
  version: 1,
  storeName: 'Record',
  key: 'id',
}

export function openDB() {
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

export function closeDB(db) {
  db?.close()
}

export function deleteDB(dbName = DBINFO.name) {
  console.log('deleteDB', dbName)
  return _dbCommonPromise(indexedDB.deleteDatabase(dbName))
}

export function addDBData(data, db, storeName = DBINFO.storeName) {
  return _dbCommonPromise(_dbCommonRequest('add', db, storeName, data))
}

export function updateDBData(data, db, storeName = DBINFO.storeName) {
  return _dbCommonPromise(_dbCommonRequest('put', db, storeName, data))
}

export function deleteDBDataByKey(key, db, storeName = DBINFO.storeName) {
  return _dbCommonPromise(_dbCommonRequest('delete', db, storeName, key))
}

export function findDBDataByKey(key, db, storeName = DBINFO.storeName) {
  const obStore = db.transaction([storeName]).objectStore(storeName)
  const request = obStore.get(key)
  return _dbCommonPromise(request)
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
