/**
 * Air Quality Service - Fetches AQI data from Open-Meteo (Free, no API key required)
 * https://open-meteo.com/en/docs/air-quality-api
 */

const AQI_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

/**
 * AQI Level definitions based on US EPA standards
 */
export const AQI_LEVELS = {
    GOOD: { min: 0, max: 50, label: 'Good', color: '#22c55e', emoji: '😊', advice: 'Air quality is satisfactory.' },
    MODERATE: { min: 51, max: 100, label: 'Moderate', color: '#f59e0b', emoji: '😐', advice: 'Acceptable for most, but sensitive groups should limit prolonged outdoor exertion.' },
    UNHEALTHY_SENSITIVE: { min: 101, max: 150, label: 'Unhealthy for Sensitive', color: '#f97316', emoji: '😷', advice: 'Sensitive groups (asthma, elderly) should reduce outdoor activity.' },
    UNHEALTHY: { min: 151, max: 200, label: 'Unhealthy', color: '#ef4444', emoji: '🚫', advice: 'Everyone may experience health effects. Limit outdoor exertion.' },
    VERY_UNHEALTHY: { min: 201, max: 300, label: 'Very Unhealthy', color: '#7c3aed', emoji: '⚠️', advice: 'Health alert! Avoid outdoor activities.' },
    HAZARDOUS: { min: 301, max: 500, label: 'Hazardous', color: '#991b1b', emoji: '☠️', advice: 'Emergency conditions. Stay indoors.' },
};

/**
 * Get AQI level info based on numeric value
 */
export const getAQILevel = (aqi) => {
    if (aqi <= 50) return AQI_LEVELS.GOOD;
    if (aqi <= 100) return AQI_LEVELS.MODERATE;
    if (aqi <= 150) return AQI_LEVELS.UNHEALTHY_SENSITIVE;
    if (aqi <= 200) return AQI_LEVELS.UNHEALTHY;
    if (aqi <= 300) return AQI_LEVELS.VERY_UNHEALTHY;
    return AQI_LEVELS.HAZARDOUS;
};

/**
 * Fetches current air quality data for given coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object} AQI data including us_aqi, pm2_5, pm10, pollen
 */
export const fetchAirQuality = async (lat, lon) => {
    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: [
                'us_aqi',
                'pm2_5',
                'pm10',
                'carbon_monoxide',
                'ozone',
                'grass_pollen',
                'birch_pollen',
                'ragweed_pollen',
                'alder_pollen'
            ].join(','),
            timezone: 'auto'
        });

        const response = await fetch(`${AQI_BASE_URL}?${params}`);

        if (!response.ok) {
            throw new Error(`AQI fetch failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.current) {
            return null;
        }

        const current = data.current;
        const aqiValue = current.us_aqi || 0;
        const level = getAQILevel(aqiValue);

        // Calculate total pollen (sum of all pollen types)
        const pollenTypes = ['grass_pollen', 'birch_pollen', 'ragweed_pollen', 'alder_pollen'];
        const totalPollen = pollenTypes.reduce((sum, type) => sum + (current[type] || 0), 0);

        // Pollen level classification (grains/m³)
        let pollenLevel = 'Low';
        let pollenColor = '#22c55e';
        if (totalPollen > 50) { pollenLevel = 'Moderate'; pollenColor = '#f59e0b'; }
        if (totalPollen > 100) { pollenLevel = 'High'; pollenColor = '#f97316'; }
        if (totalPollen > 200) { pollenLevel = 'Very High'; pollenColor = '#ef4444'; }

        return {
            aqi: aqiValue,
            level: level,
            pm2_5: current.pm2_5 || 0,
            pm10: current.pm10 || 0,
            ozone: current.ozone || 0,
            pollen: {
                total: totalPollen,
                level: pollenLevel,
                color: pollenColor,
                grass: current.grass_pollen || 0,
                birch: current.birch_pollen || 0,
                ragweed: current.ragweed_pollen || 0,
            }
        };
    } catch (error) {
        console.error('Error fetching air quality:', error);
        return null;
    }
};
