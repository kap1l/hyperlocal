import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

const WATCHLIST_KEY = '@condition_watchlist';

export const getWatchlist = async () => {
    try {
        const json = await AsyncStorage.getItem(WATCHLIST_KEY);
        if (json) return JSON.parse(json);
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get watchlist", e);
    }
    return [];
};

export const addWatch = async (item) => {
    try {
        const current = await getWatchlist();
        const updated = [...current, item];
        await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to add watch", e);
    }
};

export const removeWatch = async (id) => {
    try {
        const current = await getWatchlist();
        const updated = current.filter(w => w.id !== id);
        await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to remove watch", e);
    }
};

export const markNotified = async (id) => {
    try {
        const current = await getWatchlist();
        const todayStr = new Date().toISOString().split('T')[0];
        
        const updated = current.map(w => {
            if (w.id === id) {
                return { ...w, notifiedToday: true, lastNotifiedDate: todayStr };
            }
            return w;
        });
        
        await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to mark watch notified", e);
    }
};

export const resetDailyNotified = async () => {
    try {
        const current = await getWatchlist();
        const updated = current.map(w => ({ ...w, notifiedToday: false }));
        await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to reset daily notified", e);
    }
};
