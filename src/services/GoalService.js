import { getGoal as storageGetGoal, saveGoal as storageSaveGoal, getGoalProgress, saveGoalProgress } from './StorageService';
import { analyzeActivitySafety } from '../utils/weatherSafety';
import { scheduleGoalReminderNotification } from './NotificationService';
import * as Sentry from '@sentry/react-native';

export const getGoal = async () => {
    return await storageGetGoal();
};

export const saveGoal = async (goal) => {
    await storageSaveGoal(goal);
    await scheduleGoalReminderNotification(goal);
    return;
};

export const getProgress = async () => {
    try {
        const goal = await getGoal();
        if (!goal) return null;
        
        const progress = await getGoalProgress();
        const daysLeftInWeek = 7 - new Date().getDay();
        const daysPassed = 7 - daysLeftInWeek || 1;
        
        const targetDays = goal.targetDays || 0;
        const sessionsLogged = progress.sessionsLogged || 0;
        const remaining = Math.max(0, targetDays - sessionsLogged);
        const isOnTrack = sessionsLogged >= targetDays || (sessionsLogged / daysPassed) >= (targetDays / 7);

        return {
            sessionsLogged,
            targetDays,
            remaining,
            isOnTrack,
            daysLeftInWeek
        };
    } catch (e) {
        Sentry.captureException(e);
        return null;
    }
};

export const logGoalSession = async () => {
    try {
        const progress = await getGoalProgress();
        progress.sessionsLogged = (progress.sessionsLogged || 0) + 1;
        await saveGoalProgress(progress);
    } catch (e) {
        Sentry.captureException(e);
    }
};

export const getBestRemainingWindows = (weeklyForecast, activity, units) => {
    try {
        if (!weeklyForecast || !Array.isArray(weeklyForecast)) return [];
        
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        
        const upcoming = weeklyForecast.filter(day => {
            return day.time * 1000 >= todayStart;
        });

        const goodDays = upcoming
            .map(day => {
                const analysis = analyzeActivitySafety(activity, day, units);
                return {
                    dayLabel: new Date(day.time * 1000).toLocaleDateString([], { weekday: 'short' }),
                    score: analysis?.score || 0,
                    time: day.time
                };
            })
            .filter(day => day.score >= 65)
            .sort((a, b) => b.score - a.score);

        return goodDays.slice(0, 3);
    } catch (e) {
        Sentry.captureException(e);
        return [];
    }
};
