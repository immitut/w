import {
  _zeroPrefix,
  tempRander,
  timeRander,
  AQIcalculation,
  isDevEnv,
  _getIconPath,
  $,
  initGeo,
} from "./common.mjs";
import { getWeather, getAQI, fetchGeo } from "./api.mjs";

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
      if (key.startsWith("atm_")) {
        value = `${value}hPa`;
      }
      if (key.startsWith("time_")) {
        const { h, m } = timeRander(value);
        $(":root").style.setProperty(`--${key}`, (+h + m / 60).toFixed(2));
        value = `${h}:${m}`;
      }
      if (key.startsWith("icon_")) {
        updateIcon(key, value);
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

async function renderList(list) {
  const frag = document.createDocumentFragment();
  const imgLoaders = new Map();
  for (const item of list) {
    const { dt, weather, main } = item;
    const div = document.createElement("div");
    div.classList.add("item_forecast");
    const time = document.createElement("p");
    const { h, m } = timeRander(dt);
    time.textContent = `${h}:${m}`;
    const icon = document.createElement("img");
    icon.src = _getIconPath(weather?.[0]?.icon);
    if (!imgLoaders.has(icon.src)) {
      imgLoaders.set(
        icon.src,
        new Promise((resolve) => {
          icon.onload = resolve;
        })
      );
    }
    icon.alt = weather?.[0]?.description;
    const temp = document.createElement("p");
    temp.textContent = tempRander(main?.temp);

    div.appendChild(time);
    div.appendChild(icon);
    div.appendChild(temp);
    frag.appendChild(div);
  }
  await Promise.all([...imgLoaders.values()]);
  return frag;
}

const _switchTheme = switchTheme();

window.onload = () => {
  const next = () => {
    _switchTheme(true);
    init();
  };
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then((ev) => {
        console.log("register done", ev);
      })
      .catch((err) => {
        console.log("[err]:", err);
      })
      .finally(next);
  } else {
    next();
  }
};

$(".icon_main").onclick = init;
$(".version").onclick = () => {
  _switchTheme();
};

function switchTheme() {
  let isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = {
    dark: {
      "bg-color": "19, 19, 24",
      "font-color": "255, 255, 255",
      "card-bg-color": "33, 33, 33",
    },
    light: {
      "bg-color": "238, 238, 238",
      "font-color": "51, 51, 51",
      "card-bg-color": "246, 246, 246",
    },
  };
  return function (init = false) {
    if (!init) {
      isDark = !isDark;
    }
    const currTheme = theme[isDark ? "dark" : "light"];
    for (const prop in currTheme) {
      if (prop === "bg-color") {
        changeThemeColor(`rgb(${currTheme[prop]})`);
        console.log("changeThemeColor");
      }
      $(":root").style.setProperty(`--${prop}`, currTheme[prop]);
    }
  };
}

function changeThemeColor(color) {
  const id = "theme-color";
  const elm = $(`#${id}`);
  if (elm) {
    elm.setAttribute("content", color);
  } else {
    const meta = document.createElement("meta");
    meta.id = id;
    meta.name = id;
    meta.content = color;
    document.head.appendChild(meta);
  }
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
  if (!geoData) return;
  let data = {};

  if (isDevEnv()) {
    import("./dev.mjs");
    const { _mockData } = await import("./data.mjs");
    data = await _mockData();
  } else {
    const [curr, forecast, aqi] = await Promise.all([
      getCurrWeather(geoData),
      getForecastWeather({ cnt: 8, ...geoData }),
      getAQI(geoData),
    ]);
    data = {
      ...curr,
      forecast: forecast.list,
      aqi: aqi.list[0],
    };
  }
  updateData(data);
  const list = await renderList(data.forecast);
  $(`.list_forecast`).innerHTML = "";
  $(`.list_forecast`).appendChild(list);
  loading(false);
}

function updateData({ main, wind, sys, weather, dt, clouds, aqi }) {
  const data = {
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
  };

  for (const key in data) {
    proxy[key] = data[key];
  }
}
