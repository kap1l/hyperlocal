import { getLogs } from './ActivityLogService';
import { getWeeklyReport, saveWeeklyReport, hasSeenWeeklyReport, markWeeklyReportSeen } from './StorageService';
import * as Sentry from '@sentry/react-native';

const getWeekIdentifier = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}_W${weekNo}`;
};

export const generateWeeklyReport = async () => {
    try {
        const now = new Date();
        const currentWeekId = getWeekIdentifier(now);
        
        // Check if we already have a report for this week
        const existingReport = await getWeeklyReport(currentWeekId);
        if (existingReport) return existingReport;

        const logs = await getLogs();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Filter activities from last 7 days
        const recentLogs = logs.filter(log => new Date(log.timestamp) >= sevenDaysAgo);

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
            weekId: currentWeekId,
            totalDuration,
            totalDistance,
            sessionCount: recentLogs.length,
            topActivity
        };

        await saveWeeklyReport(currentWeekId, report);
        return report;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to generate weekly report", e);
    }
    return null;
};

export const getLatestWeeklyReport = async () => {
    try {
        const currentWeekId = getWeekIdentifier(new Date());
        return await getWeeklyReport(currentWeekId);
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get weekly report", e);
    }
    return null;
};

export const markReportAsSeen = async () => {
    try {
        const currentWeekId = getWeekIdentifier(new Date());
        await markWeeklyReportSeen(currentWeekId);
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to mark weekly report as seen", e);
    }
};
