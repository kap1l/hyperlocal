import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_CACHE_KEY = 'weather_cache';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const saveWeatherData = async (data) => {
    try {
        const payload = {
            timestamp: Date.now(),
            data: data,
        };
        await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.error("Failed to save weather data", e);
    }
};

export const getCachedWeatherData = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
        if (jsonValue != null) {
            const payload = JSON.parse(jsonValue);
            const isExpired = Date.now() - payload.timestamp > TTL_MS;
            return { data: payload.data, isExpired, timestamp: payload.timestamp };
        }
    } catch (e) {
        console.error("Failed to fetch cached weather data", e);
    }
    return null;
};

export const saveApiKey = async (key) => {
    try {
        await AsyncStorage.setItem('pirate_weather_key', key);
    } catch (e) {
        console.error("Failed to save API key", e);
    }
};

export const getApiKey = async () => {
    try {
        return await AsyncStorage.getItem('pirate_weather_key');
    } catch (e) {
        console.error("Failed to get API key", e);
    }
    return null;
};

export const saveUnits = async (units) => {
    try {
        await AsyncStorage.setItem('weather_units', units);
    } catch (e) {
        console.error("Failed to save units", e);
    }
};

export const getUnits = async () => {
    try {
        return await AsyncStorage.getItem('weather_units');
    } catch (e) {
        console.error("Failed to get units", e);
    }
    return null;
};

export const saveLocationConfig = async (config) => {
    try {
        await AsyncStorage.setItem('location_config', JSON.stringify(config));
    } catch (e) {
        console.error("Failed to save location config", e);
    }
};

export const getLocationConfig = async () => {
    try {
        const value = await AsyncStorage.getItem('location_config');
        return value ? JSON.parse(value) : { mode: 'auto' };
    } catch (e) {
        console.error("Failed to get location config", e);
    }
    return { mode: 'auto' };
};

export const saveSelectedActivity = async (activity) => {
    try {
        await AsyncStorage.setItem('selected_activity', activity);
    } catch (e) {
        console.error("Failed to save selected activity", e);
    }
};

export const getSelectedActivity = async () => {
    try {
        return await AsyncStorage.getItem('selected_activity');
    } catch (e) {
        console.error("Failed to get selected activity", e);
    }
    return 'walk';
};
