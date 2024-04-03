import { _toQueryString } from "./common.mjs";

const KY = "9af99dadc4c64f228eaa3e272d5e7891";
const CACHEEXPIRATIONTIME = 5 * 60e3;
const _cache = new Map();

const getInfo = async (api, { cached = false } = {}) => {
  const cur = +new Date();
  if (_cache.has(api)) {
    const { ts, data } = _cache.get(api);
    if (cur - ts <= CACHEEXPIRATIONTIME) {
      console.log(`${api} 已从缓存中读取`);
      return data;
    }
    console.log(`${api} 缓存已过期`);
    _cache.delete(api);
  }
  try {
    // const data = ;
    return await fetch(api)
      .then((res) => res.json())
      .then((data) => {
        if (cached) {
          _cache.set(api, { ts: cur, data });
        }
        return data;
      });
  } catch (err) {
    console.log(err);
    return {};
  }
};

function fetchGeo(str) {
  const href = "//api.openweathermap.org/geo/1.0/direct";
  const params = {
    q: str,
    limit: 5,
    appid: KY,
  };
  return getInfo(`${href}?${_toQueryString(params)}`);
}

function getAQI(p) {
  const href = `https://api.openweathermap.org/data/2.5/air_pollution`;
  return getInfo(`${href}?${_toQueryString({ appid: KY, ...p })}`);
}

function getWeather(type, p) {
  const UNITS = ["standard", "metric", "imperial"];
  const deafaultParams = {
    appid: KY,
    units: UNITS[1], // optional, but default value is standard (Kelvin)
    lang: "zh_cn", // optional,but default value is en(English)
  };
  // const href = `https://api.openweathermap.org/data/2.5/forecast`;
  const href = `https://api.openweathermap.org/data/2.5/${type}`;
  const params = Object.assign({}, deafaultParams, p);
  // console.log(params);
  return getInfo(`${href}?${_toQueryString(params)}`);
}

export { getWeather, getAQI, fetchGeo };
