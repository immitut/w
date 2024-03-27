import {
  _zeroPrefix,
  tempRander,
  timeRander,
  AQIcalculation,
  _getIconPath,
  $,
  _toQueryString,
  initGeo,
} from "./common.mjs";
// import { data } from "./data.js";
const KY = "9af99dadc4c64f228eaa3e272d5e7891";

const proxy = new Proxy(
  {},
  {
    // console.log("set", key, value);
    set: function (target, key, value, receiver) {
      if (!$(`.${key}`)) {
        console.warn(`[update error]: ${key} 不存在`);
        return true;
      }
      if (key.startsWith("temp_")) {
        value = tempRander(value);
      }
      if (key.startsWith("per")) {
        value = `${value}%`;
      }
      if (key.startsWith("spe")) {
        value = `${value?.toFixed(1)}m/sec`;
      }
      if (key.startsWith("time")) {
        value = timeRander(value);
      }
      if (key.startsWith("icon_")) {
        updateIcon(key, value);
        return true;
      }
      if (key.startsWith("list_")) {
        const list = renderList(value);
        $(`.${key}`).appendChild(list);
        return true;
      }
      if (key.startsWith("deg_")) {
        $(`.${key}`).style.setProperty("--deg", `${value}deg`);
        return true;
      }

      $(`.${key}`).textContent = value;
      Reflect.set(target, key, value, receiver);
      return true;
    },
  }
);

function renderList(list) {
  const frag = document.createDocumentFragment();
  for (const item of list) {
    const { dt, weather, main } = item;
    const div = document.createElement("div");
    div.classList.add("item_forecast");
    const time = document.createElement("p");
    time.textContent = timeRander(dt);
    const icon = document.createElement("img");
    icon.src = _getIconPath(weather?.[0]?.icon);
    const temp = document.createElement("p");
    temp.textContent = tempRander(main?.temp);

    div.appendChild(time);
    div.appendChild(icon);
    div.appendChild(temp);
    frag.appendChild(div);
  }
  return frag;
}

window.onload = init;
$(".icon_main").onclick = init;

function loading(isLoading) {
  const action = isLoading ? "add" : "remove";
  $(".app").classList[action]("loading");
}

function updateIcon(key, value) {
  const iconpath = _getIconPath(value);
  $(`.${key}`).style.setProperty("--icon-url", `url("${iconpath}")`);
}

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

function getCurrWeather(p) {
  return getWeather("weather", p);
}

function getForecastWeather(p) {
  return getWeather("forecast", p);
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

const getInfo = async (api) => {
  try {
    // const data = ;
    return await fetch(api).then((res) => res.json());
  } catch (err) {
    console.log(err);
    return {};
  }
};

async function init() {
  loading(true);
  const geoData = await initGeo();
  // const searchBtn = document.querySelector("#submit");
  // searchBtn.onclick = async () => {
  //   const input = document.querySelector("input");
  //   const data = await fetchGeo(input.value);
  //   console.log(data);
  // };
  // console.log(geoData);
  if (!geoData) return;

  const curr = await getCurrWeather(geoData);
  const forecast = await getForecastWeather({ cnt: 8, ...geoData });
  const aqi = await getAQI(geoData);
  // console.log(aqi.list.length);
  const data = {
    ...curr,
    forecast: forecast.list,
    aqi: aqi.list[0],
  };
  // console.log(data);
  updateData(data);
  loading(false);
}

function updateData({ main, wind, sys, weather, dt, clouds, aqi, forecast }) {
  const data = {
    temp_cur: main?.temp,
    temp_min: main?.temp_min,
    temp_max: main?.temp_max,
    per_humidity: main?.humidity,
    per_clouds: clouds?.all,
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
    list_forecast: forecast,
  };

  for (const key in data) {
    proxy[key] = data[key];
  }
}
