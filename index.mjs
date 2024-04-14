import {
  _zeroPrefix,
  tempRander,
  timeRander,
  semanticTimeExpression,
  AQIcalculation,
  isDevEnv,
  _getIconPath,
  $,
  get1rem,
  initGeo,
  vibrate,
  timeoutPromise,
  eventListenerPromise,
} from './js/common.mjs'
import { getWeather, getAQI, fetchGeo } from './js/api.mjs'
import { createNotifList, NOTI } from './js/notif.mjs'
import { modes, switchAmoled, switchTheme, renderTheme } from './js/theme.mjs'
import { pullToRefresh } from './js/pullToRefresh.mjs'
import('./js/dev.mjs')

const VERSION = '0.3.13'

// In order to detect if a notification has disappeared
const showNotif = createNotifList()

const proxy = new Proxy(
  {},
  {
    set: function (target, key, value, receiver) {
      if (!$(`.${key}`)) {
        console.warn(`[update error]: ${key} 不存在`)
        return true
      }
      if (key.startsWith('temp_')) {
        value = tempRander(value)
      }
      if (key.startsWith('per_')) {
        value = `${value}%`
      }
      if (key.startsWith('spe_')) {
        value = `${value?.toFixed(1)}m/s`
      }
      if (key.startsWith('atm_')) {
        value = `${value}hPa`
      }
      if (key.startsWith('time_')) {
        if (key === 'time_dt') {
          value = semanticTimeExpression(value * 1e3)
        } else {
          value = timeRander(value * 1e3)
          const [h, m] = value.split(':')
          $(':root').style.setProperty(`--${key}`, (+h + m / 60).toFixed(2))
        }
      }
      if (key.startsWith('icon_')) {
        updateIcon(key, value)
        return true
      }
      if (key.startsWith('deg_')) {
        $(`.${key}`).style.setProperty('--deg', `${value}deg`)
        return true
      }
      if (key === 'num_aqi') {
        $(`.${key}`).className = `${key} rank_${value}`
      }
      const renderElm = $(`.${key}`).firstElementChild || $(`.${key}`)
      renderElm.textContent = value
      Reflect.set(target, key, value, receiver)
      return true
    },
  },
)

function loading(elm, fn) {
  return new Promise(async resolve => {
    elm.classList.add('loading')
    $('.loading_ani').classList.add('show')
    await fn()
    elm.classList.remove('loading')
    $('.loading_ani').classList.remove('show')
    resolve()
  })
}

window.onload = () => {
  updateData({ version: VERSION })
  addPullToRefresh()
  const next = () => {
    renderTheme()
    offLineCheck()
    init()
    // setTimeout(() => {
    //   showNotif({ type: NOTI.info, content: 'just for test', duration: 5 })
    // }, 1e3)
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(ev => {
        console.log('register done')
      })
      .catch(err => {
        console.log('[err]:', err)
      })
      .finally(next)
  } else {
    next()
  }
}

$('.name_city').onclick = () => {
  loading($('.app'), () => {
    const settings = $('.settings')
    settings.classList.add('show')
    return eventListenerPromise($('.bg_ani'), 'click', () => {
      settings.classList.remove('show')
    })
  })
}

$('.icon_main').onclick = vibrate.bind(null, 1, init)

$('.time_dt').onclick = () => {
  vibrate()
  const isAmoled = switchAmoled()
  showNotif({
    content: `纯黑模式：${isAmoled ? '关' : '开'}`,
  })
}

$('.switch-mode-btn').onclick = () => {
  vibrate()
  const i = switchTheme()
  showNotif({
    content: `${modes[i].text}模式`,
  })
}

$('.num_aqi').ondblclick = () => {
  if (!'serviceWorker' in navigator) {
    alert('not support serviceWorker')
    return
  }
  const port1 = initMsgChannel(navigator.serviceWorker.controller)
  if (!port1) {
    alert('fail to init message channel.')
    return
  }
  port1.onmessage = ev => {
    const { type, data } = ev.data
    // console.log("page msgChannel receive:", type, data);
    if (type.startsWith('reset')) {
      if (data) {
        localStorage.clear()
        alert('缓存已强制清除')
      }
      port1.close()
    }
  }
  port1.postMessage({
    type: 'reset',
  })
}

function initMsgChannel(controller) {
  if (!controller) return null
  const { port1, port2 } = new MessageChannel()
  const msgTypes = {
    REQUEST: 'request',
    CACHE: 'cache',
    CACHEINFO: 'cacheInfo',
  }
  controller.postMessage(
    {
      type: 'INIT_PORT',
      data: msgTypes,
    },
    [port2],
  )
  return port1
}

