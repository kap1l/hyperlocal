import { useMemo } from 'react';

/**
 * Hook to find the next "safe" window in a time series (e.g., dry weather for running)
 * @param {Array} minutelyData - Array of objects with { time, precipProbability }
 * @param {number} threshold - Probability below which is considered "safe" (e.g. 0.2)
 * @param {number} minDurationMinutes - Minimum duration of the safe window
 * @returns {Object} { isSafeNow, nextWindowStart, nextWindowEnd }
 */
export const useSmartWindow = (minutelyData, threshold = 0.2, minDurationMinutes = 15) => {
    return useMemo(() => {
        if (!minutelyData || minutelyData.length === 0) {
            return { isSafeNow: false, nextWindowStart: null, nextWindowEnd: null };
        }

        // Check immediate future (first 15 mins)
        // If the immediate block is safe, we say "Safe Now"
        const immediateSafe = minutelyData.slice(0, minDurationMinutes).every(m => (m.precipProbability || 0) <= threshold);

        if (immediateSafe) {
            return { isSafeNow: true, nextWindowStart: null, nextWindowEnd: null };
        }

        // If not safe now, look for the next window
        let windowStart = null;
        let windowEnd = null;
        let currentWindowStart = null;

        for (let i = 0; i < minutelyData.length; i++) {
            const isSafe = (minutelyData[i].precipProbability || 0) <= threshold;

            if (isSafe) {
                if (currentWindowStart === null) currentWindowStart = i;
            } else {
                if (currentWindowStart !== null) {
                    if (i - currentWindowStart >= minDurationMinutes) {
                        windowStart = minutelyData[currentWindowStart].time;
                        windowEnd = minutelyData[i - 1].time;
                        break;
                    }
                    currentWindowStart = null;
                }
            }
        }

        // Edge case: window goes to the end of the data
        if (currentWindowStart !== null && minutelyData.length - currentWindowStart >= minDurationMinutes && !windowStart) {
            windowStart = minutelyData[currentWindowStart].time;
            windowEnd = minutelyData[minutelyData.length - 1].time;
        }

        return { isSafeNow: false, nextWindowStart: windowStart, nextWindowEnd: windowEnd };

    }, [minutelyData, threshold, minDurationMinutes]);
};
