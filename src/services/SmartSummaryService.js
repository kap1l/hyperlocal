import { analyzeActivitySafety } from '../utils/weatherSafety';

/**
 * Generates a human-readable daily plan based on weather data and user activity.
 * @param {Object} weather - The full weather data object
 * @param {String} activity - Selected activity (e.g. 'run', 'walk')
 * @returns {String} summary text
 */
const REASON_MAP = {
    'Temp': 'uncomfortable temperatures',
    'Wind': 'strong winds',
    'UV': 'high UV levels',
    'Vis': 'poor visibility',
    'Chill': 'dangerous wind chill',
    'Road': 'hazardous road conditions',
    'Cond': 'precipitation',
    'Cloud': 'cloud cover',
    'Risk': 'weather risks',
    'Lens': 'wet conditions'
};

export const generateDailySummary = (weather, activity) => {
    if (!weather || !weather.hourly) return "Loading your daily briefing...";

    // Helper: Get hour in specific timezone (0-23)
    const getHourInTimezone = (timestamp, timezone) => {
        if (!timezone) return new Date(timestamp * 1000).getHours();
        try {
            const date = new Date(timestamp * 1000);
            const hourStr = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                hour12: false,
                timeZone: timezone
            });
            // Handle "24" edge case or "0"
            let h = parseInt(hourStr, 10);
            if (h === 24) h = 0;
            return h;
        } catch (e) {
            return new Date(timestamp * 1000).getHours();
        }
    };

    const timezone = weather.timezone;
    const hourly = weather.hourly.data.slice(0, 18); // Next 18 hours
    const bestWindows = [];
    const avoidWindows = [];

    // Analyze hourly blocks
    hourly.forEach(hour => {
        const analysis = analyzeActivitySafety(activity, hour, 'us');
        if (!analysis) return; // Skip if analysis fails

        const hourNum = getHourInTimezone(hour.time, timezone);

        if (analysis.score >= 80) bestWindows.push(hourNum);
        if (analysis.score < 50) avoidWindows.push(hourNum);
    });

    // Formatting Logic
    // Use location's current time for greeting
    const currentHour = getHourInTimezone(Date.now() / 1000, timezone);
    const partOfDay = currentHour < 12 ? "morning" : "afternoon";
    const greeting = `Good ${partOfDay}.`;

    // Helper: Determine the "Why"
    const getReason = (hourData) => {
        if (!hourData) return "";
        const analysis = analyzeActivitySafety(activity, hourData, 'us');
        if (!analysis) return "";

        // 1. Check for specific poor metrics
        const poorMetric = analysis.metrics.find(m => m.status === 'poor');
        if (poorMetric) return ` due to ${REASON_MAP[poorMetric.name] || 'conditions'}`;

        // 2. Check advice keywords if no metric is explicitly poor but score is low
        const adv = analysis.advice.toLowerCase();
        if (adv.includes('rain')) return " due to rain";
        if (adv.includes('snow')) return " due to snow";
        if (adv.includes('wind')) return " due to wind";
        if (adv.includes('cold')) return " due to cold";

        return "";
    };

    // 1. Great Day Case
    if (bestWindows.length > 12) {
        return `${greeting} It's a perfect day for a ${activity}. Go anytime!`;
    }

    // 2. Bad Day / No "Perfect" Window Case
    if (bestWindows.length === 0) {
        const firstHour = hourly[0];
        const reason = getReason(firstHour);
        const introAnalysis = analyzeActivitySafety(activity, firstHour, 'us');

        // If it's decent (e.g. 60-79), don't call it "Tough"
        if (introAnalysis && introAnalysis.score >= 60) {
            return `${greeting} Conditions are fair today, but no perfect windows${reason}.`;
        }
        return `${greeting} Conditions are tough today${reason}. Maybe take a rest day or go indoors.`;
    }

    // 3. Strategic Case (Find the best start time)
    const firstGood = bestWindows[0];
    const lastGood = bestWindows[bestWindows.length - 1];

    // Convert to 12h format
    const formatTime = (h) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12} ${ampm}`;
    };

    // Analyze the hour immediately following the good window to explain the degradation
    // Note: We need to find the specific hour data that corresponds to (lastGood + 1)
    // We can't just modify generic hourNum logic easily for finding the *data object*.
    // Instead, let's look at the index in logic.
    // Simplifying: Find the first hour in 'hourly' that has hourNum == (lastGood + 1) % 24
    const nextHourVal = (lastGood + 1) % 24;
    const nextHourData = hourly.find(h => getHourInTimezone(h.time, timezone) === nextHourVal);
    const reasonText = getReason(nextHourData);

    return `${greeting} Aim to ${activity} around ${formatTime(firstGood)}. Conditions degrade after ${formatTime(lastGood)}${reasonText}.`;
};

/**
 * Generates a LIMITED summary for FREE users.
 * Shows general overview but not specific "best time" recommendations.
 * @param {Object} weather - The full weather data object
 * @param {String} activity - Selected activity (e.g. 'run', 'walk')
 * @returns {String} limited summary text
 */
export const generateFreeSummary = (weather, activity) => {
    if (!weather || !weather.currently) return "Loading...";

    const current = weather.currently;
    const temp = Math.round(current.temperature);
    const summary = current.summary || 'Conditions unclear';
    const precip = Math.round((current.precipProbability || 0) * 100);

    // Simple quality assessment
    let quality = 'mixed';
    if (precip < 20 && temp > 45 && temp < 85) quality = 'good';
    if (precip > 50 || temp < 32 || temp > 95) quality = 'challenging';

    const partOfDay = new Date().getHours() < 12 ? "morning" : "afternoon";

    if (quality === 'good') {
        return `Good ${partOfDay}! Currently ${temp}° and ${summary.toLowerCase()}. Conditions look favorable for a ${activity} today.`;
    } else if (quality === 'challenging') {
        return `Good ${partOfDay}. Currently ${temp}° with ${summary.toLowerCase()}. Consider checking the forecast before heading out.`;
    } else {
        return `Good ${partOfDay}. It's ${temp}° and ${summary.toLowerCase()}. ${precip > 30 ? `${precip}% chance of rain.` : ''}`;
    }
};
