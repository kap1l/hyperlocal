import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

// NOTE: Since expo-health-connect requires a complex dev-client setup
// and specific Android 14+ permissions, this is a mock implementation
// designed to act as a placeholder for the real SDK integration in the future.
// The real SDK implementation will require:
// 1. expo install react-native-health-connect
// 2. Custom plugin config in app.json for AndroidManifest.xml
// 3. Physical Android device for testing

const ENABLED_KEY = '@health_connect_enabled';

export const isHealthConnectAvailable = () => {
    return Platform.OS === 'android';
};

export const isHealthConnectEnabled = async () => {
    if (!isHealthConnectAvailable()) return false;
    try {
        const enabled = await AsyncStorage.getItem(ENABLED_KEY);
        return enabled === 'true';
    } catch (e) {
        return false;
    }
};

export const enableHealthConnect = async () => {
    if (!isHealthConnectAvailable()) return false;
    try {
        // In a real app, this is where we'd call:
        // await initialize();
        // await requestPermission([...]);
        
        await AsyncStorage.setItem(ENABLED_KEY, 'true');
        return true;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to enable Health Connect", e);
        return false;
    }
};

export const disableHealthConnect = async () => {
    try {
        await AsyncStorage.setItem(ENABLED_KEY, 'false');
    } catch (e) {
        console.error(e);
    }
};

export const fetchHealthData = async () => {
    try {
        const enabled = await isHealthConnectEnabled();
        if (!enabled) return null;

        // Mock data representing what we'd fetch: ActiveCaloriesBurned, Steps, Distance
        const now = new Date();
        const dateStr = now.toLocaleDateString();

        return {
            date: dateStr,
            steps: Math.floor(Math.random() * 5000) + 2000,
            calories: Math.floor(Math.random() * 300) + 150,
            distanceMi: (Math.random() * 3 + 1).toFixed(1)
        };
    } catch (e) {
        Sentry.captureException(e);
        return null;
    }
};
