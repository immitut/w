import { _toQueryString, request } from '../common.mjs'

function fetchGeo(str, key) {
  const href = 'https://api.openweathermap.org/geo/1.0/direct'
  const params = {
    q: str,
    limit: 5,
    appid: key,
  }
  return request(`${href}?${_toQueryString(params)}`)
}

function getAQI({ key, ...p }) {
  const href = `https://api.openweathermap.org/data/2.5/air_pollution`
  return request(`${href}?${_toQueryString({ appid: key, ...p })}`)
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
  return request(`${href}?${_toQueryString(params)}`)
}

export { getWeather, getAQI, fetchGeo }
