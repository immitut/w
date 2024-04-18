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
  dayRander,
  Storage,
} from './js/common.mjs'
import { getWeather, getAQI, fetchGeo } from './js/api/openWeatherApi.mjs'
import {
  fetchLocationInfoByGeo,
  fetchCurrentConditionsByLocationKey,
  fetchLocationInfoByName,
  fetchHourlyForecasts,
  fetchDailyForecasts,
  fetchDailyAQI,
} from './js/api/ACCUWeatherApi.mjs'
import { createNotifList, NOTI } from './js/notif.mjs'
import { modes, switchAmoled, switchTheme, renderTheme } from './js/theme.mjs'
import { pullToRefresh } from './js/pullToRefresh.mjs'
import { VERSION } from './js/constant.mjs'

import('./js/dev.mjs')

// In order to detect if a notification has disappeared
const showNotif = createNotifList()
const OP = 'OpenWeather'
const ACCU = 'ACCUWeather'
const dataSources = [OP, ACCU]

const proxy = new Proxy(
  {},
  {
    set: function (target, key, value, receiver) {
      if (value === Reflect.get(target, key)) return true
      const elm = $(`.${key}`)
      if (!elm) {
        console.warn(`[update error]: ${key} 元素不存在`)
        Reflect.set(target, key, value, receiver)
        return true
      }
      let newVal = value

      let handler = () => {
        const renderElm = elm.firstElementChild || elm
        renderElm.textContent = typeof newVal === 'object' ? newVal?.value : newVal
      }
      if (key.startsWith('temp_')) {
        newVal = tempRander(newVal)
      }

      if (key.startsWith('per_')) {
        newVal = `${newVal}%`
      }

      if (key.startsWith('time_')) {
        if (key === 'time_dt') {
          newVal = semanticTimeExpression(newVal * 1e3)
        } else {
          newVal = timeRander(newVal * 1e3)
          const [h, m] = newVal.split(':')
          $(':root').style.setProperty(`--${key}`, (+h + m / 60).toFixed(2))
        }
      }
      if (key.startsWith('icon_')) {
        handler = () => {
          newVal = _getIconPath(newVal)
          elm.style.setProperty('--icon-url', `url("${newVal}")`)
        }
      }
      if (key.startsWith('deg_')) {
        handler = () => {
          elm.style.setProperty('--deg', `${newVal}deg`)
        }
      }
      if (key === 'num_aqi') {
        elm.className = `${key} rank_${newVal}`
      }
      if (key === 'link_about') {
        elm.href = newVal?.href
      }
      handler()
      Reflect.set(target, key, value, receiver)
      return true
    },
  },
)
window._p = proxy
function loading(elm, fn, callback) {
  return new Promise(async resolve => {
    $('.loading_ani').classList.add('show')
    await masking(elm, fn)
    $('.loading_ani').classList.remove('show')
    resolve()
    typeof callback === 'function' && callback()
  })
}

function masking(elm, fn, callback) {
  return new Promise(async resolve => {
    elm.classList.add('mask')
    await fn()
    elm.classList.remove('mask')
    resolve()
    typeof callback === 'function' && callback()
  })
}

