import { analyzeActivitySafety } from './weatherSafety';

/**
 * Finds the best time windows for a given activity over the next 48 hours.
 * @param {Array} hourlyData - List of hourly weather objects from API
 * @param {string} activityId - 'run', 'tennis', etc.
 * @param {string} units - 'us' or 'si'
 * @returns {Array} - Sorted list of recommended slots { startTime, endTime, avgScore, mainAdvice }
 */
export const findBestTimeSlots = (hourlyData, activityId, units = 'us') => {
    if (!hourlyData || hourlyData.length === 0) return [];

    // 1. Score every hour, but only keep those within 5 AM - 10 PM
    const scoredHours = hourlyData.slice(0, 48).filter(hour => {
        const h = new Date(hour.time * 1000).getHours();
        return h >= 5 && h <= 22;
    }).map(hour => {
        const analysis = analyzeActivitySafety(activityId, hour, units);
        return {
            time: hour.time,
            score: analysis.score,
            status: analysis.status,
            advice: analysis.advice
        };
    });

    // 2. Group into contiguous slots (minimum 70 score)
    const slots = [];
    let currentSlot = null;

    for (let i = 0; i < scoredHours.length; i++) {
        const h = scoredHours[i];
        const isViable = h.score >= 70; // Only consider Good or Ideal hours

        if (isViable) {
            if (!currentSlot) {
                currentSlot = {
                    start: h.time,
                    end: h.time,
                    totalScore: h.score,
                    count: 1,
                    hours: [h]
                };
            } else {
                currentSlot.end = h.time;
                currentSlot.totalScore += h.score;
                currentSlot.count += 1;
                currentSlot.hours.push(h);
            }
        } else {
            if (currentSlot) {
                // End of a slot
                slots.push(finishSlot(currentSlot));
                currentSlot = null;
            }
        }
    }
    // Push final slot if exists
    if (currentSlot) slots.push(finishSlot(currentSlot));

    // 3. Filter short slots (optional, e.g., must be at least 2 hours? maybe not for simple quick activities)
    // but let's keep even 1 hour slots if they are really good.

    // 4. Rank slots
    // Priority: Score first, then Duration, then Sooner
    return slots.sort((a, b) => {
        if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
        return b.durationHours - a.durationHours;
    }).slice(0, 3); // Return top 3
};

const finishSlot = (slot) => {
    return {
        startTime: slot.start,
        endTime: slot.end + 3600, // End of the hour
        durationHours: slot.count,
        avgScore: Math.round(slot.totalScore / slot.count),
        // Pick advice from the best hour in the slot
        bestAdvice: slot.hours.sort((a, b) => b.score - a.score)[0].advice
    };
};
