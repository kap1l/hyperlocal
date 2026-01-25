/**
 * Analyzes current weather for human safety risks.
 * @param {Object} currently - The currently data object from API
 * @param {string} units - 'si' (metric) or 'us' (imperial)
 * @returns {Object} { status: 'safe'|'warning'|'unsafe', label, color }
 */
export const analyzeTemperatureSafety = (currently, units = 'us') => {
    if (!currently) return null;

    const isMetric = units === 'si';
    const tempF = isMetric ? (currently.temperature * 9 / 5) + 32 : currently.temperature;
    const feelsLikeF = isMetric ? (currently.apparentTemperature * 9 / 5) + 32 : currently.apparentTemperature;

    // Extreme Conditions
    if (tempF < 10 || feelsLikeF < 5) return { status: 'unsafe', label: 'Dangerously Cold', color: '#ef4444' };
    if (tempF > 100 || feelsLikeF > 105) return { status: 'unsafe', label: 'Dangerously Hot', color: '#ef4444' };

    // Warnings
    if (tempF < 32 || feelsLikeF < 25) return { status: 'warning', label: 'Freezing Conditions', color: '#f59e0b' };
    if (tempF > 90 || feelsLikeF > 95) return { status: 'warning', label: 'Heat Advisory', color: '#f59e0b' };

    return { status: 'safe', label: 'Safe Temp', color: '#22c55e' };
};

export const analyzeDogWalkingSafety = (currently, units = 'us') => {
    if (!currently) return null;
    const isMetric = units === 'si';
    const tempF = isMetric ? (currently.temperature * 9 / 5) + 32 : currently.temperature;

    // Pavement heat rule of thumb: If air temp > 85F, pavement can be > 135F
    if (tempF > 85) return { status: 'unsafe', label: 'Pavement Too Hot', color: '#ef4444' };

    // Dogs are generally hardier in cold, but extreme cold is bad
    if (tempF < 15) return { status: 'warning', label: 'Too Cold for Paws', color: '#f59e0b' };

    return { status: 'safe', label: 'Safe for Paws', color: '#22c55e' };
}

/**
 * Unified safety analysis for user-selected activities
 * @param {string} activityId - 'run' | 'walk' | 'cycle' | 'camera' | 'drive'
 * @param {Object} currently - Minutely/Current weather data
 * @param {string} units - 'si' | 'us'
 */
export const analyzeActivitySafety = (activityId, currently, units = 'us') => {
    if (!currently) return null;

    // Normalize temps to F for simpler logic
    const isMetric = units === 'si';
    const tempF = isMetric ? (currently.temperature * 9 / 5) + 32 : currently.temperature;
    const windMph = isMetric ? currently.windSpeed * 0.621371 : currently.windSpeed;
    const precip = currently.precipProbability || 0;
    const uv = currently.uvIndex || 0;
    const visibility = currently.visibility || 10; // miles

    switch (activityId) {
        case 'cycle':
            if (precip > 0.25) return { status: 'unsafe', label: 'Slippery Roads', color: '#ef4444' };
            if (windMph > 25) return { status: 'unsafe', label: 'Dangerous Crosswinds', color: '#ef4444' };
            if (windMph > 15) return { status: 'warning', label: 'Strong Headwinds', color: '#f59e0b' };
            if (tempF < 35) return { status: 'warning', label: 'Ice Risk', color: '#f59e0b' };
            if (tempF > 95) return { status: 'warning', label: 'Extreme Heat', color: '#f59e0b' };
            return { status: 'safe', label: 'Great Riding Conditions', color: '#22c55e' };

        case 'camera':
            if (precip > 0.1) return { status: 'unsafe', label: 'Rain (Gear Hazard)', color: '#ef4444' };
            if (windMph > 20) return { status: 'warning', label: 'Wind (Tripod Shake)', color: '#f59e0b' };
            // Golden hour logic would need time calculation, skipping for now
            if (currently.cloudCover > 0.9) return { status: 'warning', label: 'Flat Lighting', color: '#f59e0b' };
            return { status: 'safe', label: 'Good Shooting Conditions', color: '#22c55e' };

        case 'drive':
            if (precip > 0.5) return { status: 'warning', label: 'Heavy Rain', color: '#f59e0b' };
            if (visibility < 2) return { status: 'unsafe', label: 'Poor Visibility', color: '#ef4444' };
            if (tempF < 32 && precip > 0.1) return { status: 'unsafe', label: 'Black Ice Risk', color: '#ef4444' };
            return { status: 'safe', label: 'Good Driving Conditions', color: '#22c55e' };

        case 'walk':
            // General comfort
            if (tempF > 90) return { status: 'warning', label: 'Heat Advisory', color: '#f59e0b' };
            if (tempF < 20) return { status: 'warning', label: 'Dress Warmly', color: '#f59e0b' };
            if (precip > 0.2) return { status: 'warning', label: 'Rain', color: '#f59e0b' };
            return { status: 'safe', label: 'Great Walking Weather', color: '#22c55e' };

        case 'run':
            // Re-use logic or implement specific here if we want to bypass the simple temp check
            // For now, let's keep it simple
            if (tempF > 85) return { status: 'unsafe', label: 'Heat Risk', color: '#ef4444' };
            if (precip > 0.2) return { status: 'warning', label: 'Rain', color: '#f59e0b' };
            return { status: 'safe', label: 'Good Running Weather', color: '#22c55e' };

        default:
            return { status: 'safe', label: 'Go Outside', color: '#22c55e' };
    }
};
