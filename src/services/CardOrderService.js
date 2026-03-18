import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

export const CARD_TITLES = {
    'smart-summary': 'Smart Summary',
    'activity-hub': 'Activity Overview',
    'minute-banner': 'Minute-by-Minute',
    'outdoor-comfort': 'Outdoor Comfort',
    'aqi': 'Air Quality',
    'golden-hour': 'Golden Hour',
    'moon-phase': 'Moon & Stargazing',
    'pollen': 'Pollen Index',
    'timeline': 'Hourly Timeline',
    'daily': '7-Day Outlook',
    'weekly-forecast': '7-Day Activity Forecast',
    'rain-chart': 'Rain Forecast'
};

export const DEFAULT_ORDER = [
    'smart-summary',
    'activity-hub',
    'minute-banner',
    'outdoor-comfort',
    'aqi',
    'golden-hour',
    'moon-phase',
    'pollen',
    'timeline',
    'daily',
    'weekly-forecast',
    'rain-chart'
];

export const getCardOrder = async () => {
    try {
        const order = await AsyncStorage.getItem('@card_order');
        if (order) {
            const parsed = JSON.parse(order);
            // Ensure all current DEFAULT_ORDER items exist in parsed
            const missing = DEFAULT_ORDER.filter(id => !parsed.includes(id));
            if (missing.length > 0) {
                return [...parsed, ...missing];
            }
            return parsed;
        }
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to load card order", e);
    }
    return DEFAULT_ORDER;
};

export const saveCardOrder = async (order) => {
    try {
        await AsyncStorage.setItem('@card_order', JSON.stringify(order));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to save card order", e);
    }
};
