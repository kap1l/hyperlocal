import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

const SPOTS_KEY = '@saved_spots';

export const getSpots = async () => {
    try {
        const spots = await AsyncStorage.getItem(SPOTS_KEY);
        return spots ? JSON.parse(spots) : [];
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to load spots", e);
        return [];
    }
};

export const addSpot = async (spot) => {
    try {
        const currentSpots = await getSpots();
        const newSpots = [...currentSpots, spot];
        await AsyncStorage.setItem(SPOTS_KEY, JSON.stringify(newSpots));
        return newSpots;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to add spot", e);
        return await getSpots();
    }
};

export const removeSpot = async (id) => {
    try {
        const currentSpots = await getSpots();
        const newSpots = currentSpots.filter(s => s.id !== id);
        await AsyncStorage.setItem(SPOTS_KEY, JSON.stringify(newSpots));
        return newSpots;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to remove spot", e);
        return await getSpots();
    }
};
