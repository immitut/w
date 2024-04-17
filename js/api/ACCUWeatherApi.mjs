import { _toQueryString, request } from '../common.mjs'

const ZH_CN = 'zh-cn'

export function fetchLocationInfoByGeo(str, key) {
  const href = 'https://dataservice.accuweather.com/locations/v1/cities/geoposition/search'
  const params = {
    apikey: key,
    q: str,
    language: ZH_CN,
    // details: true,
    // toplevel: false
  }
  return request(`${href}?${_toQueryString(params)}`)
}
export function fetchLocationInfoByName(str, key) {
  const href = 'https://dataservice.accuweather.com/locations/v1/cities/search'
  const params = {
    apikey: key,
    q: str,
    language: ZH_CN,
    offset: 5,
    // details: true,
  }
  return request(`${href}?${_toQueryString(params)}`)
}

export function fetchCurrentConditionsByLocationKey({ locationKey, key }) {
  const href = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}`
  const params = {
    apikey: key,
    language: ZH_CN,
    details: true,
  }
  return request(`${href}?${_toQueryString(params)}`)
}

export function fetchHourlyForecasts({ locationKey, key, metric = true }) {
  const href = `https://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${locationKey}`
  const params = {
    apikey: key,
    language: ZH_CN,
    details: true,
    metric,
  }
  return request(`${href}?${_toQueryString(params)}`)
}

export function fetchDailyForecasts({ locationKey, key, metric = true }) {
  const href = `https://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}`
  const params = {
    apikey: key,
    language: ZH_CN,
    details: true,
    metric,
  }
  return request(`${href}?${_toQueryString(params)}`)
}

export function fetchDailyIndices({ locationKey, key }) {
  const href = `https://dataservice.accuweather.com/indices/v1/daily/1day/${locationKey}`
  const params = {
    apikey: key,
    language: ZH_CN,
    details: true,
  }
  return request(`${href}?${_toQueryString(params)}`)
}

export function fetchDailyAQI({ locationKey, key }) {
  const id = -10 // for AQI
  const href = `https://dataservice.accuweather.com/indices/v1/daily/1day/${locationKey}/${id}`
  const params = {
    apikey: key,
    language: ZH_CN,
    details: true,
  }
  return request(`${href}?${_toQueryString(params)}`)
}
