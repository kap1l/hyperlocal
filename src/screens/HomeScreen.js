import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, RefreshControl, View, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import WeatherBackground from '../components/WeatherBackground';
import WeatherCard from '../components/WeatherCard';
import RainChart from '../components/RainChart';
import FeaturedActivityBadge from '../components/FeaturedActivityBadge';
import ExtendedActivityCard from '../components/ExtendedActivityCard';
import ActivityHub from '../components/ActivityHub';
import OutdoorComfortCard from '../components/OutdoorComfortCard';
import ActivityTimeline from '../components/ActivityTimeline';
import DailyOutlookCard from '../components/DailyOutlookCard';
import MinuteTextBanner from '../components/MinuteTextBanner';
import CitySearchModal from '../components/CitySearchModal';
import BestTimeModal from '../components/BestTimeModal';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../context/ThemeContext';
import { analyzeActivitySafety } from '../utils/weatherSafety';

const HomeScreen = ({ navigation }) => {
    const { weather, loading, error, refreshWeather, apiKey, locationName, setLocationConfig } = useWeather();
    const { theme } = useTheme();
    const { selectedActivity, units } = useWeather();
    const [prevLoading, setPrevLoading] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [bestTimeVisible, setBestTimeVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    // Calculate detailed activity scores
    const activityAnalysis = React.useMemo(() => {
        return analyzeActivitySafety(weather ? selectedActivity || 'walk' : 'walk', weather?.currently, units);
    }, [weather, selectedActivity, units]);

    // Snazzy entry animation for location
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, [locationName]);

    // Haptic feedback for pull-to-refresh completion
    useEffect(() => {
        if (prevLoading && !loading) {
            if (error) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
        setPrevLoading(loading);
    }, [loading]);

    if (!apiKey) {
        return (
            <WeatherBackground condition="partly-cloudy-day">
                <View style={styles.center}>
                    <Text style={styles.text}>Please configure API Key in Settings.</Text>
                </View>
            </WeatherBackground>
        )
    }

    return (
        <WeatherBackground condition={weather?.currently?.icon}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            refreshWeather();
                        }}
                        tintColor={theme.accent}
                    />
                }
            >
                <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                    <View style={styles.locationWrapper}>
                        <View style={[styles.pulseCircle, { backgroundColor: theme.accent }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                                {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
                            </Text>
                            <TouchableOpacity style={styles.locationBtn} activeOpacity={0.7} onPress={() => setSearchVisible(true)}>
                                <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                                    {locationName || 'Current Location'}
                                </Text>
                                <Ionicons name="search-circle" size={24} color={theme.accent} style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>

                {error && <Text style={styles.error}>{error}</Text>}
                {weather && (
                    <>
                        <ExtendedActivityCard
                            currently={weather.currently}
                            analysis={activityAnalysis}
                            onFindBestTime={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setBestTimeVisible(true);
                            }}
                        />
                        <ActivityHub
                            minutelyData={weather.minutely?.data}
                            currently={weather.currently}
                        />
                        <MinuteTextBanner minutelyData={weather.minutely?.data} />
                        <WeatherCard
                            currently={weather.currently}
                            dailyData={weather.daily?.data}
                        />
                        <OutdoorComfortCard currently={weather.currently} />
                        <OutdoorComfortCard currently={weather.currently} />
                        <ActivityTimeline
                            hourlyData={weather.hourly?.data}
                            currently={weather.currently}
                            currentAnalysis={activityAnalysis}
                        />
                        <DailyOutlookCard dailyData={weather.daily?.data} />
                        <DailyOutlookCard dailyData={weather.daily?.data} />
                        <RainChart minutelyData={weather.minutely?.data} currently={weather.currently} />
                    </>
                )}
            </ScrollView>

            <CitySearchModal
                visible={searchVisible}
                onClose={() => setSearchVisible(false)}
                onSelect={(item) => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setLocationConfig({
                        mode: 'manual',
                        coords: { latitude: item.latitude, longitude: item.longitude },
                        label: item.name
                    });
                }}
            />

            <BestTimeModal
                visible={bestTimeVisible}
                onClose={() => setBestTimeVisible(false)}
                hourlyData={weather?.hourly?.data}
                activityId={selectedActivity || 'walk'}
                units={units}
            />
        </WeatherBackground>
    );
};

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: 40,
    },
    header: {
        paddingTop: 65,
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    locationWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    pulseCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowColor: '#fff',
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 5,
    },
    greeting: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    locationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    chevron: {
        marginLeft: 8,
        marginTop: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 18,
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
    }
});

export default HomeScreen;
