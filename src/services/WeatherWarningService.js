import * as Sentry from '@sentry/react-native';

export const fetchWarnings = async (lat, lon) => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${parseFloat(lat)}&longitude=${parseFloat(lon)}&alerts=alerts&timezone=auto`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Open-Meteo alerts fetch failed: ${response.status}`);
        }
        
        const raw = await response.json();
        
        if (!raw.alerts || !Array.isArray(raw.alerts)) {
            return [];
        }
        
        return raw.alerts.map(a => ({
            id: a.event + a.start,
            title: a.event,
            description: a.description,
            severity: a.severity || 'moderate',
            start: a.start,
            end: a.end
        }));
    } catch (e) {
        // We log it but return empty array so that weather failure doesn't block the rest of the app
        Sentry.captureException(e);
        console.error("Failed to fetch weather warnings", e);
        return [];
    }
};
