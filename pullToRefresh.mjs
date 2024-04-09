export function pullToRefresh(
  elm,
  { distThreshold, distMax, onMove, onPullEnd }
) {
  let _startY = 0;
  let _deltaY = 0;
  let cacheStyle = null;
  let triggle = false;
  const _distThreshold = Math.min(distMax, distThreshold);
  const _distMax = Math.max(distMax, distThreshold);

  elm.addEventListener(
    "touchstart",
    function (ev) {
      if (this.scrollTop !== 0) return;
      // console.log(this.scrollTop, ev);
      cacheStyle = elm.style.cssText;
      const { pageY } = ev.touches[0];
      _startY = pageY;
      elm.style.transition = "transform 0s";
      elm.style.overflowY = "hidden";
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
      _deltaY = pageY - _startY;
      // console.log("_deltaY", _deltaY);
      if (_deltaY > 0 && _deltaY <= _distMax) {
        if (_deltaY >= _distThreshold) {
          triggle = true;
        }
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
        if (triggle && typeof onPullEnd == "function") {
          console.log("touchend callback");
          triggle = false;
          await onPullEnd();
        }
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
