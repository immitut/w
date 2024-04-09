import { getItem, saveItem } from "./common.mjs";
const Delta = "_d";
const Average = "_a";

// 统计最合适的长度
function _saveDeltaData(v) {
  const list = getItem(Delta) || [];
  if (list.length === 50) list.shift();
  list.push(~~v);
  const average = list.reduce((res, curr, i) => {
    res += curr;
    if (i === list.length - 1) {
      res = res / list.length;
    }
    return res;
  }, 0);
  saveItem(Delta, list);
  saveItem(Average, ~~average);
}

export function pullToRefresh(
  elm,
  { distThreshold, distMax, onMove, onPullEnd }
) {
  const _threshold = 40;
  let _startY = 0;
  let _deltaY = 0;
  // let cacheStyle = null;
  const _distThreshold = Math.min(distMax, distThreshold);
  const _distMax = Math.max(distMax, distThreshold);

  elm.addEventListener(
    "touchstart",
    function (ev) {
      if (this.scrollTop !== 0) return;
      // console.log(this.scrollTop, ev);
      // cacheStyle = elm.style.cssText;
      const { pageY } = ev.touches[0];
      _startY = pageY;
      this.style.transition = "transform 0s";
    },
    {
      passive: true,
    }
  );

  elm.addEventListener(
    "touchmove",
    function (ev) {
      if (this.scrollTop !== 0) return;
      const { pageY } = ev.touches[0];
      _deltaY = pageY - _startY - _threshold;
      // console.log("_deltaY", _deltaY);
      if (_deltaY >= 0 && _deltaY <= _distMax) {
        this.style.overflowY = "hidden";
        if (typeof onMove === "function") {
          onMove(this, _deltaY / _distMax);
        }
        elm.style.transform = `translateY(${_deltaY}px)`;
      }
    },
    {
      passive: true,
    }
  );

  elm.addEventListener(
    "touchend",
    async () => {
      if (_startY || _deltaY) {
        _saveDeltaData(_deltaY);
        if (_deltaY >= _distThreshold && typeof onPullEnd == "function") {
          // console.log("touchend callback");
          await onPullEnd();
        }
        _startY = 0;
        _deltaY = 0;
        elm.style = "";
        // if (cacheStyle !== null) {
        //   elm.style = cacheStyle;
        //   cacheStyle = null;
        // }
      }
    },
    {
      passive: true,
    }
  );
}
