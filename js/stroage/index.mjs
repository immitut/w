// position info
const POSITION = '_p'
// position list
const POSITIONLIST = '_pl'
// api key
const KEY = '_k'
// amoled mode
const AMOLED = '_a'
// auto/light/dark mode
const DISPLAYMODE = '_m'

const DATASOURCE = '_datasource'

function _saveItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function _getItem(key) {
  return JSON.parse(localStorage.getItem(key))
}
function _deleteItem(key) {
  localStorage.removeItem(key)
}

export function clearPosInfo() {
  _deleteItem(POSITION)
}

export function savePosInfo(data) {
  _saveItem(POSITION, data)
}

export function getPosInfo() {
  return _getItem(POSITION)
}

export function savePosList(data) {
  const list = getPosList()
  if (list.length) {
    const i = list.findIndex(({ lon, lat }) => data.lat === lat && data.lon === lon)
    if (i !== -1) {
      list.splice(i, 1)
    } else if (list.length > 5) {
      list.shift()
    }
  }
  list.push(data)
  _saveItem(POSITIONLIST, list)
}

export function getPosList() {
  return _getItem(POSITIONLIST) ?? []
}

function _getKeyList() {
  return _getItem(KEY) ?? ['', '', '', '']
}

export function saveAPIKey(key) {
  const dataSource = getDataSource()
  const keyList = _getKeyList()
  keyList[dataSource] = key
  _saveItem(KEY, keyList)
}

export function getAPIKey() {
  const dataSource = getDataSource()
  const keyList = _getKeyList()
  return keyList[dataSource]
}

export function saveAmoledMode(bool) {
  _saveItem(AMOLED, bool)
}

export function getAmoledMode() {
  return _getItem(AMOLED)
}

export function saveDisplaydMode(mode) {
  _saveItem(DISPLAYMODE, mode)
}

export function getDisplayMode() {
  return _getItem(DISPLAYMODE)
}

export function saveDataSource(dataSource) {
  _saveItem(DATASOURCE, dataSource)
}

export function getDataSource() {
  return _getItem(DATASOURCE) ?? 0
}
