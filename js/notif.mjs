import { $, timeoutPromise } from './common.mjs'
import { setThemeColor, resetThemeColor } from './theme.mjs'
export const NOTI = {
  info: 'info',
  success: 'success',
  error: 'error',
}

export function createNotifList() {
  const notifList = []
  const notifBox = $('.notif-box')
  let _n = 0

  const run = async () => {
    _n++
    if (_n > 2) return
    while (notifList.length) {
      const notifTask = notifList.shift()
      await notifTask()
      _n--
    }
  }

  const showNotif = ({ type = NOTI.info, content, duration = 2 }) => {
    notifList.push(
      () =>
        new Promise(async resolve => {
          let fn = duration
          if (typeof duration !== 'function') {
            duration = Number.isFinite(duration) ? duration : 1
            fn = () => timeoutPromise(duration * 1e3)
          }
          let notif = document.createElement('p')
          notif.className = `notif ${type}`
          notif.textContent = content
          notifBox.appendChild(notif)
          setThemeColor()
          notif.classList.add('show')
          await fn()
          fn = null
          notif.classList.remove('show')
          setTimeout(() => {
            notifBox.removeChild(notif)
            notif = null
            resetThemeColor()
            resolve()
          }, 2e2)
        }),
    )
    run()
  }
  return showNotif
}
