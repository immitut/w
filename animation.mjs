import { $, get1rem } from "./common.mjs";
const _1REM = get1rem();
const SCROLLSTART = 16 * _1REM;
const SCROLLEND = 114 * _1REM;

function creatAnimation(
  scrollStart = SCROLLSTART,
  scrollEnd = SCROLLEND,
  startValue = 0,
  endValue
) {
  return function (scroll) {
    if (scroll <= scrollStart) {
      return startValue;
    }
    if (scroll >= scrollEnd) {
      return endValue;
    }
    const x = Math.sin(
      (Math.PI * (scroll - scrollStart)) / (scrollEnd - scrollStart) / 2
    );
    return startValue + (endValue - startValue) * x;
  };
}

function _ani(scroll, { scrollStart, scrollEnd, startValue, endValue }) {
  const fn = creatAnimation(scrollStart, scrollEnd, startValue, endValue);
  return fn(scroll);
}

function updateStyles() {
  const { scrollTop: scroll } = app;
  header.classList.toggle("shadow", scroll >= 126 * _1REM);

  header.style.transform = `translate(0, ${_ani(scroll, {
    scrollStart: SCROLLSTART * 0.5,
    endValue: -117,
  })}rem)`;

  temp_cur.style.transform = `translate(0, ${_ani(scroll, {
    scrollEnd: SCROLLEND * 0.8,
    endValue: 9,
  })}rem) scale(${_ani(scroll, { startValue: 1, endValue: 0.6 })})`;

  icon_main.style.transform = `translate(0, ${_ani(scroll, {
    scrollStart: SCROLLSTART * 0.5,
    scrollEnd: SCROLLEND * 0.8,
    endValue: 102,
  })}rem) scale(${_ani(scroll, { startValue: 1, endValue: 0.5 })})`;

  temp_secondary.style.transform = `translate(0, ${_ani(scroll, {
    scrollEnd: SCROLLEND * 0.8,
    endValue: 9,
  })}rem)`;

  temp_secondary.style.opacity = _ani(scroll, {
    scrollEnd: SCROLLEND * 0.8,
    startValue: 1,
    endValue: 0,
  });
}

const app = $(".app");
const header = $(".header");
const temp_cur = $(".temp_cur");
const temp_secondary = $(".temp_secondary");
const icon_main = $(".icon_main");

updateStyles();

app.addEventListener("scroll", updateStyles, {
  passive: true,
});
