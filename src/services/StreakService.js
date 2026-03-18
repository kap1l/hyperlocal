import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { scheduleMilestoneNotification } from './NotificationService';

const STREAK_KEY = '@streak_data';

export const getStreak = async () => {
    try {
        const json = await AsyncStorage.getItem(STREAK_KEY);
        if (json) return JSON.parse(json);
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get streak", e);
    }
    return { count: 0, lastActiveDate: null };
};

export const getMilestone = (count) => {
    const milestones = {
        7: '1 Week!',
        14: '2 Weeks!',
        30: '1 Month!',
        60: '2 Months!',
        100: '100 Days!',
        365: '1 Year!'
    };
    return milestones[count] || null;
};

export const incrementStreak = async () => {
    try {
        const streak = await getStreak();
        
        // Get today's local YYYY-MM-DD
        const now = new Date();
        // offset by timezone
        const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        // Setup yesterday logic safely 
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yestStr = new Date(yesterday.getTime() - (yesterday.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        let newCount = streak.count;
        let newDate = streak.lastActiveDate;

        if (streak.lastActiveDate === todayStr) {
            // Already counted today
            return streak;
        } else if (streak.lastActiveDate === yestStr) {
            // Continued streak
            newCount += 1;
            newDate = todayStr;
        } else {
            // Broken streak / brand new
            newCount = 1;
            newDate = todayStr;
        }

        const newStreak = { count: newCount, lastActiveDate: newDate };
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
        
        const milestone = getMilestone(newCount);
        if (milestone) {
            await scheduleMilestoneNotification(newCount);
        }

        return newStreak;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to increment streak", e);
    }
    return { count: 1, lastActiveDate: new Date().toISOString().split('T')[0] };
};

export const resetStreak = async () => {
    try {
        const empty = { count: 0, lastActiveDate: null };
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(empty));
        return empty;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to reset streak", e);
    }
};
