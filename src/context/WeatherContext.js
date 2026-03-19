import React, { createContext, useState, useEffect, useContext, useMemo, useRef } from 'react';
import { fetchWeather } from '../services/WeatherService';
import { getCurrentLocation, reverseGeocode } from '../services/LocationService';
import {
    saveWeatherData,
    getCachedWeatherData,
    getApiKey,
    saveApiKey as saveKeyToStorage,
    getUnits,
    saveUnits as saveUnitsToStorage,
    getLocationConfig,
    saveLocationConfig as saveLocationToStorage,
    getSelectedActivity,
    saveSelectedActivity as saveActivityToStorage,
    saveLastKnownLocation,
    savePressureHistory,
    getPressureHistory,
    saveWeatherSnapshot
} from '../services/StorageService';
import { getSpots, addSpot as addSpotToStorage, removeSpot as removeSpotFromStorage } from '../services/SpotService';
import { incrementStreak } from '../services/StreakService';
import { fetchWarnings } from '../services/WeatherWarningService';
import { updateWidgetData } from '../services/WidgetService';
import NetInfo from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';
import { analyzeActivitySafety } from '../utils/weatherSafety';
import { saveDailyWeatherSnapshot } from '../services/HistoricalWeatherService';

const WeatherContext = createContext();

export const useWeather = () => useContext(WeatherContext);