function updateIcon(key, value) {
  const iconpath = _getIconPath(value)
  $(`.${key}`).style.setProperty('--icon-url', `url("${iconpath}")`)
}

function getCurrWeather(p) {
  return getWeather('weather', p)
}

function getForecastWeather(p) {
  return getWeather('forecast', p)
}

// const searchBtn = document.querySelector("#submit");
// searchBtn.onclick = async () => {
//   const input = document.querySelector("input");
//   const data = await fetchGeo(input.value);
//   console.log(data);
// };

function init() {
  const fn = () =>
    new Promise(async resolve => {
      const geoData = await initGeo()
      if (!geoData) {
        showNotif({
          type: NOTI.error,
          content: '无有效定位信息',
        })
        resolve()
        return
      }
      let data = {}
      try {
        if (isDevEnv()) {
          const { _mockData } = await import('./js/data.mjs')
          data = await _mockData()
        } else {
          const requestList = Promise.all([
            getCurrWeather(geoData),
            getForecastWeather({ cnt: 8, ...geoData }),
            getAQI(geoData),
            // emmm slow down... :p
            timeoutPromise(1e3),
          ])
          const [curr, forecast, aqi] = await requestList
          data = {
            ...curr,
            forecast: forecast.list,
            aqi: aqi.list[0],
          }
        }
        updateData(data)
        const list = await renderList(data.forecast)
        $(`.list_forecast`).innerHTML = ''
        $(`.list_forecast`).appendChild(list)
      } catch (err) {
        // console.dir(err)
        const { name, code } = err
        const content = `[code: ${code}] ${name === 'AbortError' ? '请求超时' : name}`
        return showNotif({
          type: NOTI.error,
          content,
          duration: () => eventListenerPromise($('.notif'), 'click', init),
        })
      }
      showNotif({
        type: NOTI.success,
        content: '已更新',
      })
      resolve()
    })
  return loading($('.app'), fn)
}

function updateData({ main, wind, sys, weather, dt, aqi, version, name }) {
  const data = {
    version,
    name_city: name,
    temp_cur: main?.temp,
    // temp_min: main?.temp_min,
    // temp_max: main?.temp_max,
    atm_pressure: main?.pressure,
    per_humidity: main?.humidity,
    spe_wind: wind?.speed,
    deg_wind: wind?.deg,
    time_sunrise: sys?.sunrise,
    time_sunset: sys?.sunset,
    time_dt: dt,
    // spe_wind:wind?.gust,
    temp_feels_like: main?.feels_like,
    desc: weather?.[0]?.description,
    icon_main: weather?.[0]?.icon,
    num_aqi: AQIcalculation(aqi?.components),
  }

  for (const key in data) {
    if (data[key] !== undefined) {
      proxy[key] = data[key]
    }
  }
}

function offLineCheck() {
  const offLineCallback = () => {
    showNotif({
      type: NOTI.error,
      content: '无网络',
      duration: () => eventListenerPromise(window, 'online'),
    })
  }
  window.addEventListener('offline', offLineCallback)
  if (!navigator.onLine) {
    offLineCallback()
  }
}

async function renderList(list) {
  const frag = document.createDocumentFragment()
  const imgLoaders = new Map()
  for (const item of list) {
    const { dt, weather, main } = item
    const div = document.createElement('div')
    div.classList.add('item_forecast')
    const time = document.createElement('p')
    time.textContent = timeRander(dt * 1e3)
    const icon = document.createElement('img')
    icon.src = _getIconPath(weather?.[0]?.icon)
    if (!imgLoaders.has(icon.src)) {
      imgLoaders.set(
        icon.src,
        new Promise(resolve => {
          icon.onload = resolve
        }),
      )
    }
    icon.alt = weather?.[0]?.description
    const temp = document.createElement('p')
    temp.textContent = tempRander(main?.temp)
    div.appendChild(time)
    div.appendChild(icon)
    div.appendChild(temp)
    frag.appendChild(div)
  }
  await Promise.all([...imgLoaders.values()])
  return frag
}

function addPullToRefresh() {
  const loading_ani = $('.loading_ani')
  pullToRefresh($('.app'), {
    distThreshold: 50 * get1rem(),
    distMax: 60 * get1rem(),
    onReachThreshold: () => {
      vibrate()
    },
    onMove: (elm, p) => {
      const x = p * p
      elm.style.filter = `blur(${16 * x}px) grayscale(${x})`
      loading_ani.style.opacity = x
      loading_ani.style.transform = `translateY(${20 * x}rem)`
      $('.bg_ani').style.setProperty('--ani-delay', `${-2.4 * x}s`)
    },
    onPullEnd: reachThreshold => {
      loading_ani.style = ''
      if (reachThreshold) {
        return init()
      }
    },
  })
}
