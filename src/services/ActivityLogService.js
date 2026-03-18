import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

const ACTIVITY_LOG_KEY = '@activity_history_log';

export const getActivityLog = async () => {
    try {
        const json = await AsyncStorage.getItem(ACTIVITY_LOG_KEY);
        if (json) return JSON.parse(json);
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get activity log", e);
    }
    return [];
};

export const logActivitySession = async (session) => {
    try {
        const current = await getActivityLog();
        const newSession = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...session
        };
        const updated = [newSession, ...current];
        await AsyncStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to log activity session", e);
    }
};

export const deleteActivitySession = async (id) => {
    try {
        const current = await getActivityLog();
        const updated = current.filter(s => s.id !== id);
        await AsyncStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to delete activity session", e);
    }
};
