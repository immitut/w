function randomNum(max, min = 0) {
  return Math.round(Math.random() * (max - min) + min)
}
const randomIcon = () => {
  const n = ['01', '02', '03', '04', '09', 10, 11, 13, 50]
  const t = ['d', 'n']
  return `${n[randomNum(8)]}${t[randomNum(1)]}`
}

export function _mockData() {
  const data = {
    desc_weather: '风和日丽',
    icon_main: randomIcon(),
    temp_cur: 401,
    temp_feels_like: 404,
    temp_min: 15.99,
    temp_max: 17.19,
    num_pressure: 1023,
    per_humidity: 56,
    num_wind: 3.82,
    deg_wind: 180,
    time_sunrise: 1711403753,
    time_sunset: 1711448042,
    time_dt: 1711405753,
    name_city: '应许之地',
    hourlyForecasts: [
      {
        time: 1711443600,
        temp: 17.19,
        desc: '多云',
        icon: randomIcon(),
      },
      {
        time: 1711454400,
        temp: 15.66,
        desc: '多云',
        icon: randomIcon(),
      },
      {
        time: 1711465200,
        temp: 13.32,
        desc: '多云',
        icon: randomIcon(),
      },
      {
        time: 1711476000,
        temp: 10.46,
        desc: '多云',
        icon: randomIcon(),
      },
      {
        time: 1711486800,
        temp: 9.99,
        desc: '阴，多云',
        icon: randomIcon(),
      },
      {
        time: 1711497600,
        temp: 12.33,
        desc: '阴，多云',
        icon: randomIcon(),
      },
      {
        time: 1711508400,
        temp: 17.82,
        desc: '阴，多云',
        icon: randomIcon(),
      },
      {
        time: 1711519200,
        temp: 21.69,
        desc: '阴，多云',
        icon: randomIcon(),
      },
    ],
    num_aqi: randomNum(6, 0),
  }
  return new Promise(r => {
    setTimeout(() => {
      r(data)
    }, 1e3)
  })
}
