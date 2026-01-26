import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { fetchWeather } from '../services/WeatherService';
import { getCurrentLocation } from '../services/LocationService';
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
    saveLastKnownLocation
} from '../services/StorageService';
import { updateWidgetData } from '../services/WidgetService';
import NetInfo from '@react-native-community/netinfo';

const WeatherContext = createContext();

export const useWeather = () => useContext(WeatherContext);

export const WeatherProvider = ({ children }) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [apiKey, setApiKeyState] = useState(null);
    const [units, setUnitsState] = useState('us');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [locationConfig, setLocationConfigState] = useState({ mode: 'auto' });
    const [locationName, setLocationName] = useState('Current Location');
    const [selectedActivity, setSelectedActivityState] = useState('walk');
    const [isOffline, setIsOffline] = useState(false);

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

    useEffect(() => {
        if (apiKey) {
            refreshWeather();
        }
    }, [apiKey, units, locationConfig]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const key = await getApiKey();
            if (key) setApiKeyState(key);

            const storedUnits = await getUnits();
            if (storedUnits) setUnitsState(storedUnits);

            const storedLoc = await getLocationConfig();
            if (storedLoc) setLocationConfigState(storedLoc);

            const storedActivity = await getSelectedActivity();
            if (storedActivity) setSelectedActivityState(storedActivity);

            const cached = await getCachedWeatherData();
            if (cached) {
                setWeather(cached.data);
                setLastUpdated(cached.timestamp);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (!apiKey) setLoading(false);
        }
    };

    const refreshWeather = async () => {
        if (!apiKey) {
            setError("API Key missing");
            return;
        }

        // If we already have data, don't show full screen loader (Background Update)
        if (!weather) setLoading(true);
        setError(null);

        try {
            let coords;
            let name;

            // 1. Determine Coordinates Strategy
            if (locationConfig.mode === 'manual' && locationConfig.coords) {
                // Manual Mode: Fast & Deterministic
                coords = locationConfig.coords;
                name = locationConfig.label || 'Manual Location';
            } else {
                // Auto Mode: 
                // A. Try One-Shot GPS (This takes 2-3s)
                // Optimization: If we have lastKnownLocation, we could use it? 
                // For now, let's stick to simple "backgrounding" the spinner.

                // Note: To be truly "Instant", we would load weather for 'lastKnown' immediately,
                // then update if current location is significantly different. 
                // For this step, removing the 'setLoading(true)' when cached data exists is the biggest win.
                coords = await getCurrentLocation();

                // Save specific coords for next launch
                saveLastKnownLocation(coords);

                const { reverseGeocode } = require('../services/LocationService');
                name = await reverseGeocode(coords.latitude, coords.longitude);
            }

            // 2. Fetch Weather
            const data = await fetchWeather(apiKey, coords.latitude, coords.longitude, units);
            setWeather(data);
            setLocationName(name);
            setLastUpdated(Date.now());
            await saveWeatherData(data);

            // Update Android widget with latest data
            updateWidgetData(data, selectedActivity, units);

        } catch (e) {
            setError(e.message);
            console.error("Refresh failed", e);
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

    const value = useMemo(() => ({
        weather, loading, error, apiKey, setApiKey,
        units, setUnits, refreshWeather, lastUpdated,
        locationConfig, setLocationConfig, locationName,
        selectedActivity, setSelectedActivity, isOffline
    }), [weather, loading, error, apiKey, units, lastUpdated, locationConfig, locationName, selectedActivity, isOffline]);

    return (
        <WeatherContext.Provider value={value}>
            {children}
        </WeatherContext.Provider>
    );
};
