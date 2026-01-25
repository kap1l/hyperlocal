import { analyzeActivitySafety } from '../utils/weatherSafety';

/**
 * Generates a human-readable daily plan based on weather data and user activity.
 * @param {Object} weather - The full weather data object
 * @param {String} activity - Selected activity (e.g. 'run', 'walk')
 * @returns {String} summary text
 */
export const generateDailySummary = (weather, activity) => {
    if (!weather || !weather.hourly) return "Loading your daily briefing...";

    const hourly = weather.hourly.data.slice(0, 18); // Next 18 hours
    const bestWindows = [];
    const avoidWindows = [];

    // Analyze hourly blocks
    hourly.forEach(hour => {
        const analysis = analyzeActivitySafety(activity, hour, 'us'); // defaulting 'us' for internal calc
        const hourNum = new Date(hour.time * 1000).getHours();

        if (analysis.score >= 80) bestWindows.push(hourNum);
        if (analysis.score < 50) avoidWindows.push(hourNum);
    });

    // Formatting Logic
    const partOfDay = new Date().getHours() < 12 ? "morning" : "afternoon";
    const greeting = `Good ${partOfDay}.`;

    // 1. Great Day Case
    if (bestWindows.length > 12) {
        return `${greeting} It's a perfect day for a ${activity}. Go anytime!`;
    }

    // 2. Bad Day Case
    if (bestWindows.length === 0) {
        return `${greeting} Conditions are tough today. Maybe take a rest day or go indoors.`;
    }

    // 3. Strategic Case (Find the best start time)
    // Simple heuristic: Find first block of consecutive good hours
    const firstGood = bestWindows[0];
    const lastGood = bestWindows[bestWindows.length - 1];

    // Convert to 12h format
    const formatTime = (h) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12} ${ampm}`;
    };

    return `${greeting} Aim to ${activity} around ${formatTime(firstGood)}. Conditions degrade after ${formatTime(lastGood)}.`;
};
