import React from 'react';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherWidget } from './WeatherWidget';

const WIDGET_DATA_KEY = '@widget_weather_data';

/**
 * Gets the latest cached weather data for the widget.
 * In production, this should read from shared preferences accessible by the widget.
 */
async function getWidgetData() {
    try {
        const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to load widget data:', e);
    }

    // Default fallback data
    return {
        score: 75,
        activity: 'walk',
        temp: 45,
        advice: 'Open app for details'
    };
}

/**
 * Widget Task Handler - Called by Android when widget needs update
 */
async function widgetTaskHandler(props) {
    const widgetInfo = props.widgetInfo;
    const { widgetAction, widgetName } = props;

    switch (widgetAction) {
        case 'WIDGET_ADDED':
        case 'WIDGET_UPDATE':
        case 'WIDGET_RESIZED':
            // Get latest data and render
            const data = await getWidgetData();
            return <WeatherWidget {...data} />;

        case 'WIDGET_DELETED':
            // Cleanup if needed
            break;

        case 'WIDGET_CLICK':
            // Handle click - by default opens app (configured in widget)
            break;

        default:
            break;
    }

    return null;
}

// Register the handler
registerWidgetTaskHandler(widgetTaskHandler);
