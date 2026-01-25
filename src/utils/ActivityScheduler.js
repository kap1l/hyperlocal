import { analyzeActivitySafety } from './weatherSafety';

/**
 * Finds the top 3 best time slots for a given activity within a specific date range.
 * @param {Array} hourlyData - Full hourly data array
 * @param {string} activityId - Activity ID (run, bike, etc)
 * @param {string} units - 'us' or 'si'
 * @param {Date} targetDate - Optional: If provided, only look for slots on this specific day (local time)
 * @returns {Array} Array of up to 3 best slots { startTime, durationHours, avgScore, bestAdvice }
 */
export const findBestTimeSlots = (hourlyData, activityId, units = 'us', targetDate = null) => {
    if (!hourlyData || hourlyData.length === 0) return [];

    let candidates = [];

    // 1. Score every single hour
    const scoredHours = hourlyData.map(hour => {
        const analysis = analyzeActivitySafety(activityId, hour, units);
        return {
            time: hour.time,
            score: analysis.score,
            advice: analysis.advice,
            hourData: hour
        };
    });

    // 2. Filter by date if requested
    let hoursToScan = scoredHours;
    if (targetDate) {
        // Create start/end of target date in local time logic
        // Note: This relies on device timezone vs API timezone. 
        // Ideally we use the timezone offset from API, but for MVP local comparison usually works if user is present.

        const targetDay = targetDate.getDate();
        const targetMonth = targetDate.getMonth();

        hoursToScan = scoredHours.filter(h => {
            const d = new Date(h.time * 1000);
            return d.getDate() === targetDay && d.getMonth() === targetMonth;
        });
    }

    // 3. Find contiguous windows (min 1 hour)
    // We want to find "Peaks". 
    // A simple approach: Group extremely good hours.

    // Let's find single-hour or multi-hour blocks where score > 70 (Fair+)
    // Then rank them by (Score * Duration).

    // For "Top 3", we just want the highest scoring distinct blocks.

    // Sort all hours by score descending to find peaks
    const sortedHours = [...hoursToScan].sort((a, b) => b.score - a.score);

    // We want the top 3 DISTINCT times (not 2pm, 3pm, 4pm as 3 separate choices)
    // Basic clustering: pick best, remove neighbors, pick next best.

    const results = [];
    const usedIndices = new Set();

    for (const topHour of sortedHours) {
        if (results.length >= 3) break;
        if (topHour.score < 60) break; // Don't suggest poor times

        // Find index in original array to check neighbors
        const originalIndex = hoursToScan.findIndex(h => h.time === topHour.time);

        if (usedIndices.has(originalIndex)) continue;

        // It's a valid new peak. Let's see if it extends (safety > 70)
        // Expand left
        let start = originalIndex;
        while (start > 0 &&
            hoursToScan[start - 1].score > 70 &&
            !usedIndices.has(start - 1) &&
            (hoursToScan[originalIndex].time - hoursToScan[start - 1].time) < 3600 * 4) { // Max 4h window
            start--;
        }

        // Expand right
        let end = originalIndex;
        while (end < hoursToScan.length - 1 &&
            hoursToScan[end + 1].score > 70 &&
            !usedIndices.has(end + 1) &&
            (hoursToScan[end + 1].time - hoursToScan[originalIndex].time) < 3600 * 4) {
            end++;
        }

        // Mark used
        for (let i = start; i <= end; i++) usedIndices.add(i);

        // Calculate average score of this window
        let totalScore = 0;
        for (let i = start; i <= end; i++) totalScore += hoursToScan[i].score;
        const avgScore = Math.round(totalScore / (end - start + 1));

        results.push({
            startTime: hoursToScan[start].time,
            durationHours: end - start + 1,
            avgScore: avgScore,
            bestAdvice: hoursToScan[originalIndex].advice // Advice from the peak hour
        });
    }

    return results; // Already sorted by nature of the search loop
};
