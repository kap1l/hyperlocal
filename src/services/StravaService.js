import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '141887'; // Fallback to provided dev ID if env missing
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || 'test_secret_replace_in_prod'; 

const authEndpoint = 'https://www.strava.com/oauth/mobile/authorize';
const tokenEndpoint = 'https://www.strava.com/oauth/token';

export const isStravaConnected = async () => {
    try {
        const token = await SecureStore.getItemAsync('strava_refresh_token');
        return !!token;
    } catch (e) {
        return false;
    }
};

export const connectStrava = async () => {
    try {
        const redirectUri = AuthSession.makeRedirectUri({
            scheme: 'outweather',
            path: 'strava-callback'
        });

        const authUrl = `${authEndpoint}?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=activity:read_all,profile:read_all`;

        const result = await AuthSession.startAsync({ authUrl });

        if (result.type === 'success') {
            const { code } = result.params;
            return await exchangeCodeForToken(code);
        }
        return false;
    } catch (error) {
        Sentry.captureException(error);
        console.error("Strava connect error:", error);
        return false;
    }
};

const exchangeCodeForToken = async (code) => {
    try {
        const res = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code'
            })
        });

        const data = await res.json();
        if (data.access_token) {
            await SecureStore.setItemAsync('strava_access_token', data.access_token);
            await SecureStore.setItemAsync('strava_refresh_token', data.refresh_token);
            await SecureStore.setItemAsync('strava_expires_at', data.expires_at.toString());
            if (data.athlete) {
                await SecureStore.setItemAsync('strava_athlete_name', `${data.athlete.firstname} ${data.athlete.lastname}`);
            }
            return true;
        }
        return false;
    } catch (e) {
        Sentry.captureException(e);
        console.error("Strava token exchange failed", e);
        return false;
    }
};

export const disconnectStrava = async () => {
    await SecureStore.deleteItemAsync('strava_access_token');
    await SecureStore.deleteItemAsync('strava_refresh_token');
    await SecureStore.deleteItemAsync('strava_expires_at');
    await SecureStore.deleteItemAsync('strava_athlete_name');
};

const getValidAccessToken = async () => {
    const expiresAt = await SecureStore.getItemAsync('strava_expires_at');
    if (!expiresAt) return null;

    if (Date.now() / 1000 > parseInt(expiresAt, 10)) {
        // Token expired, refresh it
        const refreshToken = await SecureStore.getItemAsync('strava_refresh_token');
        if (!refreshToken) return null;

        try {
            const res = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: STRAVA_CLIENT_ID,
                    client_secret: STRAVA_CLIENT_SECRET,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                })
            });
            const data = await res.json();
            if (data.access_token) {
                await SecureStore.setItemAsync('strava_access_token', data.access_token);
                await SecureStore.setItemAsync('strava_refresh_token', data.refresh_token);
                await SecureStore.setItemAsync('strava_expires_at', data.expires_at.toString());
                return data.access_token;
            }
        } catch (e) {
            Sentry.captureException(e);
            return null;
        }
    }
    return await SecureStore.getItemAsync('strava_access_token');
};

export const fetchStravaActivities = async () => {
    const token = await getValidAccessToken();
    if (!token) return [];

    try {
        const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to fetch Strava activities", e);
        return [];
    }
};

export const getStravaAthleteName = async () => {
    return await SecureStore.getItemAsync('strava_athlete_name');
};
