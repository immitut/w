const noop = () => {}

export function pullToRefresh(
  elm,
  { distThreshold, distMax, onMove, onPullEnd, onReachThreshold },
) {
  const _threshold = 40
  let _startY = 0
  let _deltaY = 0
  let triggle = false
  let reachThreshold
  const _distThreshold = Math.min(distMax, distThreshold)
  const _distMax = Math.max(distMax, distThreshold)
  if (typeof onMove !== 'function') onMove = noop
  if (typeof onPullEnd !== 'function') onPullEnd = noop
  if (typeof onReachThreshold !== 'function') onReachThreshold = noop

  elm.addEventListener(
    'touchstart',
    function (ev) {
      if (this.scrollTop !== 0) return
      // console.log(this.scrollTop, ev);
      const { pageY } = ev.touches[0]
      reachThreshold = false
      _startY = pageY
    },
    {
      passive: true,
    },
  )

  elm.addEventListener(
    'touchmove',
    function (ev) {
      if (this.scrollTop !== 0) return
      const { pageY } = ev.touches[0]
      _deltaY = pageY - _startY - _threshold
      // console.log("_deltaY", _deltaY);
      if (_deltaY >= 0 && _deltaY <= _distMax) {
        if (!triggle) {
          triggle = true
          this.style.transition = 'transform 0s'
          this.style.overflowY = 'hidden'
        }
        onMove(this, _deltaY / _distMax)
        elm.style.transform = `translateY(${_deltaY * 0.8}px)`
        if (_deltaY >= _distThreshold && !reachThreshold) {
          reachThreshold = true
          onReachThreshold()
        }
      }
    },
    {
      passive: true,
    },
  )

  elm.addEventListener(
    'touchend',
    async () => {
      if (triggle) {
        // console.log("touchend callback");
        await onPullEnd(reachThreshold)
        triggle = false
        _startY = _deltaY = 0
        elm.style = ''
      }
    },
    {
      passive: true,
    },
  )
}
