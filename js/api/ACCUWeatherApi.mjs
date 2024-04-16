import { _toQueryString, request } from '../common.mjs'

const ZH_CN = 'zh-cn'

function fetchGeo(str, key) {
  const href = 'https://api.openweathermap.org/geo/1.0/direct'
  const params = {
    q: str,
    limit: 5,
    appid: key,
  }
  return request(`${href}?${_toQueryString(params)}`)
}

export function GeopositionSearch(str, key) {
  const href = 'https://dataservice.accuweather.com/locations/v1/cities/geoposition/search'
  const params = {
    apikey: key,
    q: str,
    language: ZH_CN,
    details: true,
    // toplevel: false
  }
  return request(`${href}?${_toQueryString(params)}`)
}
