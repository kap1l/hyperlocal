import React, { createContext, useState, useEffect, useContext } from 'react';
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
    saveSelectedActivity as saveActivityToStorage
} from '../services/StorageService';

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

        setLoading(true);
        setError(null);
        try {
            let coords;
            let name;

            if (locationConfig.mode === 'manual' && locationConfig.coords) {
                coords = locationConfig.coords;
                name = locationConfig.label || 'Manual Location';
            } else {
                coords = await getCurrentLocation();
                const { reverseGeocode } = require('../services/LocationService');
                name = await reverseGeocode(coords.latitude, coords.longitude);
            }

            const data = await fetchWeather(apiKey, coords.latitude, coords.longitude, units);
            setWeather(data);
            setLocationName(name);
            setLastUpdated(Date.now());
            await saveWeatherData(data);
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

    return (
        <WeatherContext.Provider value={{
            weather, loading, error, apiKey, setApiKey,
            units, setUnits, refreshWeather, lastUpdated,
            locationConfig, setLocationConfig, locationName,
            selectedActivity, setSelectedActivity
        }}>
            {children}
        </WeatherContext.Provider>
    );
};
