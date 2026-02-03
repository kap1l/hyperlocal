const BASE_URL = 'https://api.pirateweather.net/forecast';

export const fetchWeather = async (apiKey, lat, lon, units = 'us') => {
    if (!apiKey) {
        throw new Error('API Key is missing');
    }

    // Sanitize parameters to avoid 404 due to spaces or invalid types
    // Remove quotes if user accidentally pasted them
    const sanitizedKey = apiKey.trim().replace(/['"]/g, '');
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    console.log(`[WeatherService] using Key: ${sanitizedKey.substring(0, 4)}... Coords: ${latitude}, ${longitude}`);

    if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error(`Invalid Coordinates: ${lat}, ${lon}`);
    }

    const url = `${BASE_URL}/${sanitizedKey}/${latitude},${longitude}?units=${units}&extend=hourly`;

    // Debug log to verify params (masking key for security)
    const maskedUrl = url.replace(apiKey, 'HIDDEN_KEY');
    console.log(`[WeatherService] Fetching: ${maskedUrl}`);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[WeatherService] Error ${response.status}: ${errorText}`);
            if (response.status === 403) {
                throw new Error(`Invalid API Key (403). Please check your PirateWeather key.`);
            }
            throw new Error(`Weather fetch failed (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();
        // Add coordinates to data for easy access by components
        data.latitude = lat;
        data.longitude = lon;
        return data;
    } catch (error) {
        console.error("[WeatherService] Network Error:", error.message);
        if (error.message.includes('Network request failed')) {
            throw new Error('Network error. Check internet connection.');
        }
        throw error;
    }
};
