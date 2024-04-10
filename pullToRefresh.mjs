import { getItem, saveItem } from "./common.mjs";
const Delta = "_d";
const Average = "_a";
const noop = () => {};
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
  { distThreshold, distMax, onMove, onPullEnd, onReachThreshold }
) {
  const _threshold = 40;
  let _startY = 0;
  let _deltaY = 0;
  let triggle = false;
  let reachThreshold = false;
  let cacheStyle = null;
  const _distThreshold = Math.min(distMax, distThreshold);
  const _distMax = Math.max(distMax, distThreshold);
  if (typeof onMove !== "function") onMove = noop;
  if (typeof onPullEnd !== "function") onPullEnd = noop;
  if (typeof onReachThreshold !== "function") onReachThreshold = noop;

  elm.addEventListener(
    "touchstart",
    function (ev) {
      if (this.scrollTop !== 0) return;
      // console.log(this.scrollTop, ev);
      cacheStyle = elm.style.cssText;
      const { pageY } = ev.touches[0];
      _startY = pageY;
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
        if (!triggle) {
          triggle = true;
          this.style.transition = "transform 0s";
          this.style.overflowY = "hidden";
        }
        onMove(this, _deltaY / _distMax);
        elm.style.transform = `translateY(${_deltaY}px)`;
        if (_deltaY >= _distThreshold && !reachThreshold) {
          reachThreshold = true;
          onReachThreshold();
        }
      }
    },
    {
      passive: true,
    }
  );

  elm.addEventListener(
    "touchend",
    async () => {
      if (triggle) {
        _saveDeltaData(_deltaY);
        if (reachThreshold) {
          // console.log("touchend callback");
          reachThreshold = false;
          await onPullEnd();
        }
        triggle = false;
        _startY = 0;
        _deltaY = 0;
        if (cacheStyle !== null) {
          elm.style = cacheStyle;
          cacheStyle = null;
        }
      }
    },
    {
      passive: true,
    }
  );
}
