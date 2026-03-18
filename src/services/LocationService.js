import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

const LOCATION_CACHE_KEY = '@location_cache';
export const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
    }

    let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
    });
    return location.coords;
};

export const geocodeAddress = async (address) => {
    try {
        const results = await Location.geocodeAsync(address);
        if (results && results.length > 0) {
            return results.map(item => ({
                latitude: item.latitude,
                longitude: item.longitude,
                name: item.city ? `${item.city}, ${item.region || item.country}` : address,
                display: item
            }));
        }
        throw new Error('Location not found');
    } catch (e) {
        Sentry.captureException(e);
        console.error("Geocoding failed", e);
        throw e;
    }
};

export const reverseGeocode = async (lat, lon) => {
    try {
        const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (result && result.length > 0) {
            const item = result[0];
            return `${item.city || ''}, ${item.region || ''} ${item.postalCode || ''}`.trim();
        }
    } catch (e) {
        Sentry.captureException(e);
        console.log('Error reverse geocoding', e);
        return null;
    }
    return "Current Location";
};
