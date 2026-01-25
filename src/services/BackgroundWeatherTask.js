import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const WEATHER_TASK_NAME = 'BACKGROUND_WEATHER_CHECK';
const API_KEY_STORAGE = 'pirate_weather_key';
const LAST_STATUS_STORAGE = '@last_weather_status';
const NOTIFS_ENABLED_STORAGE = '@alerts_enabled';
const HISTORY_STORAGE = '@alert_history';

// Define the task
try {
    TaskManager.defineTask(WEATHER_TASK_NAME, async () => {
        return await checkWeatherAndNotify();
    });
} catch (e) {
    console.warn("TaskManager initialization error:", e.message);
}

import { analyzeActivitySafety } from '../utils/weatherSafety';
import { getSelectedActivity } from './StorageService';

export const checkWeatherAndNotify = async (isManual = false) => {
    try {
        const enabled = await AsyncStorage.getItem(NOTIFS_ENABLED_STORAGE);
        if (enabled === 'false' && !isManual) return BackgroundFetch.BackgroundFetchResult.NoData;

        const apiKey = await AsyncStorage.getItem(API_KEY_STORAGE);
        if (!apiKey) throw new Error("API Key missing. Please set it in Settings.");

        // 1. Precise Mobile Location
        const { status: foreStatus } = await Location.getForegroundPermissionsAsync();
        if (foreStatus !== 'granted') throw new Error("Location permission denied.");

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        const { latitude, longitude } = location.coords;

        // 2. Mobile Fetch (Check units from storage)
        const unitStorage = await AsyncStorage.getItem('weather_units');
        const units = unitStorage || 'us';

        // Fetch Hourly AND Minutely data
        const url = `https://api.pirateweather.net/forecast/${apiKey}/${latitude},${longitude}?units=${units}&exclude=daily`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.currently) throw new Error("Could not fetch weather data.");

        const summary = data.currently.summary || "Cloudy";
        const precip = data.currently.precipProbability || 0;
        const temperature = data.currently.temperature;
        const feelsLike = data.currently.apparentTemperature;

        // Convert to F for internal logic consistency
        const tempF = units === 'si' ? (temperature * 9 / 5) + 32 : temperature;
        const feelsLikeF = units === 'si' ? (feelsLike * 9 / 5) + 32 : feelsLike;

        // --- Helper Logic for Minutely Trends ---
        let durationMsg = '';
        if (data.minutely && data.minutely.data) {
            const minutes = data.minutely.data;
            const isRainingNow = precip > 0.2;

            if (isRainingNow) {
                // Find when it STOPS
                const stopIndex = minutes.findIndex(m => m.precipProbability < 0.2);
                if (stopIndex === -1) {
                    durationMsg = "Rain continuing for the next hour.";
                } else {
                    durationMsg = `Rain stopping in ~${stopIndex} min.`;
                }

                // Check for intensity spike (from light to heavy)
                if (data.currently.precipIntensity < 0.1) {
                    const heavyIndex = minutes.findIndex(m => m.precipIntensity > 0.3);
                    if (heavyIndex !== -1) {
                        durationMsg += ` Heads up: Pouring rain in ${heavyIndex} min!`;
                    }
                }

            } else {
                // Not raining, find when it STARTS
                const startIndex = minutes.findIndex(m => m.precipProbability > 0.3);
                if (startIndex !== -1) {
                    durationMsg = `Rain starting in ~${startIndex} min.`;

                    // Is it starting HEAVY?
                    const startIntensity = minutes[startIndex].precipIntensity || 0;
                    if (startIntensity > 0.3) durationMsg += " (Starting heavy!)";
                }
            }
        }

        // 3. Morning Report Logic
        let morningMessage = null;
        const now = new Date();
        const currentHour = now.getHours();
        const todayStr = now.toISOString().split('T')[0];

        // Check if it's morning (6AM - 10AM) and we haven't reported yet
        if (currentHour >= 6 && currentHour <= 10) {
            const lastReportDate = await AsyncStorage.getItem('@last_morning_report_date');
            if (lastReportDate !== todayStr || isManual) {
                // Generate Report
                const activityId = (await getSelectedActivity()) || 'walk';
                const hourly = data.hourly?.data || [];

                // Find best slot in next 12 hours
                let bestStart = -1;
                let bestDuration = 0;
                let currentStart = -1;
                let currentDuration = 0;

                // Analyze next 12 hours
                for (let i = 0; i < 12; i++) {
                    if (!hourly[i]) break;
                    const safety = analyzeActivitySafety(activityId, hourly[i], units);

                    if (safety.status === 'safe') {
                        if (currentStart === -1) currentStart = i;
                        currentDuration++;
                    } else {
                        if (currentDuration > bestDuration) {
                            bestDuration = currentDuration;
                            bestStart = currentStart;
                        }
                        currentStart = -1;
                        currentDuration = 0;
                    }
                }
                // Final check
                if (currentDuration > bestDuration) {
                    bestDuration = currentDuration;
                    bestStart = currentStart;
                }

                if (bestDuration >= 2) {
                    const startTime = new Date(hourly[bestStart].time * 1000);
                    const endTime = new Date(hourly[bestStart + bestDuration - 1].time * 1000);
                    const startStr = startTime.toLocaleTimeString([], { hour: 'numeric' });
                    const endStr = endTime.toLocaleTimeString([], { hour: 'numeric' });

                    morningMessage = `Morning ${activityId} Report: Best window is ${startStr} - ${endStr}. Go for it!`;
                } else if (bestDuration > 0) {
                    morningMessage = `Morning ${activityId} Report: Short window around ${new Date(hourly[bestStart].time * 1000).toLocaleTimeString([], { hour: 'numeric' })}.`;
                } else {
                    morningMessage = `Morning ${activityId} Report: Conditions look tough today. Check the app for details.`;
                }

                if (morningMessage) {
                    await AsyncStorage.setItem('@last_morning_report_date', todayStr);
                }
            }
        }

        // 4. Regular Immediate Alerts
        const lastStatusStr = await AsyncStorage.getItem(LAST_STATUS_STORAGE);
        const lastStatus = lastStatusStr ? JSON.parse(lastStatusStr) : null;
        let alertMessage = '';

        if (isManual) {
            let tempDisplay = `${Math.round(temperature)}°`;
            alertMessage = `Test: It's ${tempDisplay} and ${summary} (${Math.round(precip * 100)}% rain).`;
            if (morningMessage) alertMessage += `\n\n${morningMessage}`;
        } else {
            const wasRaining = lastStatus?.precip > 0.3;
            const isRaining = precip > 0.3;

            if (!wasRaining && isRaining) {
                alertMessage = `Rain starting locally (${summary}). ${durationMsg}`;
            } else if (tempF < 10 || feelsLikeF < 5) {
                if (!lastStatus || lastStatus.tempF >= 10) {
                    alertMessage = `Dangerously Cold: ${Math.round(temperature)}°. Stay safe!`;
                }
            } else if (wasRaining && !isRaining) {
                alertMessage = `The rain has stopped! ${durationMsg}`;
            }
        }

        // Prioritize Morning Report if it exists, otherwise normal alert
        const finalMessage = morningMessage || alertMessage;

        if (finalMessage) {
            // Trigger Mobile Notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: morningMessage ? "Daily Activity Planner 📅" : "MicroRain Alert 🌦️",
                    body: finalMessage,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    categoryIdentifier: 'weather',
                },
                trigger: null, // Immediate
            });

            // Save to History
            try {
                const historyStr = await AsyncStorage.getItem(HISTORY_STORAGE);
                let history = historyStr ? JSON.parse(historyStr) : [];
                history.unshift({
                    id: Date.now().toString(),
                    title: morningMessage ? "Daily Report" : "Weather Alert",
                    description: finalMessage,
                    time: Date.now() / 1000,
                });
                if (history.length > 20) history = history.slice(0, 20);
                await AsyncStorage.setItem(HISTORY_STORAGE, JSON.stringify(history));
            } catch (e) {
                console.error("Failed to save history:", e);
            }

            if (!isManual) {
                await AsyncStorage.setItem(LAST_STATUS_STORAGE, JSON.stringify({ summary, precip, tempF }));
            }
            return BackgroundFetch.BackgroundFetchResult.NewData;
        }

        return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
        console.error("Task Error:", error.message);
        if (isManual) throw error;
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
};

export const registerBackgroundWeatherTask = async () => {
    if (Platform.OS === 'web') return;
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(WEATHER_TASK_NAME);
        if (!isRegistered) {
            await BackgroundFetch.registerTaskAsync(WEATHER_TASK_NAME, {
                minimumInterval: 15 * 60,
                stopOnTerminate: false,
                startOnBoot: true,
            });
        }
    } catch (err) {
        console.error("Task registration failed:", err);
    }
};
