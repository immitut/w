import { $, getAmoledMode, saveAmoledMode, getDisplayMode, saveDisplaydMode } from './common.mjs'

const themeColorMetaId = 'theme-color'

export const modes = [
  { value: 'auto', text: '自动' },
  { value: 'light', text: '浅色' },
  { value: 'dark', text: '深色' },
]

export function switchAmoled() {
  const isAmoled = getAmoledMode()
  saveAmoledMode(!isAmoled)
  renderTheme()
  return isAmoled
}

export function switchTheme() {
  let i = getDisplayMode() || 0
  i++
  if (i === modes.length) i = 0
  saveDisplaydMode(i)
  renderTheme()
  return i
}

export function renderTheme() {
  const i = getDisplayMode() || '0'
  const isAmoled = getAmoledMode()
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
