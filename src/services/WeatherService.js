const BASE_URL = 'https://api.pirateweather.net/forecast';

export const fetchWeather = async (apiKey, lat, lon, units = 'us') => {
    if (!apiKey) {
        throw new Error('API Key is missing');
    }
    const url = `${BASE_URL}/${apiKey}/${lat},${lon}?units=${units}&extend=hourly`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather fetch failed: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching weather:", error);
        throw error;
    }
};
