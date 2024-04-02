import {
  _zeroPrefix,
  tempRander,
  timeRander,
  AQIcalculation,
  _getIconPath,
  $,
  initGeo,
} from "./common.mjs";
import { getWeather, getAQI, fetchGeo } from "./api.mjs";
// import { data } from "./data.js";

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
      if (key.startsWith("per_")) {
        value = `${value}%`;
      }
      if (key.startsWith("spe_")) {
        value = `${value?.toFixed(1)}m/s`;
      }
      if (key.startsWith("time_")) {
        const { h, m } = timeRander(value);
        document.documentElement.style.setProperty(
          `--${key}`,
          (+h + m / 60).toFixed(2)
        );
        value = `${h}:${m}`;
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
    const { h, m } = timeRander(dt);
    time.textContent = `${h}:${m}`;
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

const _switchTheme = switchTheme();
window.onload = init;
$(".icon_main").onclick = init;
$(".version").onclick = _switchTheme;

function switchTheme() {
  let isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = {
    dark: {
      "bg-color": "33, 33, 33",
      "font-color": "255, 255, 255",
      "card-bg-color": "51, 51, 51",
    },
    light: {
      "bg-color": "238, 238, 238",
      "font-color": "51, 51, 51",
      "card-bg-color": "246, 246, 246",
    },
  };
  return function () {
    isDark = !isDark;
    const currTheme = theme[isDark ? "dark" : "light"];
    for (const prop in currTheme) {
      document.body.style.setProperty(`--${prop}`, currTheme[prop]);
    }
  };
}

function loading(isLoading) {
  const action = isLoading ? "add" : "remove";
  $("body").classList[action]("loading");
}

function updateIcon(key, value) {
  const iconpath = _getIconPath(value);
  $(`.${key}`).style.setProperty("--icon-url", `url("${iconpath}")`);
}

function getCurrWeather(p) {
  return getWeather("weather", p);
}

function getForecastWeather(p) {
  return getWeather("forecast", p);
}

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
  const data = {
    ...curr,
    forecast: forecast.list,
    aqi: aqi.list[0],
  };
  updateData(data);
  loading(false);
}

function updateData({ main, wind, sys, weather, dt, clouds, aqi, forecast }) {
  const data = {
    temp_cur: main?.temp,
    // temp_min: main?.temp_min,
    // temp_max: main?.temp_max,
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
