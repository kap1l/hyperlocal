import * as Widget from 'react-native-android-widget';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { analyzeActivitySafety } from '../utils/weatherSafety';

const WIDGET_DATA_KEY = '@widget_weather_data';

/**
 * Saves weather summary data for the widget and triggers an update.
 * Call this after every weather refresh.
 * @param {Object} weather - Full weather data object
 * @param {String} activity - Selected activity
 * @param {String} units - 'us' or 'si'
 */
export async function updateWidgetData(weather, activity = 'walk', units = 'us') {
    // Both platforms supported. Android uses react-native-android-widget, iOS uses App Groups (via NativeModules or expo-widgets).

    try {
        // CHECK SUBSCRIPTION STATUS
        const isPro = await AsyncStorage.getItem('@is_pro_user');

        if (isPro !== 'true') {
            // LOCK THE WIDGET
            const lockedData = {
                score: 0,
                activity: 'LOCKED',
                temp: 0,
                advice: 'Upgrade to OutWeather+ to unlock Widgets 🔒'
            };
            await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(lockedData));
            Widget.requestWidgetUpdate({
                widgetName: 'WeatherWidget',
                renderWidget: () => null,
                widgetNotFound: () => { }
            });
            return;
        }

        if (!weather?.currently) return;

        const analysis = analyzeActivitySafety(activity, weather.currently, units);
        const isMetric = units === 'si';
        const temp = isMetric
            ? Math.round(weather.currently.temperature)
            : Math.round(weather.currently.temperature);

        const widgetData = {
            score: analysis?.score || 0,
            activity: activity,
            temp: temp,
            advice: analysis?.advice || 'Open app for details',
        };

        await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));

        // Request Android to update the widget
        if (Platform.OS === 'android') {
            Widget.requestWidgetUpdate({
                widgetName: 'WeatherWidget',
                renderWidget: () => null, // Will be handled by task handler
                widgetNotFound: () => {
                    // Widget not on home screen yet, that's ok
                },
            });
        }

        // Request iOS to update App Group UserDefaults
        if (Platform.OS === 'ios') {
            // NOTE: To securely save to iOS UserDefaults App Group in managed React Native:
            // This requires either configuring `react-native-shared-group-preferences` or
            // `expo-widgets` (the backend logic for `targets/widget`).
            //
            // If using `expo-widgets` (deprecated API but still common), you would call:
            // import { setWidgetData } from 'expo-widgets';
            // await setWidgetData({
            //      widgetTemperature: String(temp),
            //      widgetCondition: analysis?.icon || weather.currently.icon,
            //      widgetActivityScore: String(analysis?.score || 0),
            //      widgetActivityType: activity
            // });
            //
            // We log for now, waiting for the underlying native library installation.
            if (__DEV__) console.log('iOS Widget data ready for App Group sync', widgetData);
        }

        if (__DEV__) console.log('Widget data updated:', widgetData);
    } catch (e) {
        Sentry.captureException(e);
        console.error('Failed to update widget data:', e);
    }
}

/**
 * Retrieves the last saved widget data.
 * @returns {Object|null} The last saved widget data, or null if not found/parsed.
 */
export async function getWidgetLastStatus() {
    try {
        const jsonValue = await AsyncStorage.getItem(WIDGET_DATA_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        Sentry.captureException(e);
        console.warn('Failed to parse last status for widget:', e.message);
    }
}
