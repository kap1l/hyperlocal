/**
 * OpenMeteoAdapter.js
 *
 * Translates an Open-Meteo API response into the DarkSky/PirateWeather-compatible
 * schema that every component in the app already consumes.
 *
 * Open-Meteo docs: https://open-meteo.com/en/docs
 *
 * Key design decisions:
 *  - All field names mirror PirateWeather so zero downstream changes are needed.
 *  - `minutely.data` is synthesised from the `minutely_15` block (4 → 60 points
 *    via linear interpolation) so RainChart continues to work without modification.
 *  - `daily.data[n].sunriseTime` / `sunsetTime` are Unix epoch seconds so
 *    GoldenHourCard keeps working unchanged.
 */

// ─────────────────────────────────────────────
//  WMO Weather Interpretation Code → UI fields
// ─────────────────────────────────────────────
const WMO_DESCRIPTIONS = {
    0: { summary: 'Clear Sky', icon: 'clear-day' },
    1: { summary: 'Mostly Clear', icon: 'clear-day' },
    2: { summary: 'Partly Cloudy', icon: 'partly-cloudy-day' },
    3: { summary: 'Overcast', icon: 'cloudy' },
    45: { summary: 'Foggy', icon: 'fog' },
    48: { summary: 'Icy Fog', icon: 'fog' },
    51: { summary: 'Light Drizzle', icon: 'rain' },
    53: { summary: 'Drizzle', icon: 'rain' },
    55: { summary: 'Heavy Drizzle', icon: 'rain' },
    61: { summary: 'Light Rain', icon: 'rain' },
    63: { summary: 'Rain', icon: 'rain' },
    65: { summary: 'Heavy Rain', icon: 'rain' },
    71: { summary: 'Light Snow', icon: 'snow' },
    73: { summary: 'Snow', icon: 'snow' },
    75: { summary: 'Heavy Snow', icon: 'snow' },
    77: { summary: 'Snow Grains', icon: 'snow' },
    80: { summary: 'Light Showers', icon: 'rain' },
    81: { summary: 'Showers', icon: 'rain' },
    82: { summary: 'Heavy Showers', icon: 'rain' },
    85: { summary: 'Snow Showers', icon: 'snow' },
    86: { summary: 'Heavy Snow Showers', icon: 'snow' },
    95: { summary: 'Thunderstorm', icon: 'thunderstorm' },
    96: { summary: 'Thunderstorm w/ Hail', icon: 'thunderstorm' },
    99: { summary: 'Severe Thunderstorm', icon: 'thunderstorm' },
};

const wmoLookup = (code, isDay = true) => {
    const base = WMO_DESCRIPTIONS[code] || { summary: 'Unknown', icon: 'cloudy' };
    // Flip day icons to night variants when appropriate
    if (!isDay) {
        const icon = base.icon === 'clear-day'
            ? 'clear-night'
            : base.icon === 'partly-cloudy-day'
                ? 'partly-cloudy-night'
                : base.icon;
        return { ...base, icon };
    }
    return base;
};

// ─────────────────────────────────────────────
//  Helper utilities
// ─────────────────────────────────────────────

/** Parse an ISO 8601 string (no timezone info) to a Unix epoch second. */
const isoToEpoch = (isoStr) => {
    if (!isoStr) return null;
    return Math.floor(new Date(isoStr).getTime() / 1000);
};

/**
 * Linear interpolation over a 15-minute precipitation dataset (4 data points per hour)
 * to produce 60 synthetic per-minute data points, matching PirateWeather's `minutely`.
 *
 * @param {Array<{time: string, precipitation_probability: number, precipitation: number}>} minutely15
 * @returns {Array<{time: number, precipProbability: number, precipIntensity: number}>}
 */
