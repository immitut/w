function randomNum(max, min = 0) {
  return Math.round(Math.random() * (max - min) + min);
}
const randomIcon = () => {
  const n = ["01", "02", "03", "04", "09", 10, 11, 13, 50];
  const t = ["d", "n"];
  return `${n[randomNum(8)]}${t[randomNum(1)]}`;
};

export function _mockData() {
  const data = {
    coord: {
      lon: 120.155,
      lat: 30.1804,
    },
    weather: [
      {
        id: 803,
        main: "Clouds",
        description: "多云",
        icon: randomIcon(),
      },
    ],
    base: "stations",
    main: {
      temp: 17.19,
      feels_like: 16.43,
      temp_min: 15.99,
      temp_max: 17.19,
      pressure: 1023,
      humidity: 56,
      sea_level: 1023,
      grnd_level: 1022,
    },
    visibility: 10000,
    wind: {
      speed: 3.82,
      deg: 180,
      gust: 3.95,
    },
    clouds: {
      all: 75,
    },
    dt: 1711442618,
    sys: {
      type: 2,
      id: 145356,
      country: "CN",
      sunrise: 1711403753,
      sunset: 1711448042,
    },
    timezone: 28800,
    id: 7735183,
    name: "Puyan",
    cod: 200,
    forecast: [
      {
        dt: 1711443600,
        main: {
          temp: 17.19,
          feels_like: 16.43,
          temp_min: 16.5,
          temp_max: 17.19,
          pressure: 1023,
          sea_level: 1023,
          grnd_level: 1022,
          humidity: 56,
          temp_kf: 0.69,
        },
        weather: [
          {
            id: 803,
            main: "Clouds",
            description: "多云",
            icon: randomIcon(),
          },
        ],
        clouds: {
          all: 75,
        },
        wind: {
          speed: 3.82,
          deg: 43,
          gust: 3.95,
        },
        visibility: 10000,
        pop: 0,
        sys: {
          pod: "d",
        },
        dt_txt: "2024-03-26 09:00:00",
      },
      {
        dt: 1711454400,
        main: {
          temp: 15.66,
          feels_like: 14.93,
          temp_min: 12.59,
          temp_max: 15.66,
          pressure: 1024,
          sea_level: 1024,
          grnd_level: 1023,
          humidity: 63,
          temp_kf: 3.07,
        },
        weather: [
          {
            id: 803,
            main: "Clouds",
            description: "多云",
            icon: randomIcon(),
          },
        ],
        clouds: {
          all: 66,
        },
        wind: {
          speed: 2.13,
          deg: 63,
          gust: 3.22,
        },
        visibility: 10000,
        pop: 0,
        sys: {
          pod: "n",
        },
        dt_txt: "2024-03-26 12:00:00",
      },
      {
        dt: 1711465200,
        main: {
          temp: 13.32,
          feels_like: 12.64,
          temp_min: 11.39,
          temp_max: 13.32,
          pressure: 1024,
          sea_level: 1024,
          grnd_level: 1023,
          humidity: 74,
          temp_kf: 1.93,
        },
        weather: [
          {
            id: 802,
            main: "Clouds",
            description: "多云",
            icon: randomIcon(),
          },
        ],
        clouds: {
          all: 38,
        },
        wind: {
          speed: 1.64,
          deg: 75,
          gust: 2.64,
        },
        visibility: 10000,
        pop: 0,
        sys: {
          pod: "n",
        },
        dt_txt: "2024-03-26 15:00:00",
      },
      {
        dt: 1711476000,
        main: {
          temp: 10.46,
          feels_like: 9.86,
          temp_min: 10.46,
          temp_max: 10.46,
          pressure: 1023,
          sea_level: 1023,
          grnd_level: 1022,
          humidity: 88,
          temp_kf: 0,
        },
        weather: [
          {
            id: 803,
            main: "Clouds",
            description: "多云",
            icon: randomIcon(),
          },
        ],
        clouds: {
          all: 53,
        },
        wind: {
          speed: 1.45,
          deg: 81,
          gust: 2.32,
        },
        visibility: 10000,
        pop: 0,
        sys: {
          pod: "n",
        },
        dt_txt: "2024-03-26 18:00:00",
      },
      {
        dt: 1711486800,
        main: {
          temp: 9.99,
          feels_like: 9.99,
          temp_min: 9.99,
          temp_max: 9.99,
          pressure: 1022,
          sea_level: 1022,
          grnd_level: 1021,
          humidity: 88,
          temp_kf: 0,
        },
        weather: [
          {
            id: 804,
            main: "Clouds",
            description: "阴，多云",
            icon: randomIcon(),
          },
        ],
        clouds: {
          all: 100,
        },
        wind: {
          speed: 1.28,
          deg: 105,
          gust: 2.4,
        },
        visibility: 10000,
        pop: 0,
        sys: {
          pod: "n",
        },
        dt_txt: "2024-03-26 21:00:00",
      },
      {
        dt: 1711497600,
        main: {
          temp: 12.33,
          feels_like: 11.63,
          temp_min: 12.33,
          temp_max: 12.33,
          pressure: 1021,
          sea_level: 1021,
          grnd_level: 1020,
          humidity: 77,
          temp_kf: 0,
        },
        weather: [
          {
            id: 804,
            main: "Clouds",
            description: "阴，多云",
            icon: randomIcon(),
          },
        ],
        clouds: {
          all: 100,
        },
        wind: {
          speed: 0.88,
          deg: 142,
          gust: 1.64,
        },
        visibility: 10000,
        pop: 0,
        sys: {
          pod: "d",
        },
        dt_txt: "2024-03-27 00:00:00",
      },
      {
        dt: 1711508400,
        main: {
          temp: 17.82,
          feels_like: 17.25,
          temp_min: 17.82,
          temp_max: 17.82,
          pressure: 1020,
          sea_level: 1020,
          grnd_level: 1019,
          humidity: 61,
          temp_kf: 0,
        },
        weather: [
          {
            id: 804,
            main: "Clouds",
            description: "阴，多云",
            icon: randomIcon(),
          },
        ],
        clouds: {
          all: 98,
        },
        wind: {
          speed: 2.23,
          deg: 146,
          gust: 3.5,
        },
        visibility: 10000,
        pop: 0,
        sys: {
          pod: "d",
        },
        dt_txt: "2024-03-27 03:00:00",
      },
      {
        dt: 1711519200,
        main: {
          temp: 21.69,
          feels_like: 21.38,
          temp_min: 21.69,
          temp_max: 21.69,
          pressure: 1016,
          sea_level: 1016,
          grnd_level: 1015,
          humidity: 56,
          temp_kf: 0,
        },
        weather: [
          {
            id: 804,
            main: "Clouds",
            description: "阴，多云",
            icon: randomIcon(),
          },
        ],
        clouds: {
          all: 97,
        },
        wind: {
          speed: 1.77,
          deg: 119,
          gust: 3.26,
        },
        visibility: 10000,
        pop: 0,
        sys: {
          pod: "d",
        },
        dt_txt: "2024-03-27 06:00:00",
      },
    ],
    aqi: {
      main: {
        aqi: 3,
      },
      components: {
        co: 1121.52,
        no: 10.62,
        no2: 67.17,
        o3: 22.89,
        so2: 87.74,
        pm2_5: 48.74,
        pm10: 60.87,
        nh3: 9.63,
      },
      dt: 1711442741,
    },
  };
  return data;
}
