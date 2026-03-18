import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActivityLog } from './ActivityLogService';
import * as Sentry from '@sentry/react-native';

const WEEKLY_REPORT_KEY = '@weekly_score_report';

export const generateWeeklyReport = async () => {
    try {
        const logs = await getActivityLog();
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Filter activities from last 7 days
        const recentLogs = logs.filter(log => new Date(log.date) >= sevenDaysAgo);

        if (recentLogs.length === 0) return null;

        // Calculate stats
        const totalDuration = recentLogs.reduce((acc, log) => acc + log.duration, 0);
        const totalDistance = recentLogs.reduce((acc, log) => acc + (log.distance || 0), 0);

        const activitiesCount = recentLogs.reduce((acc, log) => {
            acc[log.activity] = (acc[log.activity] || 0) + 1;
            return acc;
        }, {});

        // Find most frequent activity
        let topActivity = 'None';
        let maxCount = 0;
        for (const [activity, count] of Object.entries(activitiesCount)) {
            if (count > maxCount) {
                maxCount = count;
                topActivity = activity;
            }
        }

        const report = {
            id: Date.now().toString(),
            generatedAt: now.toISOString(),
            totalDuration,
            totalDistance,
            sessionCount: recentLogs.length,
            topActivity
        };

        await AsyncStorage.setItem(WEEKLY_REPORT_KEY, JSON.stringify(report));
        return report;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to generate weekly report", e);
    }
    return null;
};

export const getLatestWeeklyReport = async () => {
    try {
        const json = await AsyncStorage.getItem(WEEKLY_REPORT_KEY);
        if (json) return JSON.parse(json);
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get weekly report", e);
    }
    return null;
};
