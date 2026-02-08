/**
 * Wardrobe Logic Engine
 * Maps weather conditions + activity intensity to clothing recommendations.
 */

// Clothing Item Definitions
const GEAR = {
    // TOPS
    TANK: { label: 'Tank Top', icon: 'shirt-outline' },
    TEE: { label: 'T-Shirt', icon: 'shirt-outline' },
    LONG_SLEEVE: { label: 'Long Sleeve', icon: 'shirt-outline' },
    THERMAL_BASE: { label: 'Thermal Base', icon: 'shirt-outline' },
    FLANNEL: { label: 'Flannel/Light Layer', icon: 'shirt' },
    HOODIE: { label: 'Hoodie/Fleece', icon: 'shirt' },
    WINDBREAKER: { label: 'Wind Shell', icon: 'cloud-outline' },
    RAIN_JACKET: { label: 'Rain Jacket', icon: 'umbrella-outline' },
    WINTER_COAT: { label: 'Winter Coat', icon: 'snow-outline' },

    // BOTTOMS
    SHORTS: { label: 'Shorts', icon: 'tablet-landscape-outline' }, // closest generic shape
    TIGHTS: { label: 'Tights/Leggings', icon: 'accessibility-outline' },
    PANTS: { label: 'Pants', icon: 'copy-outline' },
    THERMAL_TIGHTS: { label: 'Thermal Tights', icon: 'accessibility-outline' },
    RAIN_PANTS: { label: 'Rain Pants', icon: 'cloud-outline' },

    // ACCESSORIES
    SUNGLASSES: { label: 'Sunglasses', icon: 'glasses-outline' },
    HAT_CAP: { label: 'Cap', icon: 'happy-outline' },
    HAT_BEANIE: { label: 'Beanie', icon: 'snow-outline' },
    GLOVES_LIGHT: { label: 'Light Gloves', icon: 'hand-left-outline' },
    GLOVES_HEAVY: { label: 'Heavy Gloves', icon: 'hand-left-outline' },
    BUFF: { label: 'Neck Warmer', icon: 'git-commit-outline' }, // looks like a loop
};

/**
 * Get clothing recommendations
 * @param {Object} weather - { apparentTemperature (F), precipProbability, windSpeed, uvIndex, icon }
 * @param {string} activityId - 'run', 'walk', 'cycle', etc.
 */
export const getWardrobe = (weather, activityId) => {
    if (!weather) return [];

    const temp = weather.apparentTemperature;
    const precip = weather.precipProbability || 0;
    const isRaining = (weather.icon || '').includes('rain') || precip > 0.3;
    const isSnowing = (weather.icon || '').includes('snow') || (precip > 0.3 && temp < 32);
    const wind = weather.windSpeed || 0;
    const isSunny = (weather.cloudCover || 0) < 0.3 && (weather.uvIndex || 0) > 3;

    // Intensity Offset: Running generates more heat than walking.
    // We adjust "effective" temp up for high intensity to suggest lighter gear.
    let effectiveTemp = temp;

    switch (activityId) {
        case 'run':
        case 'tennis':
        case 'pickleball':
            effectiveTemp += 15; // Running at 40F feels like Sitting at 55F
            break;
        case 'cycle':
        case 'moto':
            effectiveTemp -= 10; // Wind chill factor not fully captured by static 'apparentTemperature'
            break;
        case 'yoga':
        case 'picnic':
        case 'fishing':
            // Sedentary: Trust the real feel or even cooler
            break;
    }

    const items = [];

    // --- TOPS ---
    if (effectiveTemp >= 75) {
        items.push(GEAR.TANK);
    } else if (effectiveTemp >= 65) {
        items.push(GEAR.TEE);
    } else if (effectiveTemp >= 55) {
        items.push(GEAR.LONG_SLEEVE);
    } else if (effectiveTemp >= 45) {
        items.push(GEAR.THERMAL_BASE);
        if (activityId === 'cycle' || wind > 10) items.push(GEAR.WINDBREAKER);
    } else if (effectiveTemp >= 30) {
        items.push(GEAR.THERMAL_BASE);
        items.push(GEAR.HOODIE);
    } else {
        items.push(GEAR.THERMAL_BASE);
        items.push(GEAR.WINTER_COAT);
    }

    // --- BOTTOMS ---
    if (effectiveTemp >= 60) {
        items.push(GEAR.SHORTS);
    } else if (effectiveTemp >= 45) {
        if (activityId === 'run') items.push(GEAR.SHORTS); // Runners like shorts until pretty cold
        else items.push(GEAR.PANTS);
    } else if (effectiveTemp >= 30) {
        items.push(GEAR.TIGHTS);
    } else {
        items.push(GEAR.THERMAL_TIGHTS);
    }

    // --- OUTER SHELL ---
    if (isRaining) {
        items.push(GEAR.RAIN_JACKET);
    }

    // --- ACCESSORIES ---
    if (isSunny) {
        items.push(GEAR.SUNGLASSES);
        items.push(GEAR.HAT_CAP);
    }

    if (temp < 45) {
        items.push(GEAR.GLOVES_LIGHT);
    }
    if (temp < 30) {
        items.push(GEAR.HAT_BEANIE);
        items.push(GEAR.BUFF);
    }

    return items;
};
