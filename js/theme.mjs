import { $, saveItem, getItem } from './common.mjs'

const MODE = 'm'
const AMOLED = 'a'

export const modes = [
  { value: 'auto', text: '自动' },
  { value: 'light', text: '浅色' },
  { value: 'dark', text: '深色' },
]
const themeColorMetaId = 'theme-color'

export function switchAmoled() {
  const isAmoled = !!getItem(AMOLED)
  saveItem(AMOLED, !isAmoled)
  renderTheme()
  return isAmoled
}

export function switchTheme() {
  let i = getItem(MODE) || 0
  i++
  if (i === modes.length) i = 0
  saveItem(MODE, i)
  renderTheme()
  return i
}

export function renderTheme() {
  const i = getItem(MODE) || '0'
  const isAmoled = !!getItem(AMOLED)
  $('body').className = isAmoled ? `${modes[i].value} amoled` : modes[i].value
  resetThemeColor()
}

export function resetThemeColor() {
  const bgColor = getComputedStyle($('body')).getPropertyValue('--bg-color')
  setThemeColor(`rgb(${bgColor})`)
}

export function setThemeColor(color) {
  const elm = $(`#${themeColorMetaId}`)
  if (elm) {
    const _color = $('.notif') ? getComputedStyle($('.notif')).backgroundColor : color
    elm.setAttribute('content', _color)
  } else {
    const meta = document.createElement('meta')
    meta.id = themeColorMetaId
    meta.name = 'theme-color'
    meta.content = color
    document.head.appendChild(meta)
  }
}
