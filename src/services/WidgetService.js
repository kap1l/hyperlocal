import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
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
    if (Platform.OS !== 'android') return; // Widgets only on Android for now

    try {
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
        requestWidgetUpdate({
            widgetName: 'WeatherWidget',
            renderWidget: () => null, // Will be handled by task handler
            widgetNotFound: () => {
                // Widget not on home screen yet, that's ok
            },
        });

        console.log('Widget data updated:', widgetData);
    } catch (e) {
        console.error('Failed to update widget data:', e);
    }
}
