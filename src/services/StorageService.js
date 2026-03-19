import AsyncStorage from '@react-native-async-storage/async-storage';

import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';

const API_KEY_STORAGE = 'pirate_weather_key';
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
        Sentry.captureException(e);
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
        Sentry.captureException(e);
        console.error("Failed to fetch cached weather data", e);
    }
    return null;
};

// SECURITY UPDATE: Use SecureStore for sensitive keys
export const saveApiKey = async (key) => {
    try {
        await SecureStore.setItemAsync(API_KEY_STORAGE, key);
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save API key", e);
    }
};

export const getApiKey = async () => {
    try {
        // 1. Try SecureStore first (New Standard)
        let key = await SecureStore.getItemAsync(API_KEY_STORAGE);

        // 2. Fallback to AsyncStorage (Legacy Migration)
        if (!key) {
            key = await AsyncStorage.getItem(API_KEY_STORAGE);

            // 3. If found in Legacy, Migrate & Delete
            if (key) {
                console.log("Migrating API Key to SecureStore...");
                await SecureStore.setItemAsync(API_KEY_STORAGE, key);
                await AsyncStorage.removeItem(API_KEY_STORAGE);
            }
        }
        return key;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get API key", e);
    }
    return null;
};

export const saveUnits = async (units) => {
    try {
        await AsyncStorage.setItem('weather_units', units);
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save units", e);
    }
};

export const getUnits = async () => {
    try {
        return await AsyncStorage.getItem('weather_units');
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get units", e);
    }
    return null;
};

export const saveLocationConfig = async (config) => {
    try {
        await AsyncStorage.setItem('location_config', JSON.stringify(config));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save location config", e);
    }
};

export const getLocationConfig = async () => {
    try {
        const value = await AsyncStorage.getItem('location_config');
        return value ? JSON.parse(value) : { mode: 'auto' };
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get location config", e);
    }
    return { mode: 'auto' };
};

export const saveSelectedActivity = async (activity) => {
    try {
        await AsyncStorage.setItem('selected_activity', activity);
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save selected activity", e);
    }
};

export const getSelectedActivity = async () => {
    try {
        return await AsyncStorage.getItem('selected_activity');
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get selected activity", e);
    }
    return 'walk';
};

export const saveLastKnownLocation = async (coords) => {
    try {
        await AsyncStorage.setItem('last_known_coords', JSON.stringify(coords));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save last known coords", e);
    }
};

export const getLastKnownLocation = async () => {
    try {
        const value = await AsyncStorage.getItem('last_known_coords');
        return value ? JSON.parse(value) : null;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get last known coords", e);
    }
    return null;
};

export const savePressureHistory = async (history) => {
    try {
        await AsyncStorage.setItem('@pressure_history', JSON.stringify(history));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save pressure history", e);
    }
};

export const getPressureHistory = async () => {
    try {
        const value = await AsyncStorage.getItem('@pressure_history');
        return value ? JSON.parse(value) : [];
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get pressure history", e);
    }
    return [];
};

export const setBriefingTime = async (hour, minute) => {
    try {
        await AsyncStorage.setItem('@briefing_time', JSON.stringify({ hour, minute }));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to set briefing time", e);
    }
};

export const getBriefingTime = async () => {
    try {
        const value = await AsyncStorage.getItem('@briefing_time');
        return value ? JSON.parse(value) : { hour: 7, minute: 0 };
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get briefing time", e);
    }
    return { hour: 7, minute: 0 };
};

export const getActivityLogs = async () => {
    try {
        const value = await AsyncStorage.getItem('@activity_log');
        return value ? JSON.parse(value) : [];
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get activity logs", e);
    }
    return [];
};

export const saveActivityLogs = async (logs) => {
    try {
        await AsyncStorage.setItem('@activity_log', JSON.stringify(logs));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save activity logs", e);
    }
};

export const getWeeklyReport = async (weekNumber) => {
    try {
        const value = await AsyncStorage.getItem(`@weekly_report_${weekNumber}`);
        return value ? JSON.parse(value) : null;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get weekly report", e);
    }
    return null;
};

export const saveWeeklyReport = async (weekNumber, report) => {
    try {
        await AsyncStorage.setItem(`@weekly_report_${weekNumber}`, JSON.stringify(report));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save weekly report", e);
    }
};

export const hasSeenWeeklyReport = async (weekNumber) => {
    try {
        const value = await AsyncStorage.getItem(`@weekly_report_seen_${weekNumber}`);
        return value === 'true';
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to check if weekly report seen", e);
    }
    return false;
};

export const markWeeklyReportSeen = async (weekNumber) => {
    try {
        await AsyncStorage.setItem(`@weekly_report_seen_${weekNumber}`, 'true');
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to mark weekly report as seen", e);
    }
};

export const saveWeatherSnapshot = async (dayOfWeek, hour, snapshot) => {
    try {
        await AsyncStorage.setItem(`@snapshot_${dayOfWeek}_${hour}`, JSON.stringify(snapshot));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save weather snapshot", e);
    }
};

export const getWeatherSnapshot = async (dayOfWeek, hour) => {
    try {
        const value = await AsyncStorage.getItem(`@snapshot_${dayOfWeek}_${hour}`);
        return value ? JSON.parse(value) : null;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get weather snapshot", e);
        return null;
    }
};

export const getGoal = async () => {
    try {
        const value = await AsyncStorage.getItem('@habit_goal');
        return value ? JSON.parse(value) : null;
    } catch (e) {
        Sentry.captureException(e);
        return null;
    }
};

export const saveGoal = async (goal) => {
    try {
        if (!goal) {
            await AsyncStorage.removeItem('@habit_goal');
        } else {
            await AsyncStorage.setItem('@habit_goal', JSON.stringify(goal));
        }
    } catch (e) {
        Sentry.captureException(e);
    }
};

export const getGoalProgress = async () => {
    try {
        const currentWeekNumber = Math.floor(Date.now() / 604800000);
        const value = await AsyncStorage.getItem(`@goal_progress_${currentWeekNumber}`);
        return value ? JSON.parse(value) : { sessionsLogged: 0, weekNumber: currentWeekNumber };
    } catch (e) {
        Sentry.captureException(e);
        return { sessionsLogged: 0, weekNumber: Math.floor(Date.now() / 604800000) };
    }
};

export const saveGoalProgress = async (progress) => {
    try {
        const currentWeekNumber = progress.weekNumber || Math.floor(Date.now() / 604800000);
        await AsyncStorage.setItem(`@goal_progress_${currentWeekNumber}`, JSON.stringify(progress));
    } catch (e) {
        Sentry.captureException(e);
    }
};
