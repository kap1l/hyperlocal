import * as Sentry from '@sentry/react-native';
import { getActivityLogs, saveActivityLogs } from './StorageService';
import { getGoal, logGoalSession } from './GoalService';

export const getLogs = async () => {
    try {
        return await getActivityLogs();
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get activity log", e);
        return [];
    }
};

export const addLog = async (entry) => {
    try {
        const current = await getActivityLogs();
        const updated = [entry, ...current].slice(0, 200); // cap at 200
        await saveActivityLogs(updated);

        // Check against active goals
        const goal = await getGoal();
        if (goal && goal.activity === entry.activity) {
            await logGoalSession();
        }

        return updated;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to add log", e);
    }
};

export const deleteLog = async (id) => {
    try {
        const current = await getActivityLogs();
        const updated = current.filter(s => s.id !== id);
        await saveActivityLogs(updated);
        return updated;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to delete log", e);
    }
};

export const getWeeklySummary = async () => {
    try {
        const logs = await getActivityLogs();
        const oneWeekAgo = Date.now() - 604800000;
        const validLogs = logs.filter(l => l.timestamp >= oneWeekAgo);

        if (validLogs.length === 0) return null;

        const sum = validLogs.reduce((acc, l) => acc + l.score, 0);
        const avgScore = Math.round(sum / validLogs.length);

        const bestLog = validLogs.reduce((prev, current) => (prev.score > current.score) ? prev : current);
        const bestDay = new Date(bestLog.timestamp).toLocaleDateString([], { weekday: 'long' });

        const activities = [...new Set(validLogs.map(l => l.activity))];

        return { count: validLogs.length, avgScore, bestDay, activities };
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to get weekly summary", e);
        return null;
    }
};
