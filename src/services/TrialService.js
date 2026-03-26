import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

const ASYNC_STORAGE_KEY = '@trial_start_date';
let cachedTrialStart = null;

export const initTrial = async () => {
    if (cachedTrialStart) return cachedTrialStart;

    try {
        let trialStart = null;
        let secureKey = null;

        try {
            const androidId = Application.getAndroidId();
            if (androidId) {
                secureKey = `trial_start_${androidId}`;
                const secureValue = await SecureStore.getItemAsync(secureKey);
                if (secureValue) {
                    trialStart = parseInt(secureValue, 10);
                }
            }
        } catch (secureErr) {
            Sentry.captureException(secureErr);
            console.warn('SecureStore error:', secureErr);
        }

        const asyncValue = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
        let asyncValueInt = asyncValue ? parseInt(asyncValue, 10) : null;

        if (trialStart && !asyncValueInt) {
            // Reinstall detected or AsyncStorage cleared
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, trialStart.toString());
        } else if (!trialStart && asyncValueInt) {
            // Legacy install migrating to SecureStore
            trialStart = asyncValueInt;
            if (secureKey) {
                try {
                    await SecureStore.setItemAsync(secureKey, trialStart.toString());
                } catch (e) {
                    Sentry.captureException(e);
                }
            }
        } else if (!trialStart && !asyncValueInt) {
            // Genuine first install
            trialStart = Date.now();
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, trialStart.toString());
            if (secureKey) {
                try {
                    await SecureStore.setItemAsync(secureKey, trialStart.toString());
                } catch (e) {
                    Sentry.captureException(e);
                }
            }
        }

        cachedTrialStart = trialStart;
        return trialStart;
    } catch (err) {
        Sentry.captureException(err);
        console.warn('Failed to init trial:', err);
        // Fallback to fresh trial to avoid blocking the app
        const fallback = Date.now();
        cachedTrialStart = fallback;
        return fallback;
    }
};

export const getTrialStatus = async () => {
    const trialStart = await initTrial();
    const daysUsed = Math.floor((Date.now() - trialStart) / 86400000);
    return {
        isInTrial: daysUsed < 14,
        daysUsed,
        daysRemaining: Math.max(0, 14 - daysUsed),
        trialExpired: daysUsed >= 14
    };
};

export const getTrialStartDate = async () => {
    return await initTrial();
};

export const isTrialExpired = async () => {
    const status = await getTrialStatus();
    return status.trialExpired;
};