window.onload = () => {
  updateData({ version: VERSION })
  addPullToRefresh()
  const next = () => {
    renderTheme()
    offLineCheck()
    renderSavedList()
    init()
    // setTimeout(() => {
    //   $('.temp_secondary').click()
    // }, 2e3)
    // setTimeout(() => {
    //   showNotif({ type: NOTI.info, content: 'just for test', duration: 5 })
    // }, 1e3)
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./serviceWorker.mjs', { type: 'module' })
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

function _formatACCUData({
  Country,
  AdministrativeArea,
  ParentCity,
  LocalizedName,
  GeoPosition,
  Key,
}) {
  const name = LocalizedName
  const parentCity = ParentCity?.LocalizedName ? `${ParentCity?.LocalizedName}, ` : ''
  const administrativeArea = AdministrativeArea?.LocalizedName
    ? `${AdministrativeArea?.LocalizedName}, `
    : ''
  return {
    desc: `${parentCity}${administrativeArea}${Country?.LocalizedName}`,
    name,
    lat: GeoPosition?.Latitude,
    lon: GeoPosition?.Longitude,
    locationKey: Key,
  }
}

function _formatData({ country, local_names, name, state, lat, lon }) {
  name = (local_names?.zh ?? name).split('/')[0]
  state = state ? `${state}, ` : ''
  return {
    desc: `${state}${country}`,
    name,
    lat,
    lon,
  }
}

function rendersearchResult(list) {
  const div = $('.result_list') ?? document.createElement('div')
  div.innerHTML = ''
  div.className = 'result_list'
  if (list && list.length) {
    for (const item of list) {
      const fnMap = [_formatData, _formatACCUData]
      const dataSource = Storage.getDataSource()
      const { desc, ...rest } = fnMap[dataSource](item)
      const p = document.createElement('p')
      p.onclick = () => {
        vibrate()
        Storage.savePosInfo(rest)
        Storage.savePosList(rest)
        renderSavedList()
        showNotif({
          type: NOTI.success,
          content: `地点已切换到${rest.name}`,
        })
      }
      p.textContent = rest.name + ' '
      const span = document.createElement('span')
      span.textContent = desc
      p.insertAdjacentElement('beforeend', span)
      div.appendChild(p)
    }
  } else {
    div.innerHTML = '无数据'
  }
  return div
}

function renderSavedList() {
  const list = [{ name: '我的位置' }, ...Storage.getPosList()]
  const frag = document.createDocumentFragment()
  for (const [index, item] of list.entries()) {
    const p = document.createElement('p')
    p.onclick = () => {
      vibrate()
      if (index) {
        Storage.savePosInfo(item)
      } else {
        Storage.clearPosInfo()
      }
      showNotif({
        type: NOTI.success,
        content: `地点已切换到${item.name}`,
      })
    }
    p.textContent = item.name
    frag.appendChild(p)
  }
  $('.items-saved').innerHTML = ''
  $('.items-saved').appendChild(frag)
}

$('#form').onsubmit = async ev => {
  ev.preventDefault()
  const search = $('.search')
  const value = search?.value?.trim()
  if (!value) return
  search.classList.add('input_loading')
  const key = Storage.getAPIKey()

  const fnMap = [fetchGeo, fetchLocationInfoByName]
  const dataSource = Storage.getDataSource()
  const data = await fnMap[dataSource](value, key)
  search.classList.remove('input_loading')
  const main = $('.main')
  const result_list = rendersearchResult(data)
  main.insertAdjacentElement('afterbegin', result_list)
}

$('.switch_dataSource').onclick = () => {
  vibrate()
  let i = Storage.getDataSource() ?? 0
  i++
  if (i === dataSources.length) i = 0
  Storage.saveDataSource(i)
  showNotif({
    content: `数据源：${dataSources[i]}`,
  })
}

$('.temp_cur').onclick = () => {
  vibrate()
  const key_input = $('.api_key')
  key_input.value = Storage.getAPIKey()
  key_input.onblur = ev => {
    ev.target.type = 'password'
    const { value } = ev.target
    value && Storage.saveAPIKey(value)
  }
  key_input.onfocus = ev => {
    ev.target.type = 'text'
  }
  masking(
    $('.app'),
    () => {
      const settings = $('.settings')
      settings.classList.add('show')
      return eventListenerPromise($('.title'), 'click', () => {
        settings.classList.remove('show')
      })
    },
    init,
  )
}

$('.icon_main').onclick = vibrate.bind(null, 1, init)

$('.version').onclick = () => {
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

function init(failed = false) {
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
      const notifConfig = {
        type: NOTI.success,
        content: '已更新',
      }
      const key = Storage.getAPIKey()
      try {
        if (isDevEnv() || !key || failed) {
          notifConfig.type = NOTI.warn
          notifConfig.content = 'API Key 不存在或网络异常,请稍后重试:p'
          const { _mockData } = await import('./js/data.mjs')
          data = await _mockData()
        } else {
          const params = {
            ...geoData,
            key,
          }
          const fnMap = [_fetchOpenWeatherData, _fetchACCUWeatherData]
          const dataSource = Storage.getDataSource()
          data = await fnMap[dataSource](params)
        }
        updateData(data)
        const hourlyForecastsList = await renderHourlyForecastsList(data.hourlyForecasts)
        $(`.list_hourly_forecast`).innerHTML = ''
        $(`.list_hourly_forecast`).appendChild(hourlyForecastsList)
        if (data?.dailyForecasts?.length) {
          let elm = $(`.list_daily_forecast`)
          if (!elm) {
            elm = document.createElement('div')
            elm.className = 'block list_daily_forecast'
            $('.content').appendChild(elm)
          }
          const dailyForecastsList = await renderDailyForecastsList(data.dailyForecasts)
          elm.innerHTML = ''
          elm.appendChild(dailyForecastsList)
        }
      } catch (err) {
        console.dir(err)
        const { name, code } = err
        const content = `[code: ${code}] ${name === 'AbortError' ? '请求超时' : name}`
        return showNotif({
          type: NOTI.error,
          content,
          duration: () => eventListenerPromise($('.notif'), 'click', () => init(true)),
        })
      }
      showNotif(notifConfig)
      resolve()
    })
  return loading($('.app'), fn)
}

async function _fetchACCUWeatherData(param) {
  const { lat, lon, key } = param
  let locationKey, name
  if (param.locationKey) {
    locationKey = param.locationKey
    name = param.name
  } else {
    const locationInfo = await fetchLocationInfoByGeo(`${lat},${lon}`, key)
    locationKey = locationInfo.Key
    name = locationInfo.LocalizedName
  }

  const p = { locationKey, key }
  const requestList = Promise.all([
    fetchCurrentConditionsByLocationKey(p),
    fetchHourlyForecasts(p),
    fetchDailyForecasts(p),
    fetchDailyAQI(p),
    // emmm slow down... :p
    timeoutPromise(1e3),
  ])
  const [[cur], hourlyForecasts, { Headline: headline, DailyForecasts: dailyForecasts }, [aqi]] =
    await requestList

  const UNITS = ['Metric', 'Imperial']
  const unit = UNITS[0]
  const data = {
    name_city: name,
    temp_cur: cur?.Temperature?.[unit]?.Value,
    temp_dew_point: cur?.DewPoint?.[unit]?.Value,
    temp_min: cur?.TemperatureSummary?.Past6HourRange?.Minimum?.[unit]?.Value,
    temp_max: cur?.TemperatureSummary?.Past6HourRange?.Maximum?.[unit]?.Value,
    num_pressure: cur?.Pressure?.[unit]?.Value,
    unit_pressure: cur?.Pressure?.[unit]?.Unit,
    // per_humidity: cur?.RelativeHumidity,
    per_humidity: cur?.IndoorRelativeHumidity,
    temp_feels_like: cur?.RealFeelTemperature?.[unit]?.Value,
    desc_feels_like: cur?.RealFeelTemperature?.[unit]?.Phrase,
    num_wind: cur?.Wind?.Speed?.[unit]?.Value,
    unit_wind: cur?.Wind?.Speed?.[unit]?.Unit,
    deg_wind: cur?.Wind?.Direction?.Degrees,
    desc_wind: cur?.Wind?.Direction?.Localized,
    time_sunrise: dailyForecasts?.[0]?.Sun?.EpochRise,
    time_sunset: dailyForecasts?.[0]?.Sun?.EpochSet,
    time_dt: cur?.EpochTime,
    desc_weather: cur?.WeatherText,
    icon_main: cur?.WeatherIcon,
    num_UVIndex: cur?.UVIndex,
    desc_UVIndex: cur?.UVIndexText,
    num_aqi: aqi?.CategoryValue,
    link_about: {
      value: 'AccuWeather',
      href: cur?.Link,
    },
    hourlyForecasts: hourlyForecasts.map(x => {
      return {
        temp: x?.Temperature?.Value,
        icon: x?.WeatherIcon,
        desc: x?.IconPhrase,
        time: x?.EpochDateTime,
      }
    }),
    dailyForecasts: dailyForecasts.map((x, i) => {
      const type = i === 0 && !cur?.IsDayTime ? 'Night' : 'Day'
      return {
        temp_min: x?.Temperature?.Minimum?.Value,
        temp_max: x?.Temperature?.Maximum?.Value,
        icon: x?.[type]?.Icon,
        // desc: x?.Day?.IconPhrase,
        time: x?.EpochDate,
      }
    }),
  }
  return data
}

function updateData(data) {
  const validKeys = [
    'version',
    'name_city',
    'temp_cur',
    'temp_min',
    'temp_max',
    'temp_feels_like',
    'desc_feels_like',
    'temp_dew_point',
    'num_pressure',
    'unit_pressure',
    'per_humidity',
    'num_wind',
    'unit_wind',
    'deg_wind',
    'desc_wind',
    'time_sunrise',
    'time_sunset',
    'time_dt',
    'desc_weather',
    'icon_main',
    'num_aqi',
    'num_UVIndex',
    'desc_UVIndex',
    'link_about',
  ]
  for (const key in data) {
    if (!validKeys.includes(key)) {
      // console.log(key)
      continue
    }
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

async function renderHourlyForecastsList(list) {
  const frag = document.createDocumentFragment()
  const imgLoaders = new Map()
  for (const x of list) {
    // temp icon desc time
    const div = document.createElement('div')
    div.classList.add('item_forecast')
    const time = document.createElement('p')
    time.textContent = timeRander(x?.time * 1e3)
    const icon = document.createElement('img')
    icon.src = _getIconPath(x?.icon)
    if (!imgLoaders.has(icon.src)) {
      imgLoaders.set(
        icon.src,
        new Promise(resolve => {
          icon.onload = resolve
        }),
      )
    }
    icon.alt = x?.desc
    const temp = document.createElement('p')
    temp.textContent = `${x?.desc} | ${tempRander(x?.temp)}`
    div.appendChild(time)
    div.appendChild(icon)
    div.appendChild(temp)
    frag.appendChild(div)
  }
  await Promise.all([...imgLoaders.values()])
  return frag
}

async function renderDailyForecastsList(list) {
  const frag = document.createDocumentFragment()
  const imgLoaders = new Map()
  for (const x of list) {
    // temp_min temp_max icon time
    const div = document.createElement('div')
    div.classList.add('item_forecast')
    const time = document.createElement('p')
    time.textContent = dayRander(x?.time * 1e3)
    const icon = document.createElement('img')
    icon.src = _getIconPath(x?.icon)
    if (!imgLoaders.has(icon.src)) {
      imgLoaders.set(
        icon.src,
        new Promise(resolve => {
          icon.onload = resolve
        }),
      )
    }
    icon.alt = ''
    const temp = document.createElement('p')
    temp.textContent = `${tempRander(x?.temp_min)}/${tempRander(x?.temp_max)}`
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

async function _fetchOpenWeatherData(params) {
  const requestList = Promise.all([
    getWeather('weather', params),
    getWeather('forecast', { cnt: 8, ...params }),
    getAQI(params),
    // emmm slow down... :p
    timeoutPromise(1e3),
  ])
  const [curr, forecast, aqi] = await requestList
  const data = {
    name_city: curr?.name,
    temp_cur: curr?.main?.temp,
    num_pressure: curr?.main?.pressure,
    per_humidity: curr?.main?.humidity,
    num_wind: curr?.wind?.speed,
    deg_wind: curr?.wind?.deg,
    time_sunrise: curr?.sys?.sunrise,
    time_sunset: curr?.sys?.sunset,
    time_dt: curr?.dt,
    temp_feels_like: curr?.main?.feels_like,
    desc_weather: curr?.weather?.[0]?.description,
    icon_main: curr?.weather?.[0]?.icon,
    num_aqi: AQIcalculation(aqi?.list?.[0]?.components),
    hourlyForecasts: forecast?.list?.map(x => {
      return {
        temp: x?.main?.temp,
        icon: x?.weather?.[0]?.icon,
        desc: x?.weather?.[0]?.description,
        time: x?.dt,
      }
    }),
  }
  return data
}