export const interpolateMinutely = (minutely15) => {
    if (!minutely15 || minutely15.length === 0) return [];

    const times = minutely15.time ?? [];
    const probabilities = minutely15.precipitation_probability ?? [];
    const precipitation = minutely15.precipitation ?? [];

    // Build anchor points from the first 4+ entries (covering ~1 hour)
    const anchors = [];
    const count = Math.min(times.length, 5); // use up to 5 points → 4 segments → 60 min
    for (let i = 0; i < count; i++) {
        anchors.push({
            prob: (probabilities[i] ?? 0) / 100,
            intensity: precipitation[i] ?? 0,
        });
    }

    // If we have fewer than 2 anchors just repeat the first
    if (anchors.length < 2) {
        const a = anchors[0] || { prob: 0, intensity: 0 };
        return Array.from({ length: 60 }, (_, i) => ({
            time: Date.now() / 1000 + i * 60,
            precipProbability: a.prob,
            precipIntensity: a.intensity,
        }));
    }

    const result = [];
    // Each 15-min segment maps to 15 per-minute points
    for (let seg = 0; seg < anchors.length - 1; seg++) {
        const start = anchors[seg];
        const end = anchors[seg + 1];
        for (let m = 0; m < 15; m++) {
            const t = m / 15;
            result.push({
                time: Date.now() / 1000 + (seg * 15 + m) * 60,
                precipProbability: start.prob + (end.prob - start.prob) * t,
                precipIntensity: start.intensity + (end.intensity - start.intensity) * t,
            });
        }
        if (result.length >= 60) break;
    }

    // Pad to exactly 60 if we didn't reach there
    while (result.length < 60) {
        const last = result[result.length - 1];
        result.push({ ...last });
    }

    return result.slice(0, 60);
};

// ─────────────────────────────────────────────
//  Main adapter
// ─────────────────────────────────────────────

/**
 * Converts an Open-Meteo combined forecast response into the app's internal
 * weather data model (PirateWeather/DarkSky schema).
 *
 * @param {Object} raw  — raw JSON from Open-Meteo
 * @param {number} lat  — request latitude
 * @param {number} lon  — request longitude
 * @param {string} units — 'us' | 'si' | 'uk2'
 * @returns {Object}    — normalized weather object
 */
