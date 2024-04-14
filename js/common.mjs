import { getPosInfo } from './stroage/index.mjs'

export {
  savePosInfo,
  getPosInfo,
  saveAPIKey,
  getAPIKey,
  saveAmoledMode,
  getAmoledMode,
  saveDisplaydMode,
  getDisplayMode,
} from './stroage/index.mjs'

export function _zeroPrefix(s) {
  return `0${s}`.slice(-2)
}

export function tempRander(value) {
  return `${Math.round(value)}°`
}

export function timeRander(t) {
  const d = new Date(t)
  const h = _zeroPrefix(d.getHours())
  const m = _zeroPrefix(d.getMinutes())
  return `${h}:${m}`
}

export function semanticTimeExpression(t) {
  const d = +new Date(t)
  const delta = new Date() - d
  const temp = [
    { t: 1, s: '刚刚' },
    { t: 5, s: '不久前' },
    { t: 10, s: '10分钟前' },
    { t: 20, s: '20分钟前' },
    { t: 30, s: '半小时前' },
    { t: 60, s: '一小时内' },
  ]
  const x = temp.find(({ t }) => delta <= t * 60e3)
  if (x) return x.s
  return timeRander(t)
}

// export function dateRander(t) {
//   const d = new Date(t * 1000);
//   const m = _zeroPrefix(d.getMonth() + 1);
//   const day = _zeroPrefix(d.getDate());
//   const time = timeRander(t);
//   return `${m}.${day} ${time}`;
// }

export function isDevEnv() {
  const { searchParams } = new URL(location.href)
  return searchParams.has('dev')
}

export function _getIconPath(value) {
  if (!value) return null
  const [i, t] = value.match(/(\d+)|(\D+)/g)
  const map = {
    '01': 'clear-',
    '02': 'pcloudy-',
    '03': 'mcloudy',
    '04': 'mcloudy',
    '09': 'tshower-',
    10: 'showers-',
    11: 'tstorm',
    13: 'snow-',
    50: 'fog-',
  }
  const types = {
    d: 'day',
    n: 'night',
  }
  let icon = map[i] ?? 'unknown'
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  const style = isDarkMode ? 'dark' : 'light'
  if (icon.endsWith('-')) icon += types[t]
  return `/w/assets/icons/${style}/${icon}.png` // ./assets/icons/dark/unknown.png
}

export function _toQueryString(o) {
  return Object.keys(o)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(o[k])}`)
    .join('&')
}

/**
 * @param {string} cssSelector
 * @returns {HTMLElement | null}
 */
export function $(cssSelector) {
  return document.querySelector(cssSelector)
}

export function vibrate(pattern = 1, callback) {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
  typeof callback === 'function' && callback()
}

export function get1rem() {
  return parseInt(getComputedStyle($(':root')).getPropertyValue('--rem'))
}

export function initGeo() {
  return new Promise(resolve => {
    const pos = getPosInfo()
    if (pos) {
      const { lon, lat } = pos
      resolve({ lon, lat })
      return
    }
    const defaultPos = {
      lon: 120.155,
      lat: 30.1804,
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          // console.log(position.coords);
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        function (err) {
          console.log(`[code:${err.code}] ${err.message}`)
          resolve(defaultPos)
        },
      )
    } else {
      // geolocation is not supported
      console.log('Geolocation is not supported by this browser.')
      resolve(defaultPos)
    }
  })
}

export function AQIcalculation(data) {
  const range = [0, 50, 100, 150, 200, 300, 400, 500]
  const map = {
    co: [0, 5000, 10000, 35000, 60000, 90000, 120000, 150000],
    no2: [0, 100, 200, 700, 1200, 2340, 3090, 3840],
    o3: [0, 160, 200, 300, 400, 800, 1000, 1200],
    pm2_5: [0, 35, 75, 115, 150, 250, 350, 500],
    pm10: [0, 50, 150, 250, 350, 420, 500, 600],
    s02: [0, 150, 500, 650, 800, 1600, 2100, 2620],
  }
  function _calc(c, i, v) {
    return ((range[i] - range[i - 1]) / (c[i] - c[i - 1])) * (v - c[i - 1]) + range[i - 1]
  }
  let max = 0
  let x
  for (const k in data) {
    const curr = map[k]
    if (!curr) continue
    const i = curr.findIndex(x => x >= data[k])
    if (i === -1) {
      max = Math.max(max, 500)
      x = k
      // console.log(k);
      continue
    }
    if (i === 0) {
      // console.log(0, k);
      continue
    }
    const res = _calc(curr, i, data[k])
    if (res > max) {
      max = res
      x = k
    }
    // console.log(res, k);
  }
  // console.log(max, x);
  const finalRange = [0, 50, 100, 150, 200, 300, Infinity]
  const fin = finalRange.findIndex(y => y >= max)
  return fin
}

async function checkPromiseState(promise) {
  const _t = {}
  let s
  try {
    const res = await Promise.race([promise, _t])
    s = res === _t ? 'pending' : 'fulfilled'
  } catch (err) {
    s = 'rejected'
  }
  return s
}

export async function isPromiseDone(promise) {
  const res = await checkPromiseState(promise)
  return res !== 'pending'
}

export function timeoutPromise(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

/**
 *
 * @param {HTMLElement} elm
 * @param {keyof HTMLElementEventMap} event
 * @param {function | null} callback
 * @returns Promise
 */
export function eventListenerPromise(elm, event, callback) {
  const defaultOpts = { once: true }
  return new Promise(resolve => {
    const _callback =
      typeof callback === 'function'
        ? ev => {
            callback(ev)
            resolve()
          }
        : resolve
    elm.addEventListener(event, _callback, defaultOpts)
  })
}
