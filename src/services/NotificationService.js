import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { fetchWeather } from './WeatherService';
import { getCurrentLocation } from './LocationService';
import { getApiKey, getUnits, getSelectedActivity, getBriefingTime } from './StorageService';
import { analyzeActivitySafety } from '../utils/weatherSafety';
import { generateDailySummary } from './SmartSummaryService';
import { generateWeeklyReport } from './WeeklyReportService';
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

        const safety = analyzeActivitySafety(activity, weatherData.currently, await getUnits() || 'us');
        
        if (safety) {
            const score = safety.score;
            if (score >= 80) {
                summaryTitle = `🏃 Great ${activity} conditions today`;
            } else if (score >= 60) {
                summaryTitle = `👍 Decent ${activity} window today`;
            } else {
                summaryTitle = `⚠️ Tough day for ${activity}`;
            }
            
            // NOTE: the exact 'startTime'/'endTime' isn't explicitly calculated in standard 'analyzeActivitySafety' without hourly,
            // so we will construct a good summary with the available data 
            const temp = Math.round(weatherData.currently.temperature);
            summaryBody = `Score: ${score}/100. ${temp}°, ${weatherData.currently.summary || 'mild'}. ${safety.advice}`;
        }

        if (summaryBody.length > 100) {
            summaryBody = summaryBody.substring(0, 97) + '...';
        }

        const { hour, minute } = await getBriefingTime();

        await Notifications.cancelAllScheduledNotificationsAsync();

        await Notifications.scheduleNotificationAsync({
            content: {
                title: summaryTitle,
                body: summaryBody,
                sound: true,
            },
            trigger: {
                hour: hour,
                minute: minute,
                repeats: true,
            },
        });
    } catch (e) {
        Sentry.captureException(e);
        console.log('Failed to generate dynamic daily summary for notification', e);
    }
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

export const scheduleMilestoneNotification = async (count) => {
    // Skip entirely in Expo Go
    if (isExpoGo) {
        console.log('Skipping milestone notification (Expo Go)');
        return;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: `🔥 ${count}-Day Streak!`,
            body: `You've checked OutWeather ${count} days in a row. Keep it up!`,
            sound: true,
        },
        trigger: null, // Immediate
    });
};

export const scheduleWeeklyReportNotification = async () => {
    if (isExpoGo) {
        console.log('Skipping weekly report notification (Expo Go)');
        return;
    }

    try {
        const report = await generateWeeklyReport();
        if (report && report.sessionCount > 0) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "📊 Your Weekly Outdoor Report is Ready",
                    body: `You logged ${report.sessionCount} sessions this week. Tap to see your top activity!`,
                    sound: true,
                },
                trigger: {
                    weekday: 1, // Sunday
                    hour: 18,   // 6 PM
                    minute: 0,
                    repeats: true,
                },
            });
        }
    } catch (e) {
        Sentry.captureException(e);
        console.log('Failed to schedule weekly report notification', e);
    }
};
