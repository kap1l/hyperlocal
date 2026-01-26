import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Request permissions and configure channels
 */
export const registerForNotifications = async () => {
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

/**
 * Schedule a daily notification at 8:00 AM
 */
export const scheduleDailyBriefing = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Good Morning! ☀️",
            body: "Check today's microWeather forecast before you head out.",
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
