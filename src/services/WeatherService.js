/**
 * WeatherService.js
 *
 * Default data source: Open-Meteo (no API key required, free forever).
 * Power-user override: PirateWeather (requires user-supplied API key).
 *
 * The Open-Meteo response is normalized through OpenMeteoAdapter so every
 * downstream component (RainChart, GoldenHourCard, SmartSummary, etc.) continues
 * to receive the same DarkSky/PirateWeather-compatible data model.
 */

import { adaptOpenMeteo } from './OpenMeteoAdapter';
import * as Sentry from '@sentry/react-native';

// ─────────────────────────────────────────────────────────────────────────────
//  Open-Meteo endpoint
// ─────────────────────────────────────────────────────────────────────────────

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * Build the Open-Meteo URL with all required fields.
 * Units mapping:
 *   'us' → temperature_unit=fahrenheit, wind_speed_unit=mph, precipitation_unit=inch
 *   'si' → (defaults are metric)
 *   'uk2' → temperature_unit=fahrenheit + wind_speed_unit=mph (closest match)
 */
const buildOpenMeteoUrl = (lat, lon, units) => {
    const isSi = units === 'si';

    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        // Current conditions
        current: [
            'temperature_2m',
            'apparent_temperature',
            'relative_humidity_2m',
            'dew_point_2m',
            'precipitation',
            'weather_code',
            'cloud_cover',
            'wind_speed_10m',
            'wind_direction_10m',
            'wind_gusts_10m',
            'surface_pressure',
            'visibility',
            'uv_index',
            'is_day',
        ].join(','),
        // Hourly for next 7 days
        hourly: [
            'temperature_2m',
            'apparent_temperature',
            'relative_humidity_2m',
            'dew_point_2m',
            'precipitation',
            'precipitation_probability',
            'weather_code',
            'cloud_cover',
            'wind_speed_10m',
            'wind_direction_10m',
            'wind_gusts_10m',
            'visibility',
            'uv_index',
            'surface_pressure',
            'is_day',
        ].join(','),
        // Daily for 7 days
        daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'apparent_temperature_max',
            'apparent_temperature_min',
            'sunrise',
            'sunset',
            'uv_index_max',
            'precipitation_sum',
            'precipitation_probability_max',
            'wind_speed_10m_max',
            'wind_gusts_10m_max',
            'precipitation_hours',
            'sunshine_duration',
        ].join(','),
        // 15-minute precipitation data for RainChart
        minutely_15: [
            'precipitation',
            'precipitation_probability',
            'weather_code',
        ].join(','),
        // Unit selectors
        temperature_unit: isSi ? 'celsius' : 'fahrenheit',
        wind_speed_unit: isSi ? 'kmh' : 'mph',
        precipitation_unit: isSi ? 'mm' : 'inch',
        // Always request extended hourly so ActivityTimeline gets full 48h
        forecast_days: 7,
        past_days: 0,
        timezone: 'auto',
    });

    return `${OPEN_METEO_BASE}?${params.toString()}`;
};

/**
 * Fetch weather from Open-Meteo and normalize to the app's data model.
 * No API key required.
 */
const fetchFromOpenMeteo = async (lat, lon, units) => {
    const url = buildOpenMeteoUrl(lat, lon, units);

    if (__DEV__) {
        console.log('[WeatherService] Open-Meteo request:', url);
    }

    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Open-Meteo fetch failed (${response.status}): ${errorText}`);
    }

    const raw = await response.json();
    return adaptOpenMeteo(raw, lat, lon, units);
};

// ─────────────────────────────────────────────────────────────────────────────
//  PirateWeather endpoint (power-user path, API key required)
// ─────────────────────────────────────────────────────────────────────────────

const PIRATE_WEATHER_BASE = 'https://api.pirateweather.net/forecast';

/**
 * Fetch weather from PirateWeather using a user-supplied API key.
 * Returns native PirateWeather data — no adapter needed.
 */
const fetchFromPirateWeather = async (apiKey, lat, lon, units) => {
    const sanitizedKey = apiKey.trim().replace(/['"]/g, '');
    const url = `${PIRATE_WEATHER_BASE}/${sanitizedKey}/${lat},${lon}?units=${units}&extend=hourly`;

    if (__DEV__) {
        console.log('[WeatherService] PirateWeather request (key hidden)');
    }

    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        if (response.status === 403) {
            throw new Error('Invalid PirateWeather API Key (403). Please check your key in Settings → Advanced.');
        }
        throw new Error(`PirateWeather fetch failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    data.latitude = lat;
    data.longitude = lon;
    return data;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Model Confidence
// ─────────────────────────────────────────────────────────────────────────────

const checkModelConfidence = async (lat, lon, units, primaryCurrent) => {
    try {
        const isSi = units === 'si';
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,precipitation',
            temperature_unit: isSi ? 'celsius' : 'fahrenheit',
            models: 'icon_global'
        });
        const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) return 'medium';
        const data = await res.json();
        
        const iconTemp = data.current?.temperature_2m;
        if (iconTemp === undefined) return 'medium';
        
        const primaryTemp = primaryCurrent?.temperature;
        if (primaryTemp === undefined) return 'medium';
        
        const tempDiff = Math.abs(iconTemp - primaryTemp);
        
        if (tempDiff >= 3) return 'low';
        if (tempDiff >= 1.5) return 'medium';
        return 'high';
        
    } catch (e) {
        return 'medium';
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch weather for a given location.
 *
 * @param {string|null} apiKey  — PirateWeather API key, or null/empty for Open-Meteo
 * @param {number}      lat     — Latitude
 * @param {number}      lon     — Longitude
 * @param {string}      units   — 'us' | 'si' | 'uk2'
 * @returns {Promise<Object>}   — Normalized weather data object
 */
export const fetchWeather = async (apiKey, lat, lon, units = 'us') => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error(`Invalid coordinates: ${lat}, ${lon}`);
    }

    try {
        // Try Open-Meteo first (default, no key required)
        if (__DEV__) console.log('[WeatherService] Using Open-Meteo (default, no key)');
        try {
            const data = await fetchFromOpenMeteo(latitude, longitude, units);
            const confidence = await checkModelConfidence(latitude, longitude, units, data.currently);
            data.confidence = confidence;
            return data;
        } catch (openMeteoError) {
            Sentry.captureException(openMeteoError);
            if (__DEV__) console.error('[WeatherService] Open-Meteo failed:', openMeteoError.message);
            
            // Fallback to PirateWeather if key is provided
            if (apiKey && apiKey.trim().length > 0) {
                if (__DEV__) console.log('[WeatherService] Falling back to PirateWeather');
                return await fetchFromPirateWeather(apiKey, latitude, longitude, units);
            }
            throw openMeteoError;
        }

    } catch (error) {
        Sentry.captureException(error);
        if (__DEV__) console.error('[WeatherService] Error:', error.message);
        if (error.message.includes('Network request failed')) {
            throw new Error('Network error. Check your internet connection and try again.');
        }
        throw error;
    }
};
