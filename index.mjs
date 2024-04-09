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
  saveItem,
  getItem,
  initGeo,
} from "./common.mjs";
import { getWeather, getAQI, fetchGeo } from "./api.mjs";
import { pullToRefresh } from "./pullToRefresh.mjs";
import("./dev.mjs");

const VERSION = "0.1.3";
const MODE = "m";
const AMOLED = "a";
const modes = ["auto", "light", "dark"];

const proxy = new Proxy(
  {},
  {
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
        if (key === "time_dt") {
          value = semanticTimeExpression(value * 1e3);
        } else {
          value = timeRander(value * 1e3);
          const [h, m] = value.split(":");
          $(":root").style.setProperty(`--${key}`, (+h + m / 60).toFixed(2));
        }
      }
      if (key.startsWith("icon_")) {
        updateIcon(key, value);
        return true;
      }
      if (key.startsWith("deg_")) {
        $(`.${key}`).style.setProperty("--deg", `${value}deg`);
        return true;
      }

      $(`.${key}`).dataset[key] = value;
      const renderElm = $(`.${key}`).firstElementChild || $(`.${key}`);
      renderElm.textContent = value;
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
    time.textContent = timeRander(dt * 1e3);
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

window.onload = () => {
  HTMLElement.prototype.loading = function (isLoading) {
    this.classList.toggle("loading", isLoading);
  };
  updateData({ version: VERSION });
  pullToRefresh($(".app"), {
    distThreshold: 40 * get1rem(),
    distMax: 50 * get1rem(),
    onMove: (elm, p) => {
      elm.style.filter = `blur(${10 * p * p}px)`;
    },
    onPullEnd: init,
  });

  const next = () => {
    renderTheme();
    init();
  };
  if ("serviceWorker" in navigator) {
    // const { port1, port2 } = new MessageChannel();
    // const msgTypes = {
    //   REQUEST: "request",
    //   LOG: "log",
    //   CACHE: "cache",
    //   CACHEINFO: "cacheInfo",
    // };
    // navigator.serviceWorker.ready.then(async (res) => {
    //   console.log("serviceWorker ready");
    //   const _controlledPromise = new Promise(function (resolve) {
    //     const resolveWithRegistration = function () {
    //       navigator.serviceWorker
    //         .getRegistration()
    //         .then(function (registration) {
    //           resolve(registration);
    //         });
    //     };

    //     if (navigator.serviceWorker.controller) {
    //       resolveWithRegistration();
    //     } else {
    //       navigator.serviceWorker.addEventListener(
    //         "controllerchange",
    //         resolveWithRegistration
    //       );
    //     }
    //   });
    //   await _controlledPromise;
    //   console.log("serviceWorker.controller ready");
    //   navigator.serviceWorker.controller.postMessage(
    //     {
    //       type: "INIT_PORT",
    //       data: msgTypes,
    //     },
    //     [port2]
    //   );
    //   port1.onmessage = (ev) => {
    //     const { type, data } = ev.data;
    //     if (type === msgTypes.LOG) {
    //       console.log(data);
    //     }
    //   };
    // });
    navigator.serviceWorker
      .register("./sw.js")
      .then((ev) => {
        console.log("register done");
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
$(".time_dt").onclick = switchAmoled;
$(".switch-mode-btn").onclick = switchTheme;
$(".num_aqi").ondblclick = () => {
  if (!"serviceWorker" in navigator) {
    alert("not support serviceWorker");
    return;
  }
  const port1 = initMsgChannel(navigator.serviceWorker.controller);
  if (!port1) {
    alert("fail to init message channel.");
    return;
  }
  port1.onmessage = (ev) => {
    const { type, data } = ev.data;
    // console.log("page msgChannel receive:", type, data);
    if (type.startsWith("reset")) {
      if (data) {
        localStorage.clear();
        alert("缓存已强制清除");
      }
      port1.close();
    }
  };
  port1.postMessage({
    type: "reset",
  });
};

function initMsgChannel(controller) {
  if (!controller) return null;
  const { port1, port2 } = new MessageChannel();
  const msgTypes = {
    REQUEST: "request",
    LOG: "log",
    CACHE: "cache",
    CACHEINFO: "cacheInfo",
  };
  controller.postMessage(
    {
      type: "INIT_PORT",
      data: msgTypes,
    },
    [port2]
  );
  return port1;
}

function switchAmoled() {
  const isAmoled = !!getItem(AMOLED);
  saveItem(AMOLED, !isAmoled);
  renderTheme();
}

function switchTheme() {
  let i = getItem(MODE) || 0;
  i++;
  if (i === modes.length) i = 0;
  saveItem(MODE, i);
  renderTheme();
}

function renderTheme() {
  const i = getItem(MODE) || "0";
  const isAmoled = !!getItem(AMOLED);
  $("body").className = isAmoled ? `${modes[i]} amoled` : modes[i];
  const bgColor = getComputedStyle($("body")).getPropertyValue("--bg-color");
  changeThemeColor(`rgb(${bgColor})`);
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
function checkOnline() {
  if (!"online" in navigator) {
    return true;
  }
  return navigator.onLine;
}

// const searchBtn = document.querySelector("#submit");
// searchBtn.onclick = async () => {
//   const input = document.querySelector("input");
//   const data = await fetchGeo(input.value);
//   console.log(data);
// };

function init() {
  return new Promise(async (resolve) => {
    // const isOnline = checkOnline();
    // $(".banner").classList.toggle("show", !isOnline);
    $(".app").loading(true);
    const geoData = await initGeo();
    if (!geoData) return;
    let data = {};

    if (isDevEnv()) {
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
    $(".app").loading(false);
    resolve();
  });
}

function updateData({ main, wind, sys, weather, dt, clouds, aqi, version }) {
  const data = {
    version,
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
    if (data[key] !== undefined) {
      proxy[key] = data[key];
    }
  }
}
