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
  saveItem,
  getItem,
  initGeo,
  vibrate,
  isPromisesAllDone,
} from './common.mjs'
import { getWeather, getAQI, fetchGeo } from './api.mjs'
import { pullToRefresh } from './pullToRefresh.mjs'
import('./dev.mjs')

const VERSION = '0.3.3'
const MODE = 'm'
const AMOLED = 'a'
const modes = [
  { value: 'auto', text: '自动' },
  { value: 'light', text: '浅色' },
  { value: 'dark', text: '深色' },
]
const themeColorMetaId = 'theme-color'
const NOTI = {
  info: '0',
  success: '1',
  error: '2',
}
// In order to detect if a notification has disappeared
let _currNotifDurationTask
const showNotif = _createNotifList()
window.showNotif = showNotif

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

      $(`.${key}`).dataset[key] = value
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

window.s = function () {
  showNotif({
    type: NOTI.success,
    content: `code: ${Math.random() * 100}`,
    duration: () =>
      new Promise(r => {
        window.c = r
      }),
  })
}
window.onload = () => {
  // showNotif({ type: NOTI.info, content: 'just for test', duration: 10000 })
  updateData({ version: VERSION })
  addPullToRefresh()
  const next = () => {
    renderTheme()
    offLineCheck()
    init()
  }
  if ('serviceWorker' in navigator) {
    // const { port1, port2 } = new MessageChannel();
    // const msgTypes = {
    //   REQUEST: "request",
    //   LOG: "log",
    //   CACHE: "cache",
    //   CACHEINFO: "cacheInfo",
    // };
    // navigator.serviceWorker.ready.then(async (res) => {
    //   console.log("serviceWorker ready");
    //   const _controlledPromise = new Promise(function (resolve) {
    //     const resolveWithRegistration = function () {
    //       navigator.serviceWorker
    //         .getRegistration()
    //         .then(function (registration) {
    //           resolve(registration);
    //         });
    //     };

    //     if (navigator.serviceWorker.controller) {
    //       resolveWithRegistration();
    //     } else {
    //       navigator.serviceWorker.addEventListener(
    //         "controllerchange",
    //         resolveWithRegistration
    //       );
    //     }
    //   });
    //   await _controlledPromise;
    //   console.log("serviceWorker.controller ready");
    //   navigator.serviceWorker.controller.postMessage(
    //     {
    //       type: "INIT_PORT",
    //       data: msgTypes,
    //     },
    //     [port2]
    //   );
    //   port1.onmessage = (ev) => {
    //     const { type, data } = ev.data;
    //     if (type === msgTypes.LOG) {
    //       console.log(data);
    //     }
    //   };
    // });
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

$('.icon_main').onclick = vibrate.bind(null, 1, init)
$('.time_dt').onclick = () => {
  vibrate(1, switchAmoled)
}
$('.switch-mode-btn').onclick = vibrate.bind(null, 1, switchTheme)
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

function timeoutPromise(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
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

      if (isDevEnv()) {
        const { _mockData } = await import('./data.mjs')
        data = await _mockData()
      } else {
        const requestList = Promise.all([
          getCurrWeather(geoData),
          getForecastWeather({ cnt: 8, ...geoData }),
          getAQI(geoData),
          // emmm slow down... :p
          timeoutPromise(1e3),
        ])
        try {
          const [curr, forecast, aqi] = await requestList
          data = {
            ...curr,
            forecast: forecast.list,
            aqi: aqi.list[0],
          }
        } catch (err) {
          // console.dir(err)
          const { name, code } = err
          const content = `[code: ${code}] ${name === 'AbortError' ? '请求超时' : name}`
          return showNotif({
            type: NOTI.error,
            content,
            duration: () =>
              new Promise(resolve => {
                $('.notif').addEventListener(
                  'click',
                  () => {
                    resolve()
                    init()
                  },
                  { once: true },
                )
              }),
          })
        }
      }
      updateData(data)
      const list = await renderList(data.forecast)
      $(`.list_forecast`).innerHTML = ''
      $(`.list_forecast`).appendChild(list)
      showNotif({
        type: NOTI.success,
        content: '已更新',
      })
      resolve()
    })
  return loading($('.app'), fn)
}

function updateData({ main, wind, sys, weather, dt, clouds, aqi, version }) {
  const data = {
    version,
    temp_cur: main?.temp,
    // temp_min: main?.temp_min,
    // temp_max: main?.temp_max,
    atm_pressure: main?.pressure,
    per_humidity: main?.humidity,
    // per_clouds: clouds?.all,
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

function switchAmoled() {
  const isAmoled = !!getItem(AMOLED)
  saveItem(AMOLED, !isAmoled)
  renderTheme()
  showNotif({
    content: `纯黑模式：${isAmoled ? '关' : '开'}`,
    duration: 1,
  })
}

function switchTheme() {
  let i = getItem(MODE) || 0
  i++
  if (i === modes.length) i = 0
  saveItem(MODE, i)
  renderTheme()
  showNotif({
    content: `${modes[i].text}模式`,
    duration: 1,
  })
}

function renderTheme() {
  const i = getItem(MODE) || '0'
  const isAmoled = !!getItem(AMOLED)
  $('body').className = isAmoled ? `${modes[i].value} amoled` : modes[i].value
  resetThemeColor()
}

function resetThemeColor() {
  const bgColor = getComputedStyle($('body')).getPropertyValue('--bg-color')
  setThemeColor(`rgb(${bgColor})`)
}

async function setThemeColor(color) {
  if (!color) return
  const elm = $(`#${themeColorMetaId}`)
  if (elm) {
    const isPriNotifGone = await isPromisesAllDone(_currNotifDurationTask)
    const _color = isPriNotifGone ? color : getComputedStyle($('.notif')).backgroundColor
    elm.setAttribute('content', _color)
  } else {
    const meta = document.createElement('meta')
    meta.id = themeColorMetaId
    meta.name = 'theme-color'
    meta.content = color
    document.head.appendChild(meta)
  }
}

function getThemeColor() {
  return $(`#${themeColorMetaId}`)?.getAttribute('content')
}

function _createNotifList() {
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
          const isPriNotifGone = await isPromisesAllDone(_currNotifDurationTask)
          let notif = document.createElement('div')
          notif.className = 'notif'
          notif.textContent = content
          notif.dataset.notif_type = type
          notifBox.appendChild(notif)
          const color = getComputedStyle(notif).backgroundColor
          notif.classList.add('show')
          setThemeColor(color)
          let fn = duration
          if (typeof duration !== 'function') {
            duration = Number.isFinite(duration) ? duration : 1
            fn = () => timeoutPromise(duration * 1e3)
          }
          if (isPriNotifGone) {
            await (_currNotifDurationTask = fn())
            _currNotifDurationTask = null
          } else {
            await fn()
            fn = null
          }
          notif.classList.remove('show')
          setTimeout(() => {
            notifBox.removeChild(notif)
            notif = null
            resetThemeColor()
            resolve()
          }, 1e2)
        }),
    )
    run()
  }
  return showNotif
}

function offLineCheck() {
  const offLineCallback = () => {
    showNotif({
      type: NOTI.error,
      content: '无网络',
      duration: () =>
        new Promise(resolve => {
          window.addEventListener('online', resolve, { once: true })
        }),
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
      vibrate(1)
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
