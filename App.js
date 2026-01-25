import React, { useEffect, Component } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

import { WeatherProvider } from './src/context/WeatherContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { registerBackgroundWeatherTask } from './src/services/BackgroundWeatherTask';

// Configure how notifications should behave when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Something went wrong</Text>
                    <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'red',
    },
    errorText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
});

const AppContent = () => {
    useEffect(() => {
        async function setupMobile() {
            if (Platform.OS === 'web') return;

            // 1. Android Notification Channel (Required for Android 8.0+)
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('weather-alerts', {
                    name: 'Weather Alerts',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#BB86FC',
                });
            }

            // 2. Request Permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            // 3. Location Permissions
            const { status: foreStatus } = await Location.requestForegroundPermissionsAsync();
            if (foreStatus === 'granted') {
                // Background location is needed for the 15-min background check
                await Location.requestBackgroundPermissionsAsync();
            }

            // 4. Register Background Task if permitted
            if (finalStatus === 'granted') {
                await registerBackgroundWeatherTask();
                console.log("Mobile background task registration attempted");
            }
        }

        setupMobile();
    }, []);

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <WeatherProvider>
                    <NavigationContainer>
                        <AppNavigator />
                    </NavigationContainer>
                </WeatherProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
};

const App = () => {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
};

export default App;
