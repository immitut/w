const CACHEEXPIRATIONTIME = 5 * 60e3
const _cache = new Map()

let errNum = 0

async function request(api, { cached = false } = {}) {
  const cur = +new Date()
  if (_cache.has(api)) {
    const { ts, data } = _cache.get(api)
    if (cur - ts <= CACHEEXPIRATIONTIME) {
      console.log(`${api} 已从缓存中读取`)
      return data
    }
    console.log(`${api} 缓存已过期`)
    _cache.delete(api)
  }
  try {
    return await fetch(api, { signal: AbortSignal.timeout(errNum * 2e3 + 1e4) }) // 10s timeout for single request
      .then(res => {
        // console.log('resp', res)
        return res.json()
      })
      .then(data => {
        if (cached) {
          _cache.set(api, { ts: cur, data })
        }
        // 401
        if (data.cod === 401) {
          throw {
            code: data.cod,
            name: 'API key 校验失败',
          }
        }
        errNum = 0
        return data
      })
      .catch(err => {
        throw err
      })
  } catch (err) {
    errNum++
    throw err
  }
}

export default request
