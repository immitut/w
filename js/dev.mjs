import { $ } from './common.mjs'

$('.temp_secondary').addEventListener('dblclick', showInfo)

function showInfo() {
  const d = getDevInfo()
  const s = getScreenInfo()
  _display(d + s)
}

function getDevInfo() {
  return Object.keys(localStorage).reduce((res, key) => {
    const data = localStorage.getItem(key)
    res += `[${key}]: ${data},\n`
    return res
  }, '')
}

function getScreenInfo() {
  return Object.keys(window).reduce((res, cur) => {
    if (['number'].includes(typeof window[cur]) && window[cur] !== 0) {
      res += `[${cur}]: ${window[cur]},\n`
    }
    return res
  }, '')
}

function _display(content) {
  alert(content)
}
