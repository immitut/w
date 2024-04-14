// position info
const POSITION = '_p'
// api key
const KEY = '_k'
// amoled mode
const AMOLED = '_a'
// auto/light/dark mode
const DISPLAYMODE = '_m'

function _saveItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function _getItem(key) {
  return JSON.parse(localStorage.getItem(key))
}

export function savePosInfo(data) {
  _saveItem(POSITION, data)
}

export function getPosInfo() {
  return _getItem(POSITION)
}

export function saveAPIKey(key) {
  _saveItem(KEY, key)
}

export function getAPIKey() {
  return _getItem(KEY)
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
