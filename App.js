import React, { useEffect, Component } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

import { WeatherProvider } from './src/context/WeatherContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/NavigationService';
import { logAppOpenForReview } from './src/services/AppReviewService';
import { scheduleWeeklyReportNotification } from './src/services/NotificationService';
import { initTrial } from './src/services/TrialService';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN_HERE', // TODO: replace with your real Sentry DSN
  debug: false,
});

const isExpoGo = Constants.appOwnership === 'expo';

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
        Sentry.captureException(error);
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
            if (isExpoGo) console.log('Running in Expo Go');

            const { status: foreStatus } = await Location.requestForegroundPermissionsAsync();
            if (foreStatus === 'granted') {
                await Location.requestBackgroundPermissionsAsync();
            }
            
            // Trigger app review logic
            logAppOpenForReview();
            
            // Setup weekly report push notification schedule
            await scheduleWeeklyReportNotification();
        }
        setupMobile();
    }, []);

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <SubscriptionProvider>
                    <WeatherProvider>
                        <NavigationContainer ref={navigationRef}>
                            <AppNavigator />
                        </NavigationContainer>
                    </WeatherProvider>
                </SubscriptionProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
};

const App = () => {
    const [isTrialReady, setIsTrialReady] = React.useState(false);

    React.useEffect(() => {
        const setupTrial = async () => {
            await initTrial();
            setIsTrialReady(true);
        };
        setupTrial();
    }, []);

    if (!isTrialReady) {
        return null;
    }

    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
};

export default Sentry.wrap(App);