export const adaptOpenMeteo = (raw, lat, lon, units = 'us') => {
    if (!raw) throw new Error('No data from Open-Meteo');

    const c = raw.current ?? {};
    const h = raw.hourly ?? {};
    const d = raw.daily ?? {};
    const m15 = raw.minutely_15 ?? {};

    const isDay = c.is_day === 1;
    const weatherCode = c.weather_code ?? 0;
    const { summary, icon } = wmoLookup(weatherCode, isDay);

    // ── Currently ────────────────────────────────────────────────────────
    const currently = {
        time: isoToEpoch(c.time) ?? Math.floor(Date.now() / 1000),
        summary,
        icon,
        temperature: c.temperature_2m ?? 0,
        apparentTemperature: c.apparent_temperature ?? c.temperature_2m ?? 0,
        humidity: (c.relative_humidity_2m ?? 0) / 100,
        windSpeed: c.wind_speed_10m ?? 0,
        windGust: c.wind_gusts_10m ?? 0,
        windBearing: c.wind_direction_10m ?? 0,
        uvIndex: c.uv_index ?? 0,
        pressure: c.surface_pressure ?? c.pressure_msl ?? 1013,
        visibility: (c.visibility ?? 16000) / 1000, // metres → km
        dewPoint: c.dew_point_2m ?? 0,
        cloudCover: (c.cloud_cover ?? 0) / 100,
        precipIntensity: c.precipitation ?? 0,
        // precipProbability for the current moment from the first hourly slot
        precipProbability: (h.precipitation_probability?.[0] ?? 0) / 100,
        ozone: c.surface_pressure ?? 300, // not available in standard endpoint; provide a safe default
        nearestStormDistance: 0,
        nearestStormBearing: 0,
    };

    // ── Hourly ────────────────────────────────────────────────────────────
    const hourlyTimes = h.time ?? [];
    const hourlyData = hourlyTimes.map((t, i) => {
        const hCode = h.weather_code?.[i] ?? 0;
        const hIsDay = h.is_day?.[i] === 1;
        const { summary: hSummary, icon: hIcon } = wmoLookup(hCode, hIsDay);

        return {
            time: isoToEpoch(t),
            summary: hSummary,
            icon: hIcon,
            temperature: h.temperature_2m?.[i] ?? 0,
            apparentTemperature: h.apparent_temperature?.[i] ?? 0,
            humidity: (h.relative_humidity_2m?.[i] ?? 0) / 100,
            windSpeed: h.wind_speed_10m?.[i] ?? 0,
            windGust: h.wind_gusts_10m?.[i] ?? 0,
            windBearing: h.wind_direction_10m?.[i] ?? 0,
            precipProbability: (h.precipitation_probability?.[i] ?? 0) / 100,
            precipIntensity: h.precipitation?.[i] ?? 0,
            uvIndex: h.uv_index?.[i] ?? 0,
            cloudCover: (h.cloud_cover?.[i] ?? 0) / 100,
            visibility: (h.visibility?.[i] ?? 16000) / 1000,
            dewPoint: h.dew_point_2m?.[i] ?? 0,
            pressure: h.surface_pressure?.[i] ?? 1013,
        };
    });

    // ── Daily ────────────────────────────────────────────────────────────
    const dailyTimes = d.time ?? [];
    const dailyData = dailyTimes.map((t, i) => {
        const dCode = d.weather_code?.[i] ?? 0;
        const { summary: dSummary, icon: dIcon } = wmoLookup(dCode, true);

        // Open-Meteo returns ISO datetime strings for sunrise/sunset
        const sunriseEpoch = isoToEpoch(d.sunrise?.[i]);
        const sunsetEpoch = isoToEpoch(d.sunset?.[i]);

        return {
            time: isoToEpoch(t),
            summary: dSummary,
            icon: dIcon,
            temperatureHigh: d.temperature_2m_max?.[i] ?? 0,
            temperatureLow: d.temperature_2m_min?.[i] ?? 0,
            temperatureMax: d.temperature_2m_max?.[i] ?? 0,
            temperatureMin: d.temperature_2m_min?.[i] ?? 0,
            apparentTemperatureHigh: d.apparent_temperature_max?.[i] ?? 0,
            apparentTemperatureLow: d.apparent_temperature_min?.[i] ?? 0,
            precipProbability: (d.precipitation_probability_max?.[i] ?? 0) / 100,
            precipIntensity: d.precipitation_sum?.[i] ?? 0,
            precipIntensityMax: d.precipitation_sum?.[i] ?? 0,
            windSpeed: d.wind_speed_10m_max?.[i] ?? 0,
            windGust: d.wind_gusts_10m_max?.[i] ?? 0,
            uvIndex: d.uv_index_max?.[i] ?? 0,
            sunriseTime: sunriseEpoch,
            sunsetTime: sunsetEpoch,
            moonPhase: d.sunshine_duration?.[i] != null
                ? undefined  // moon phase not in standard endpoint
                : undefined,
            humidity: (d.precipitation_hours?.[i] ?? 0) / 24,
        };
    });

    // ── Minutely (interpolated from 15-min data) ─────────────────────────
    const minutelyData = interpolateMinutely(m15);

    // ── Assemble ─────────────────────────────────────────────────────────
    return {
        latitude: lat,
        longitude: lon,
        timezone: raw.timezone ?? 'America/New_York',
        currently,
        hourly: {
            summary: currently.summary,
            icon: currently.icon,
            data: hourlyData,
        },
        daily: {
            summary: currently.summary,
            icon: currently.icon,
            data: dailyData,
        },
        minutely: {
            summary: currently.summary,
            data: minutelyData,
        },
        flags: {
            sources: ['open-meteo'],
            units,
        },
        // Preserve raw for debugging in DEV
        _raw: __DEV__ ? raw : undefined,
    };
};
