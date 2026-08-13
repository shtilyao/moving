// Open-Meteo — безкоштовне API погоди, не потребує ключа й дозволяє запити
// прямо з браузера (CORS відкритий). https://open-meteo.com

const BARCELONA = { lat: 41.3874, lon: 2.1686 };

// Коди погоди WMO -> опис українською + іконка
const WEATHER_CODES = {
  0: { desc: 'Ясно', icon: '☀' },
  1: { desc: 'Переважно ясно', icon: '🌤' },
  2: { desc: 'Мінлива хмарність', icon: '⛅' },
  3: { desc: 'Хмарно', icon: '☁' },
  45: { desc: 'Туман', icon: '🌫' },
  48: { desc: 'Паморозевий туман', icon: '🌫' },
  51: { desc: 'Легка мряка', icon: '🌦' },
  53: { desc: 'Мряка', icon: '🌦' },
  55: { desc: 'Сильна мряка', icon: '🌧' },
  56: { desc: 'Крижана мряка', icon: '🌧' },
  57: { desc: 'Сильна крижана мряка', icon: '🌧' },
  61: { desc: 'Невеликий дощ', icon: '🌧' },
  63: { desc: 'Дощ', icon: '🌧' },
  65: { desc: 'Сильний дощ', icon: '🌧' },
  66: { desc: 'Крижаний дощ', icon: '🌧' },
  67: { desc: 'Сильний крижаний дощ', icon: '🌧' },
  71: { desc: 'Невеликий сніг', icon: '🌨' },
  73: { desc: 'Сніг', icon: '🌨' },
  75: { desc: 'Сильний сніг', icon: '❄' },
  77: { desc: 'Сніжна крупа', icon: '🌨' },
  80: { desc: 'Короткочасні зливи', icon: '🌦' },
  81: { desc: 'Зливи', icon: '🌧' },
  82: { desc: 'Сильні зливи', icon: '⛈' },
  85: { desc: 'Короткочасний сніг', icon: '🌨' },
  86: { desc: 'Сильний короткочасний сніг', icon: '❄' },
  95: { desc: 'Гроза', icon: '⛈' },
  96: { desc: 'Гроза з градом', icon: '⛈' },
  99: { desc: 'Сильна гроза з градом', icon: '⛈' },
};

function describeCode(code) {
  return WEATHER_CODES[code] || { desc: 'Погода', icon: '🌡' };
}

/**
 * Завантажує поточну погоду в Барселоні.
 * Кидає помилку, якщо запит не вдався.
 */
export async function fetchBarcelonaWeather() {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${BARCELONA.lat}&longitude=${BARCELONA.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code` +
    `&timezone=Europe%2FMadrid`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Не вдалося завантажити погоду');
  }

  const json = await res.json();
  const current = json.current;
  const info = describeCode(current.weather_code);

  return {
    temp: Math.round(current.temperature_2m),
    desc: info.desc,
    icon: info.icon,
    humidity: Math.round(current.relative_humidity_2m),
    wind: Math.round(current.wind_speed_10m),
    feels: Math.round(current.apparent_temperature),
    fetchedAt: new Date(),
  };
}
