// import * as Notifications from 'expo-notifications'; // DEPRECATED: Removed to fix build
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

// Stubbed service since expo-notifications was removed to fix build issues

/**
 * Request permissions and configure channels (STUB)
 */
export const registerForNotifications = async () => {
    console.log('Notifications disabled in production build.');
    return false;
};

/**
 * Schedule a daily notification at 8:00 AM (STUB)
 */
export const scheduleDailyBriefing = async () => {
    // No-op
};

/**
 * Trigger an immediate alert for severe weather (STUB)
 * @param {object} alert - The alert object from weather API
 */
export const triggerSevereWeatherNotification = async (alert) => {
    // No-op
};
