import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const themes = {
    day: {
        name: 'day',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        cardBg: '#F1F5F9',
        glass: 'rgba(255, 255, 255, 0.7)', // Heavy frost
        glassBorder: 'rgba(255, 255, 255, 0.5)',
        text: '#000000',
        textSecondary: 'rgba(0, 0, 0, 0.6)',
        accent: '#6200EE',
        success: 'rgba(76, 175, 80, 0.1)',
        danger: 'rgba(244, 67, 54, 0.1)',
        statusBar: 'dark',
        tabBar: '#FFFFFF',
        tabInactive: 'rgba(0, 0, 0, 0.4)',
        gradient: ['#FFFFFF', '#F8FAFC', '#F1F5F9'],
    },
    dark: {
        name: 'dark',
        background: '#000000',
        surface: '#000000',
        cardBg: '#121212',
        glass: 'rgba(30, 30, 30, 0.6)', // Dark frost
        glassBorder: 'rgba(255, 255, 255, 0.1)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255, 255, 255, 0.7)',
        accent: '#BB86FC',
        success: 'rgba(129, 199, 132, 0.2)',
        danger: 'rgba(229, 115, 115, 0.2)',
        statusBar: 'light',
        tabBar: '#000000',
        tabInactive: 'rgba(255, 255, 255, 0.4)',
        gradient: ['#000000', '#000000', '#000000'],
    },
    oled: {
        name: 'oled',
        background: '#000000',
        surface: '#000000',
        cardBg: '#000000',
        glass: '#000000', // No transparency for OLED
        glassBorder: '#1F1F1F', // Subtle border
        text: '#FFFFFF',
        textSecondary: '#A0A0A0',
        accent: '#BB86FC',
        success: '#4CAF50', // Solid colors preferred over rgba for OLED punch
        danger: '#F44336',
        statusBar: 'light',
        tabBar: '#000000',
        tabInactive: '#666666',
        gradient: ['#000000', '#000000', '#000000'],
    }
};

export const getWeatherGradient = (icon, isDay = true) => {
    // Default gradients
    const defaults = isDay
        ? ['#4facfe', '#00f2fe'] // Sunny Day (Blue/Cyan)
        : ['#0f2027', '#203a43', '#2c5364']; // Clear Night (Deep Blue)

    if (!icon) return defaults;

    const map = {
        'clear-day': ['#2980B9', '#6DD5FA', '#FFFFFF'], // Bright
        'clear-night': ['#0f2027', '#203a43', '#2c5364'], // Deep Night
        'rain': ['#373B44', '#4286f4'], // Moody Blue/Grey
        'snow': ['#E6DADA', '#274046'], // Cold White/Blue
        'sleet': ['#E6DADA', '#274046'],
        'wind': ['#485563', '#29323c'], // Windy Grey
        'fog': ['#3e5151', '#decba4'], // Misty
        'cloudy': ['#bdc3c7', '#2c3e50'], // Grey
        'partly-cloudy-day': ['#56CCF2', '#2F80ED'],
        'partly-cloudy-night': ['#232526', '#414345'],
    };

    return map[icon] || defaults;
};

export const ThemeProvider = ({ children }) => {
    // Reactive hook for system theme
    const systemColorScheme = useColorScheme();
    const [mode, setMode] = useState('system'); // 'day', 'dark', 'system'
    const [useOled, setUseOled] = useState(false);

    useEffect(() => {
        loadMode();
    }, []);

    const loadMode = async () => {
        try {
            const savedMode = await AsyncStorage.getItem('app_theme_mode');
            const savedOled = await AsyncStorage.getItem('app_theme_oled');

            if (savedMode) setMode(savedMode === 'oled' ? 'dark' : savedMode); // Migrate old 'oled' to 'dark'
            if (savedOled) setUseOled(savedOled === 'true');
        } catch (e) {
            console.error('Theme load error:', e);
        }
    };

    const updateMode = async (newMode) => {
        setMode(newMode);
        await AsyncStorage.setItem('app_theme_mode', newMode);
    };

    const toggleOled = async (val) => {
        setUseOled(val);
        await AsyncStorage.setItem('app_theme_oled', val.toString());
    };

    // Logic: Map system value or manual selection to actual theme object
    const getActiveTheme = () => {
        let targetDetail = 'light';

        if (mode === 'system') {
            targetDetail = systemColorScheme || 'light';
        } else {
            targetDetail = mode; // 'day' or 'dark'
        }

        if (targetDetail === 'day' || targetDetail === 'light') return themes.day;

        // It is dark, check for OLED preference
        return useOled ? themes.oled : themes.dark;
    };

    const theme = getActiveTheme();

    return (
        <ThemeContext.Provider value={{ theme, mode, setMode: updateMode, useOled, toggleOled }}>
            {children}
        </ThemeContext.Provider>
    );
};
