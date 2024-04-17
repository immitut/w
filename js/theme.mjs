import { $, Storage } from './common.mjs'

const themeColorMetaId = 'theme-color'

export const modes = [
  { value: 'auto', text: '自动' },
  { value: 'light', text: '浅色' },
  { value: 'dark', text: '深色' },
]

export function switchAmoled() {
  const isAmoled = Storage.getAmoledMode()
  Storage.saveAmoledMode(!isAmoled)
  renderTheme()
  return isAmoled
}

export function switchTheme() {
  let i = Storage.getDisplayMode() || 0
  i++
  if (i === modes.length) i = 0
  Storage.saveDisplaydMode(i)
  renderTheme()
  return i
}

export function renderTheme() {
  const i = Storage.getDisplayMode() || '0'
  const isAmoled = Storage.getAmoledMode()
  $('body').className = isAmoled ? `${modes[i].value} amoled` : modes[i].value
  resetThemeColor()
}

export function resetThemeColor() {
  const bgColor = getComputedStyle($('body')).getPropertyValue('--color-container')
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
