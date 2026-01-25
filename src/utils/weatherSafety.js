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

/**
 * Returns a severity label to override API summaries if conditions are extreme.
 */
export const getSeverityOverride = (currently, isMetric) => {
    if (!currently) return null;
    const precip = currently.precipIntensity || 0; // Inches per hour usually
    const wind = currently.windSpeed || 0;
    const tempF = isMetric ? (currently.temperature * 9 / 5) + 32 : currently.temperature;

    // Snow Logic
    if (tempF < 34) {
        // EXTREME COLD LOGIC (<15F): Snow ratio is ~30:1.
        // 0.02" liquid = 0.6" snow/hr (Moderate/Heavy)
        if (tempF < 15) {
            if (precip > 0.01) return "Heavy Snow";
            if (wind > 10 && precip > 0.001) return "Winter Storm";
        }

        // Standard Cold (15-34F): Snow ratio ~10:1
        if (precip > 0.05) return "Heavy Snow";
        if (wind > 20 && precip > 0.005) return "Winter Storm";
        if (precip > 0.002) return "Snow";
    }
    // Rain Logic
    else {
        if (precip > 0.3) return "Heavy Rain";
        if (precip > 0.1) return "Moderate Rain";
    }

    // Wind Logic
    if (wind > 50) return "Damaging Winds";

    return null; // No override needed, trust API
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

// Define ideal conditions (The Chart) - Extracted for performance
const ACTIVITY_THRESHOLDS = {
    run: {
        temp: { ideal: [45, 65], warning: [20, 85], unit: '°F' },
        wind: { ideal: [0, 10], warning: [0, 20], unit: 'mph' }
    },
    walk: {
        temp: { ideal: [55, 75], warning: [35, 85], unit: '°F' },
        uv: { ideal: [0, 4], warning: [0, 7], unit: '' }
    },
    hike: {
        temp: { ideal: [55, 75], warning: [35, 85], unit: '°F' },
        uv: { ideal: [0, 4], warning: [0, 7], unit: '' }
    },
    cycle: {
        temp: { ideal: [55, 75], warning: [45, 90], unit: '°F' },
        wind: { ideal: [0, 8], warning: [0, 15], unit: 'mph' }
    },
    moto: {
        temp: { ideal: [65, 85], warning: [55, 95], unit: '°F' },
        wind: { ideal: [0, 10], warning: [0, 20], unit: 'mph' }
    },
    tennis: {
        temp: { ideal: [65, 80], warning: [55, 90], unit: '°F' },
        wind: { ideal: [0, 10], warning: [0, 15], unit: 'mph' }
    },
    pickleball: {
        temp: { ideal: [65, 80], warning: [55, 90], unit: '°F' },
        wind: { ideal: [0, 10], warning: [0, 15], unit: 'mph' }
    },
    golf: {
        temp: { ideal: [65, 80], warning: [50, 90], unit: '°F' },
        wind: { ideal: [0, 10], warning: [0, 20], unit: 'mph' }
    },
    yoga: {
        temp: { ideal: [70, 85], warning: [65, 90], unit: '°F' },
        wind: { ideal: [0, 5], warning: [0, 10], unit: 'mph' }
    },
    picnic: {
        temp: { ideal: [70, 80], warning: [60, 85], unit: '°F' },
        wind: { ideal: [0, 8], warning: [0, 12], unit: 'mph' }
    },
    stargaze: {
        cloud: { ideal: [0, 10], warning: [0, 30], unit: '%' },
        vis: { ideal: [8, 10], warning: [5, 10], unit: 'mi' }
    },
    fishing: {
        temp: { ideal: [50, 80], warning: [40, 90], unit: '°F' },
        wind: { ideal: [0, 10], warning: [0, 15], unit: 'mph' }
    },
    camera: {
        vis: { ideal: [8, 10], warning: [3, 10], unit: 'mi' },
        wind: { ideal: [0, 10], warning: [0, 20], unit: 'mph' }
    }
};

/**
 * Unified safety analysis for user-selected activities
 * @param {string} activityId - 'run' | 'walk' | 'cycle' | 'camera' | 'drive'
 * @param {Object} currently - Minutely/Current weather data
 * @param {string} units - 'si' | 'us'
 */
export const analyzeActivitySafety = (activityId, currently, units = 'us') => {
    if (!currently) return null;

    const isMetric = units === 'si';
    const tempF = isMetric ? (currently.temperature * 9 / 5) + 32 : currently.temperature;
    const windMph = isMetric ? currently.windSpeed * 0.621371 : currently.windSpeed;
    const precip = currently.precipProbability || 0;
    const uv = currently.uvIndex || 0;
    const visibility = currently.visibility || 10;
    const humidity = currently.humidity || 0;
    const cloudCover = currently.cloudCover || 0; // 0-1

    let score = 100;
    let metrics = [];
    let advice = "Enjoy your activity!";

    // Helper to format metric status
    const evaluateMetric = (name, value, idealRange, warningRange, unitLabel) => {
        let status = 'good';
        if (value < warningRange[0] || value > warningRange[1]) {
            status = 'poor';
            score -= 60; // CRITICAL FIX: Danger Zone
        } else if (value < idealRange[0] || value > idealRange[1]) {
            status = 'fair';
            score -= 20; // Non-Ideal penalty

            // BORDERLINE CHECK for Temperature
            if (name === 'Temp') {
                const distToMin = value - warningRange[0];
                const distToMax = warningRange[1] - value;
                if (distToMin <= 5 || distToMax <= 5) {
                    score -= 15; // Downgrade to Fair
                }
            }
        }
        metrics.push({ name, value: `${Math.round(value)}${unitLabel}`, status });
    };

    // Common Checks
    const isFreezing = tempF <= 32;
    const icon = currently.icon || '';
    const isIconRain = icon.includes('rain') || icon.includes('sleet');
    const isIconSnow = icon.includes('snow');
    const isSnowing = isFreezing && (isIconSnow || precip > 0.4);
    const isRaining = !isFreezing && (isIconRain || precip > 0.4);
    const isRainRisk = !isRaining && !isSnowing && precip > 0.15;
    const isHeavyRain = precip > 0.5;

    // Use thresholds if available
    const thresholds = ACTIVITY_THRESHOLDS[activityId];

    switch (activityId) {
        // --- RUNNING & BASICS ---
        case 'run':
            if (thresholds) {
                evaluateMetric('Temp', tempF, thresholds.temp.ideal, thresholds.temp.warning, '°F');
                evaluateMetric('Wind', windMph, thresholds.wind.ideal, thresholds.wind.warning, 'mph');
            }

            if (isSnowing) {
                score -= 50;
                metrics.push({ name: 'Cond', value: 'Ice', status: 'poor' });
                advice = "Slippery footing. Spiked shoes recommended.";
            } else if (isRaining) {
                score -= 30;
                metrics.push({ name: 'Cond', value: 'Rain', status: 'poor' });
                advice = "Wet run. Watch your step.";
            } else if (isRainRisk) {
                score -= 10;
                metrics.push({ name: 'Risk', value: 'Rainy', status: 'fair' });
                advice = "Chance of rain. Bring a shell.";
            } else if (score >= 90) {
                advice = "Perfect running conditions. Go for a PR!";
            } else if (windMph > 20) {
                advice = "Strong headwinds. It's gonna be a workout.";
            } else if (score < 70) {
                advice = "Conditions are challenging.";
            } else {
                advice = "Good conditions, stay hydrated.";
            }
            break;

        case 'walk':
        case 'hike':
            if (thresholds) {
                evaluateMetric('Temp', tempF, thresholds.temp.ideal, thresholds.temp.warning, '°F');
                evaluateMetric('UV', uv, thresholds.uv.ideal, thresholds.uv.warning, '');
            }

            if (isSnowing) {
                score -= 60;
                metrics.push({ name: 'Cond', value: 'Snow', status: 'poor' });
                advice = "Snow/Ice risk. Trails slippery.";
            } else if (isRaining) {
                score -= 40;
                advice = "It's raining. Wear waterproof gear.";
            } else if (isRainRisk) {
                score -= 15;
                advice = "Rain possible. Pack an umbrella.";
            } else if (score >= 90) {
                advice = "Beautiful day to be outside.";
            } else {
                advice = "Decent conditions.";
            }
            break;

        // --- WHEELS ---
        case 'cycle':
            if (thresholds) {
                evaluateMetric('Temp', tempF, thresholds.temp.ideal, thresholds.temp.warning, '°F');
                evaluateMetric('Wind', windMph, thresholds.wind.ideal, thresholds.wind.warning, 'mph');
            }

            if (isSnowing) {
                score -= 80;
                metrics.push({ name: 'Road', value: 'Icy', status: 'poor' });
                advice = "Too dangerous. Ice on roads.";
            } else if (isRaining) {
                score -= 50;
                metrics.push({ name: 'Road', value: 'Wet', status: 'poor' });
                advice = "Slippery turns & poor braking.";
            } else if (isRainRisk) {
                score -= 20;
                advice = "Roads might be slick.";
            } else if (windMph > 20) {
                score -= 30;
                advice = "Dangerous crosswinds.";
            } else if (score >= 90) {
                advice = "The road is calling. Perfect ride day.";
            } else {
                advice = "Okay for a ride, check the wind.";
            }
            break;

        case 'moto':
            if (thresholds) {
                evaluateMetric('Temp', tempF, thresholds.temp.ideal, thresholds.temp.warning, '°F');
                evaluateMetric('Wind', windMph, thresholds.wind.ideal, thresholds.wind.warning, 'mph');
            }

            if (isSnowing) {
                score -= 100;
                metrics.push({ name: 'Risk', value: 'High', status: 'poor' });
                advice = "DO NOT RIDE. Ice hazard.";
            } else if (isRaining) {
                score -= 60;
                advice = "Traction loss likely. Stay home.";
            } else if (isRainRisk) {
                score -= 30;
                advice = "Rain possible. Grip reduced.";
            } else if (visibility < 3) {
                score -= 40;
                advice = "Low visibility. Dangerous.";
            } else if (score >= 90) {
                advice = "Carve those canyons. Perfect grip.";
            } else {
                advice = "Wear full gear, watch for slick spots.";
            }
            break;

        case 'drive':
            if (isSnowing) {
                score -= 50;
                advice = "Ice/Snow. Drive slow.";
            } else if (isHeavyRain) {
                score -= 40;
                advice = "Hydroplaning risk. Slow down.";
            } else if (isRainRisk) {
                advice = "Roads might be damp.";
            } else if (visibility < 2) {
                score -= 50;
                advice = "Foggy. Use low beams.";
            }
            evaluateMetric('Vis', visibility, [5, 10], [2, 10], 'mi');
            break;

        // --- SPORTS ---
        case 'tennis':
        case 'pickleball':
            if (thresholds) {
                evaluateMetric('Temp', tempF, thresholds.temp.ideal, thresholds.temp.warning, '°F');
                evaluateMetric('Wind', windMph, thresholds.wind.ideal, thresholds.wind.warning, 'mph');
            }

            if (isRaining) {
                score -= 100;
                advice = "Courts are wet. Unplayable.";
            } else if (isRainRisk) {
                score -= 40;
                advice = "Rain might stop play.";
            } else if (windMph > 15) {
                score -= 30;
                advice = "Wind will affect ball flight.";
            } else if (score >= 90) {
                advice = "Perfect serving weather.";
            } else {
                advice = "Court conditions are okay.";
            }
            break;

        case 'golf':
            if (thresholds) {
                evaluateMetric('Temp', tempF, thresholds.temp.ideal, thresholds.temp.warning, '°F');
                evaluateMetric('Wind', windMph, thresholds.wind.ideal, thresholds.wind.warning, 'mph');
            }

            if (isSnowing) {
                score -= 100; advice = "Course covered in snow.";
            } else if (isRaining) {
                score -= 50; advice = "Cart path only. Bring rain gear.";
            } else if (isRainRisk) {
                score -= 20; advice = "Chance of showers.";
            } else if (score >= 90) {
                advice = "Hit the links. Conditions are prime.";
            } else {
                advice = "Playable, but maybe windy/cold.";
            }
            break;

        case 'yoga':
            if (thresholds) {
                evaluateMetric('Temp', tempF, thresholds.temp.ideal, thresholds.temp.warning, '°F');
                evaluateMetric('Wind', windMph, thresholds.wind.ideal, thresholds.wind.warning, 'mph');
            }

            if (isRaining) { score -= 100; advice = "Go to the studio. Grass is wet."; }
            else if (isRainRisk) { score -= 40; advice = "Keep a mat towel handy (rain chance)."; }
            else if (tempF < 60) { score -= 40; advice = "Too cold for outdoor flow."; }
            else if (score >= 90) advice = "Namaste outside. Perfect zen.";
            else advice = "A bit chilly/breezy for outdoor flow.";
            break;

        // --- LEISURE ---
        case 'picnic':
            if (thresholds) {
                evaluateMetric('Temp', tempF, thresholds.temp.ideal, thresholds.temp.warning, '°F');
                evaluateMetric('Wind', windMph, thresholds.wind.ideal, thresholds.wind.warning, 'mph');
            }

            if (isRaining) { score -= 100; advice = "Rain will ruin the sandwiches."; }
            else if (isRainRisk) { score -= 40; advice = "Maybe find a shelter."; }
            else if (tempF < 55) { score -= 40; advice = "Too cold to sit still."; }
            else if (score >= 90) advice = "Pack the basket! Ideal picnic weather.";
            else advice = "Conditions are fair.";
            break;

        case 'stargaze':
            if (thresholds) {
                evaluateMetric('Cloud', cloudCover * 100, thresholds.cloud.ideal, thresholds.cloud.warning, '%');
                evaluateMetric('Vis', visibility, thresholds.vis.ideal, thresholds.vis.warning, 'mi');
            }

            if (cloudCover > 0.5) { score -= 80; advice = "Too cloudy. Stars info hidden."; }
            else if (isRaining || isSnowing) { score -= 100; advice = "No view tonight."; }
            else if (score >= 80) advice = "Look up! Clear skies tonight.";
            else advice = "Some viewing possible between clouds.";
            break;

        case 'fishing':
            if (thresholds) {
                evaluateMetric('Wind', windMph, thresholds.wind.ideal, thresholds.wind.warning, 'mph');
                evaluateMetric('Temp', tempF, thresholds.temp.ideal, thresholds.temp.warning, '°F');
            }

            if (isSnowing) advice = "Freezing lines. Hard day.";
            else if (isHeavyRain) advice = "Fish bite in rain, but it's miserable.";
            else if (tempF < 40) advice = "Fish are sluggish / deep.";
            else advice = "Tight lines! Conditions are fair.";
            break;

        case 'camera':
            if (thresholds) {
                evaluateMetric('Vis', visibility, thresholds.vis.ideal, thresholds.vis.warning, 'mi');
                evaluateMetric('Wind', windMph, thresholds.wind.ideal, thresholds.wind.warning, 'mph');
            }

            if (isRaining) { score -= 40; metrics.push({ name: 'Lens', value: 'Wet', status: 'poor' }); advice = "Water hazard for gear."; }
            else if (isRainRisk) { score -= 10; advice = "Rain risk. Protect the gear."; }
            else if (score >= 90) advice = "Crisp visibility. Great for landscapes.";
            else advice = "Check your gear, conditions vary.";
            break;

        default:
            advice = "Looks like a good day to be outside.";
    }

    score = Math.max(0, score);

    // Determine high-level status label/color
    let statusLabel = 'Ideal';
    let statusColor = '#22c55e'; // Green
    if (score < 85) { statusLabel = 'Good'; statusColor = '#84cc16'; } // Lime
    if (score < 70) { statusLabel = 'Fair'; statusColor = '#f59e0b'; } // Amber
    if (score < 50) { statusLabel = 'Poor'; statusColor = '#f97316'; } // Orange
    if (score < 30) { statusLabel = 'Hazardous'; statusColor = '#ef4444'; } // Red

    return {
        score,
        status: statusLabel,
        label: statusLabel,
        color: statusColor,
        advice,
        metrics
    };
};
