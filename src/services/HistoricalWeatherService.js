import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

const HISTORICAL_WEATHER_KEY = '@historical_weather_daily';

export const saveDailyWeatherSnapshot = async (currently, units) => {
    try {
        const json = await AsyncStorage.getItem(HISTORICAL_WEATHER_KEY);
        let history = json ? JSON.parse(json) : {};
        
        // Save today's YYYY-MM-DD
        const now = new Date();
        const dateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        // Convert to F for internal storage consistency
        const tempF = units === 'si' ? (currently.temperature * 9/5) + 32 : currently.temperature;
        
        history[dateStr] = {
            temperature: Math.round(tempF),
            summary: currently.summary,
            icon: currently.icon,
        };
        
        // Keep only last 14 days to preserve space
        const keys = Object.keys(history).sort();
        if (keys.length > 14) {
            const keysToRemove = keys.slice(0, keys.length - 14);
            keysToRemove.forEach(k => delete history[k]);
        }
        
        await AsyncStorage.setItem(HISTORICAL_WEATHER_KEY, JSON.stringify(history));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save daily snapshot", e);
    }
};

export const getConditionsLastWeek = async (units) => {
    try {
        const json = await AsyncStorage.getItem(HISTORICAL_WEATHER_KEY);
        if (!json) return null;
        
        const history = JSON.parse(json);
        
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastWeekStr = new Date(lastWeek.getTime() - (lastWeek.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        const pastData = history[lastWeekStr];
        if (!pastData) return null;
        
        // Convert back to current unit preference
        const displayTemp = units === 'si' ? (pastData.temperature - 32) * 5/9 : pastData.temperature;
        
        return {
            ...pastData,
            temperature: Math.round(displayTemp)
        };
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get conditions last week", e);
    }
    return null;
};
