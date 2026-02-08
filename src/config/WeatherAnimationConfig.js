export const WEATHER_BENCHMARKS = {
    // Rain Presets
    RAIN_LIGHT: {
        type: 'rain',
        count: 40,
        speedFactor: 1.0, // Baseline: 800-1200ms
        opacity: 0.5,
        width: 1,
        height: 15,
        color: '#a5f3fc'
    },
    RAIN_MODERATE: {
        type: 'rain',
        count: 80,
        speedFactor: 0.8, // Faster
        opacity: 0.6,
        width: 2,
        height: 18,
        color: '#a5f3fc'
    },
    RAIN_HEAVY: {
        type: 'rain',
        count: 150,
        speedFactor: 0.6, // Very fast
        opacity: 0.7,
        width: 2,
        height: 25,
        color: '#dbeafe' // Slightly whiter for heavy sheets
    },

    // Snow Presets
    SNOW_LIGHT: {
        type: 'snow',
        count: 30, // Was 25
        speedFactor: 1.0, // Baseline: 3000-5000ms
        opacity: 0.8,
        width: 4,
        height: 4,
        color: '#ffffff'
    },
    SNOW_MODERATE: {
        type: 'snow',
        count: 70,
        speedFactor: 0.8,
        opacity: 0.9,
        width: 5,
        height: 5,
        color: '#ffffff'
    },
    SNOW_HEAVY: { // Also covers "Winter Storm"
        type: 'snow',
        count: 150, // Was ~100 with multiplier (25 * 4)
        speedFactor: 0.4, // Fast driving snow
        opacity: 0.95,
        width: 6, // Larger flakes or clumping
        height: 6,
        color: '#ffffff'
    },

    // Defaults
    DEFAULT: {
        type: 'none',
        count: 0
    }
};

/**
 * Resolves the animation config based on the severity/condition string.
 * @param {string} condition - The weather condition string (e.g. "Heavy Snow")
 */
export const getAnimationConfig = (condition) => {
    if (!condition) return WEATHER_BENCHMARKS.DEFAULT;

    const c = condition.toLowerCase();

    // Snow logic
    if (c.includes('snow') || c.includes('blizzard') || c.includes('winter') || c.includes('flurries')) {
        if (c.includes('heavy') || c.includes('blizzard') || c.includes('storm')) return WEATHER_BENCHMARKS.SNOW_HEAVY;
        if (c.includes('moderate')) return WEATHER_BENCHMARKS.SNOW_MODERATE;
        return WEATHER_BENCHMARKS.SNOW_LIGHT;
    }

    // Rain logic
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower') || c.includes('sleet') || c.includes('storm')) {
        if (c.includes('heavy') || c.includes('storm') || c.includes('downpour')) return WEATHER_BENCHMARKS.RAIN_HEAVY;
        if (c.includes('moderate')) return WEATHER_BENCHMARKS.RAIN_MODERATE;
        return WEATHER_BENCHMARKS.RAIN_LIGHT;
    }

    return WEATHER_BENCHMARKS.DEFAULT;
};
