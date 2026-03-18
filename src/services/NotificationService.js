import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { fetchWeather } from './WeatherService';
import { getCurrentLocation } from './LocationService';
import { getApiKey, getUnits, getSelectedActivity } from './StorageService';
import { generateDailySummary } from './SmartSummaryService';
import * as Sentry from '@sentry/react-native';

const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

// Only set notification handler if not in Expo Go
if (!isExpoGo) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

/**
 * Request permissions and configure channels
 */
export const registerForNotifications = async () => {
    // Skip entirely in Expo Go
    if (isExpoGo) {
        console.log('Skipping notification registration (Expo Go)');
        return false;
    }

    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('weather-alerts', {
            name: 'Severe Weather Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });

        Notifications.setNotificationChannelAsync('daily-brief', {
            name: 'Daily Briefing',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }
    return true;
};

export const scheduleDailyBriefing = async (weatherData, activity) => {
    // Skip entirely in Expo Go
    if (isExpoGo) {
        console.log('Skipping daily briefing schedule (Expo Go)');
        return;
    }

    let summaryBody = "Check today's OutWeather forecast before you head out.";
    let summaryTitle = "☀️ Your OutWeather briefing";

    try {
        if (!weatherData) {
            const apiKey = await getApiKey();
            const units = await getUnits() || 'us';
            activity = activity || await getSelectedActivity() || 'run';
            const location = await getCurrentLocation();
            weatherData = await fetchWeather(apiKey, location.latitude, location.longitude, units);
        }

        const summary = generateDailySummary(weatherData, activity);
        if (summary) {
            summaryBody = summary.length > 100 ? summary.substring(0, 97) + '...' : summary;
        }

        // Logic to cap title dynamically
        // Note: checking best windows might require weatherSafety logic which isn't imported here,
        // so we'll use a simplified check based on data available in weatherData
        const isGoodDay = weatherData.daily?.data?.[0]?.precipProbability < 0.2;
        const isBadDay = weatherData.daily?.data?.[0]?.precipProbability > 0.8;
        
        if (isGoodDay) {
            summaryTitle = "🏃 Best window found for today";
        } else if (isBadDay) {
             summaryTitle = "⚠️ Tough conditions today";
        } 
        
    } catch (e) {
        Sentry.captureException(e);
        console.log('Failed to generate dynamic daily summary for notification', e);
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
        content: {
            title: summaryTitle,
            body: summaryBody,
            sound: true,
        },
        trigger: {
            hour: 8,
            minute: 0,
            repeats: true,
        },
    });
};

/**
 * Trigger an immediate alert for severe weather
 * @param {object} alert - The alert object from weather API
 */
export const triggerSevereWeatherNotification = async (alert) => {
    // Skip entirely in Expo Go
    if (isExpoGo) {
        console.log('Skipping severe weather notification (Expo Go):', alert.title);
        return;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: `⚠️ ${alert.title}`,
            body: alert.description || "Severe weather warning in your area.",
            data: { data: alert },
            sound: true,
        },
        trigger: null, // Immediate
    });
};
