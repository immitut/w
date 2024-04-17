import { _toQueryString, request } from '../common.mjs'

const ZH_CN = 'zh-cn'

export function fetchLocationKeyByGeo(str, key) {
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

export function fetchCurrentConditionsByLocationKey(locationKey, key) {
  const href = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}`
  const params = {
    apikey: key,
    language: ZH_CN,
    details: true,
  }
  return request(`${href}?${_toQueryString(params)}`)
}