export const WeatherProvider = ({ children }) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // apiKey is now OPTIONAL — null means use Open-Meteo (default, no key required).
    // A non-null value means use PirateWeather (power-user mode).
    const [apiKey, setApiKeyState] = useState(null);
    const [units, setUnitsState] = useState('us');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [locationConfig, setLocationConfigState] = useState({ mode: 'auto' });
    const [locationName, setLocationName] = useState('Current Location');
    const [selectedActivity, setSelectedActivityState] = useState('walk');
    const [isOffline, setIsOffline] = useState(false);
    const [savedSpots, setSavedSpots] = useState([]);
    const [pressureHistory, setPressureHistory] = useState([]);
    const [weatherWarnings, setWeatherWarnings] = useState([]);
    const [forecastConfidence, setForecastConfidence] = useState('medium');

    // Cache the last successfully resolved coordinates so a units-change re-fetch
    // can skip the GPS step and use them directly.
    const lastResolvedCoordsRef = useRef(null);
    const lastResolvedNameRef = useRef('Current Location');

    // Tracks whether initial data has loaded so we can skip redundant refreshes.
    const initialLoadDoneRef = useRef(false);

    // Network connectivity listener
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOffline(!state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        loadInitialData();
    }, []);

    // Full refresh on location config change (after initial load)
    useEffect(() => {
        if (!initialLoadDoneRef.current) return;
        refreshWeather();
    }, [locationConfig]);

    // Full refresh when the user switches to a custom PirateWeather key
    // (apiKey changing from null → value, or vice versa)
    useEffect(() => {
        if (!initialLoadDoneRef.current) return;
        refreshWeather();
    }, [apiKey]);

    // Fast re-fetch on units change: reuse last known coords, skip GPS entirely
    useEffect(() => {
        if (!initialLoadDoneRef.current) return;
        if (!lastResolvedCoordsRef.current) return;
        refreshWithCoords(lastResolvedCoordsRef.current, lastResolvedNameRef.current);
    }, [units]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            // Load stored preferences (all optional)
            const key = await getApiKey();
            if (key) setApiKeyState(key);

            const storedUnits = await getUnits();
            if (storedUnits) setUnitsState(storedUnits);

            const storedLoc = await getLocationConfig();
            if (storedLoc) setLocationConfigState(storedLoc);

            const storedActivity = await getSelectedActivity();
            if (storedActivity) setSelectedActivityState(storedActivity);

            const spots = await getSpots();
            if (spots) setSavedSpots(spots);

            const history = await getPressureHistory();
            if (history) setPressureHistory(history);

            // Show cached data immediately if available
            const cached = await getCachedWeatherData();
            if (cached) {
                setWeather(cached.data);
                setLastUpdated(cached.timestamp);
            }
        } catch (e) {
        Sentry.captureException(e);
            console.error('[WeatherContext] loadInitialData error:', e);
        } finally {
            // Mark initial load as done, then kick off the first real weather fetch.
            // We do this AFTER setting state so the effects above don't fire early.
            initialLoadDoneRef.current = true;
            // Always fetch on startup — Open-Meteo requires no key
            await refreshWeather();
        }
    };

    /**
     * Internal: fetch weather for a known set of coords + name.
     * Used by both the full refresh and the fast units-change re-fetch.
     */
    const refreshWithCoords = async (coords, name) => {
        setError(null);

        const lat = parseFloat(coords.latitude);
        const lon = parseFloat(coords.longitude);
        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            setError(`Invalid coordinates: ${coords.latitude}, ${coords.longitude}`);
            return;
        }

        try {
            // apiKey may be null — WeatherService will fall back to Open-Meteo
            const data = await fetchWeather(apiKey, lat, lon, units);
            setWeather(data);
            if (data.confidence) {
                setForecastConfidence(data.confidence);
            }
            setLocationName(name);

            if (data.currently && data.currently.pressure) {
                setPressureHistory(prev => {
                    const newEntry = { time: Date.now(), value: data.currently.pressure };
                    const newHistory = [...prev, newEntry].slice(-6);
                    savePressureHistory(newHistory);
                    return newHistory;
                });
            }

            // Fetch live weather warnings from Open-Meteo
            const warnings = await fetchWarnings(lat, lon);
            setWeatherWarnings(warnings);

            setLastUpdated(Date.now());
            await saveWeatherData(data);
            
            // Save current condition snapshot for next week comparison
            if (data?.currently) {
                const activityScore = analyzeActivitySafety(selectedActivity || 'walk', data.currently, units)?.score;
                const snapshot = {
                    temperature: data.currently.temperature,
                    precipProbability: data.currently.precipProbability,
                    windSpeed: data.currently.windSpeed,
                    conditions: data.currently.summary,
                    score: activityScore || 0,
                    timestamp: Date.now()
                };
                const now = new Date();
                await saveWeatherSnapshot(now.getDay(), now.getHours(), snapshot);
            }

            updateWidgetData(data, selectedActivity || 'walk', units);
            await incrementStreak();
        } catch (e) {
        Sentry.captureException(e);
            setError(e.message);
            if (__DEV__) console.error('[WeatherContext] refreshWithCoords failed:', e);
        }
    };

    /**
     * Full refresh: resolves coordinates (GPS or manual), then fetches weather.
     */
    const refreshWeather = async () => {
        // Only show full-screen loader on first load; subsequent refreshes update silently
        if (!weather) setLoading(true);
        setError(null);

        try {
            let coords;
            let name;

            if (locationConfig.mode === 'manual' && locationConfig.coords) {
                coords = locationConfig.coords;
                name = locationConfig.label || 'Manual Location';
            } else {
                coords = await getCurrentLocation();
                saveLastKnownLocation(coords);
                name = await reverseGeocode(coords.latitude, coords.longitude);
            }

            lastResolvedCoordsRef.current = coords;
            lastResolvedNameRef.current = name;

            await refreshWithCoords(coords, name);
        } catch (e) {
        Sentry.captureException(e);
            setError(e.message);
            if (__DEV__) console.error('[WeatherContext] refreshWeather failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const setApiKey = async (key) => {
        setApiKeyState(key);
        await saveKeyToStorage(key);
    };

    const setUnits = async (newUnits) => {
        setUnitsState(newUnits);
        await saveUnitsToStorage(newUnits);
    };

    const setLocationConfig = async (config) => {
        setLocationConfigState(config);
        await saveLocationToStorage(config);
    };

    const setSelectedActivity = async (activity) => {
        setSelectedActivityState(activity);
        await saveActivityToStorage(activity);
    };

    const addSpot = async (spot) => {
        const newSpots = await addSpotToStorage(spot);
        setSavedSpots(newSpots);
    };

    const removeSpot = async (id) => {
        const newSpots = await removeSpotFromStorage(id);
        setSavedSpots(newSpots);
    };

    const value = useMemo(() => ({
        weather, loading, error, apiKey, setApiKey,
        units, setUnits, refreshWeather, lastUpdated,
        locationConfig, setLocationConfig, locationName,
        selectedActivity, setSelectedActivity, isOffline,
        savedSpots, addSpot, removeSpot, pressureHistory, weatherWarnings, forecastConfidence
    }), [weather, loading, error, apiKey, units, lastUpdated, locationConfig, locationName, selectedActivity, isOffline, savedSpots, pressureHistory, weatherWarnings, forecastConfidence]);

    return (
        <WeatherContext.Provider value={value}>
            {children}
        </WeatherContext.Provider>
    );
};
