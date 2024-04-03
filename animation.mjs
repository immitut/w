import { $ } from "./common.mjs";

const SCROLLSTART = 60;
const SCROLLEND = 440;

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
    return (
      ((endValue - startValue) * (scroll - scrollStart)) /
        (scrollEnd - scrollStart) +
      startValue
    );
  };
}

function translateAnimation(
  scroll,
  { scrollStart, scrollEnd, startValue, endValue }
) {
  const v = creatAnimation(scrollStart, scrollEnd, startValue, endValue);
  return `translateY(${v(scroll)}rem)`;
}

function transformAnimation(
  scroll,
  { scrollStart, scrollEnd, startValue, endValue }
) {
  const v = creatAnimation(scrollStart, scrollEnd, startValue, endValue);
  const f = creatAnimation(scrollStart, scrollEnd, 1, 0.5);
  return `translateY(${v(scroll)}rem) scale(${f(scroll)})`;
}

function opacityAnimation(
  scroll,
  { scrollStart, scrollEnd, startValue, endValue }
) {
  const v = creatAnimation(scrollStart, scrollEnd, startValue, endValue);
  return v(scroll);
}

function updateStyles() {
  const { scrollTop: scroll } = document.body;
  // const { scrollTop: scroll } = appEl;
  // console.log("updateStyles:", scroll);
  header.classList.toggle("shadow", scroll >= SCROLLEND);
  header.style.transform = translateAnimation(scroll, {
    scrollStart: 0,
    endValue: -34,
  });
  temp_cur.style.transform = transformAnimation(scroll, { endValue: 6 });
  icon_main.style.transform = transformAnimation(scroll, {
    scrollStart: 30,
    endValue: 30,
  });
  temp_secondary.style.opacity = opacityAnimation(scroll, {
    scrollEnd: SCROLLEND * 0.4,
    endValue: 0,
    startValue: 1,
  });
}

// const appEl = $(".app");
const header = $(".header");
const temp_cur = $(".temp_cur");
const temp_secondary = $(".temp_secondary");
const icon_main = $(".icon_main");

document.body.addEventListener("scroll", updateStyles, {
  passive: true,
});
updateStyles();
