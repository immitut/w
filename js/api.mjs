import { _toQueryString } from './common.mjs'

const CACHEEXPIRATIONTIME = 5 * 60e3
const _cache = new Map()
let errNum = 0
const getInfo = async (api, { cached = false } = {}) => {
  const cur = +new Date()
  if (_cache.has(api)) {
    const { ts, data } = _cache.get(api)
    if (cur - ts <= CACHEEXPIRATIONTIME) {
      console.log(`${api} 已从缓存中读取`)
      return data
    }
    console.log(`${api} 缓存已过期`)
    _cache.delete(api)
  }
  try {
    return await fetch(api, { signal: AbortSignal.timeout(errNum * 2e3 + 1e4) }) // 10s timeout for single request
      .then(res => res.json())
      .then(data => {
        if (cached) {
          _cache.set(api, { ts: cur, data })
        }
        // 401
        if (data.cod === 401) {
          throw {
            code: data.cod,
            name: 'API key 校验失败',
          }
        }
        errNum = 0
        return data
      })
      .catch(err => {
        throw err
      })
  } catch (err) {
    errNum++
    throw err
  }
}

function fetchGeo(str, key) {
  const href = 'https://api.openweathermap.org/geo/1.0/direct'
  const params = {
    q: str,
    limit: 5,
    appid: key,
  }
  return getInfo(`${href}?${_toQueryString(params)}`)
}

function getAQI({ key, ...p }) {
  const href = `https://api.openweathermap.org/data/2.5/air_pollution`
  return getInfo(`${href}?${_toQueryString({ appid: key, ...p })}`)
}

function getWeather(type, { key, ...rest }) {
  const UNITS = ['standard', 'metric', 'imperial']
  const deafaultParams = {
    units: UNITS[1], // optional, but default value is standard (Kelvin)
    lang: 'zh_cn', // optional,but default value is en(English)
  }
  const href = `https://api.openweathermap.org/data/2.5/${type}`
  const params = Object.assign({}, deafaultParams, {
    appid: key,
    ...rest,
  })
  return getInfo(`${href}?${_toQueryString(params)}`)
}

export { getWeather, getAQI, fetchGeo }
