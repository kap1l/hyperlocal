import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Sentry from '@sentry/react-native';

const REVIEW_KEY = `@has_reviewed_${Constants.expoConfig?.version || '1.0'}`;
const APP_OPENS_KEY = '@app_opens_count';

export const logAppOpenForReview = async () => {
    try {
        const hasReviewed = await AsyncStorage.getItem(REVIEW_KEY);
        if (hasReviewed === 'true') return;

        let opens = parseInt(await AsyncStorage.getItem(APP_OPENS_KEY) || '0', 10);
        opens += 1;
        await AsyncStorage.setItem(APP_OPENS_KEY, opens.toString());

        if (opens === 3) {
            await triggerStoreReview();
        }
    } catch (e) {
        Sentry.captureException(e);
        console.error('Review Service error:', e);
    }
};

export const logBestTimeFinderUsed = async () => {
    try {
        const hasReviewed = await AsyncStorage.getItem(REVIEW_KEY);
        if (hasReviewed === 'true') return;

        await triggerStoreReview();
    } catch (e) {
        Sentry.captureException(e);
        console.error('Review Service error:', e);
    }
};

const triggerStoreReview = async () => {
    try {
        if (await StoreReview.hasAction()) {
            await StoreReview.requestReview();
            await AsyncStorage.setItem(REVIEW_KEY, 'true');
        }
    } catch (e) {
        Sentry.captureException(e);
        console.log('Error checking if review is available:', e);
        return false;
    }
};
