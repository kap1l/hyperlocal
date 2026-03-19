import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, RefreshControl, View, TouchableOpacity, Animated, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
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
import SpotChips from '../components/SpotChips';
import WeeklyForecastCard from '../components/WeeklyForecastCard';
import StreakBadge from '../components/StreakBadge';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';
import SmartSummaryCard from '../components/SmartSummaryCard';
import AirQualityCard from '../components/AirQualityCard';
import GoldenHourCard from '../components/GoldenHourCard';
import OfflineBanner from '../components/OfflineBanner';
import WeatherWarningBanner from '../components/WeatherWarningBanner';
import BannerAdComponent from '../components/BannerAdComponent';
import OnboardingOverlay from '../components/OnboardingOverlay';
import CollapsibleSection from '../components/CollapsibleSection';
import MoonPhaseCard from '../components/MoonPhaseCard';
import PollenCard from '../components/PollenCard';
import ShareCard from '../components/ShareCard';
import WatchlistCard from '../components/WatchlistCard';
import LogSessionCard from '../components/LogSessionCard';
import WeeklyReportCard from '../components/WeeklyReportCard';
import ComparisonCard from '../components/ComparisonCard';
import StravaInsightCard from '../components/StravaInsightCard';
import HealthInsightCard from '../components/HealthInsightCard';
import { analyzeActivitySafety, getSeverityOverride } from '../utils/weatherSafety';
import { getCardOrder, DEFAULT_ORDER } from '../services/CardOrderService';
import { getStreak } from '../services/StreakService';
import { addLog, getWeeklySummary } from '../services/ActivityLogService';
import WeeklyLogSummary from '../components/WeeklyLogSummary';
import ConditionComparisonCard from '../components/ConditionComparisonCard';
import GoalProgressCard from '../components/GoalProgressCard';
import ForecastConfidenceChip from '../components/ForecastConfidenceChip';
import { useIsFocused } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
    const { weather, loading, error, refreshWeather, apiKey, locationName, setLocationConfig, isOffline, lastUpdated, weatherWarnings, forecastConfidence } = useWeather();
    const { theme } = useTheme();
    const { selectedActivity, units, addSpot } = useWeather();
    const { isPro, isTrialing, trialDaysLeft, purchasePro } = useSubscription(); // Now uses the safe mock context
    const [prevLoading, setPrevLoading] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchAction, setSearchAction] = useState('view');
    const [bestTimeVisible, setBestTimeVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [trialBannerDismissed, setTrialBannerDismissed] = useState(true);
    const [cardOrder, setCardOrder] = useState(DEFAULT_ORDER);
    const [streak, setStreak] = useState({ count: 0, lastActiveDate: null });
    const [weeklySummary, setWeeklySummary] = useState(null);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            getCardOrder().then(setCardOrder);
            getStreak().then(setStreak);
            getWeeklySummary().then(setWeeklySummary);
        }
    }, [isFocused]);

    // Calculate detailed activity scores
    const activityAnalysis = React.useMemo(() => {
        return analyzeActivitySafety(weather ? selectedActivity || 'walk' : 'walk', weather?.currently, units);
    }, [weather, selectedActivity, units]);

    // Calculate severity for background visualization (e.g. "heavy snow")
    const severityOverride = weather?.currently ? getSeverityOverride(weather.currently, units === 'si') : null;
    const backgroundCondition = severityOverride ? severityOverride.toLowerCase() : weather?.currently?.icon;

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
                triggerStoreReviewIfNeeded();
            }
        }
        setPrevLoading(loading);
    }, [loading]);

    const triggerStoreReviewIfNeeded = async () => {
        try {
            const hasPrompted = await AsyncStorage.getItem('@rating_prompted_1.1.0');
            if (hasPrompted === 'true') return;

            const countStr = await AsyncStorage.getItem('@app_open_count');
            let count = countStr ? parseInt(countStr, 10) : 0;
            count += 1;
            
            await AsyncStorage.setItem('@app_open_count', count.toString());

            if (count === 3) {
                if (await StoreReview.isAvailableAsync()) {
                    await StoreReview.requestReview();
                    await AsyncStorage.setItem('@rating_prompted_1.1.0', 'true');
                }
            }
        } catch (e) {
            console.log('Error triggering store review:', e);
        }
    };

    // Check if trial banner was dismissed previously
    useEffect(() => {
        const checkTrialBanner = async () => {
            try {
                const dismissed = await AsyncStorage.getItem('@trial_banner_dismissed_1.1.0');
                if (dismissed !== 'true') {
                    setTrialBannerDismissed(false);
                }
            } catch (e) {
                // Ignore error
            }
        };
        if (isTrialing) {
            checkTrialBanner();
        }
    }, [isTrialing]);

    const dismissTrialBanner = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTrialBannerDismissed(true);
        try {
            await AsyncStorage.setItem('@trial_banner_dismissed_1.1.0', 'true');
        } catch (e) {
            // Ignore error
        }
    };

    return (
        <WeatherBackground condition={backgroundCondition}>
            <OnboardingOverlay />
            <WeatherWarningBanner warnings={weatherWarnings} />
            <OfflineBanner isOffline={isOffline} lastUpdated={lastUpdated} />
            
            {isTrialing && !trialBannerDismissed && (
                <View style={[styles.trialBanner, { backgroundColor: theme.accent }]}>
                    <Text style={styles.trialText}>Free trial — {trialDaysLeft} days left</Text>
                    <View style={styles.trialActions}>
                        <TouchableOpacity style={styles.trialBtn} onPress={purchasePro}>
                            <Text style={[styles.trialBtnText, { color: theme.accent }]}>Subscribe</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={dismissTrialBanner} style={styles.trialCloseBtn}>
                            <Ionicons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <ScrollView
                contentContainerStyle={[styles.scroll, (isTrialing && !trialBannerDismissed) ? { paddingTop: 0 } : {}]}
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
                        <View style={styles.locationInfo}>
                            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                                {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
                            </Text>
                            <TouchableOpacity
                                style={styles.locationBtn}
                                activeOpacity={0.7}
                                onPress={() => {
                                    if (!isPro) {
                                        Alert.alert(
                                            "Travel Mode 🌍",
                                            "Search for weather in other cities with OutWeather+! Free users get GPS-based local weather.",
                                            [
                                                { text: "Stay Local", style: "cancel" },
                                                { text: "Unlock ($1.99/mo)", onPress: purchasePro }
                                            ]
                                        );
                                        return;
                                    }
                                    setSearchAction('view');
                                    setSearchVisible(true);
                                }}
                            >
                                <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                                    {locationName || 'Current Location'}
                                </Text>
                                    {isPro ? (
                                        <Ionicons name="search-circle" size={24} color={theme.accent} style={styles.searchIcon} />
                                    ) : (
                                        <Ionicons name="location" size={20} color={theme.accent} style={styles.searchIcon} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            <StreakBadge streak={streak} />
                        </View>
                    </Animated.View>

                <SpotChips onAddPress={() => {
                    if (!isPro) {
                        Alert.alert("Premium Feature 🔒", "Search for weather in other cities with OutWeather+! Free users get GPS-based local weather.", [
                            { text: "Stay Local", style: "cancel" },
                            { text: "Unlock ($1.99/mo)", onPress: purchasePro }
                        ]);
                        return;
                    }
                    setSearchAction('save');
                    setSearchVisible(true);
                }} />

                {error && <Text style={styles.error}>{error}</Text>}
                {weather && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <WeatherCard
                            currently={weather.currently}
                            dailyData={weather.daily?.data}
                        />
                        
                        <ForecastConfidenceChip confidence={forecastConfidence} />

                        <ShareCard>
                            <ExtendedActivityCard
                                currently={weather.currently}
                                analysis={activityAnalysis}
                                onFindBestTime={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setBestTimeVisible(true);
                                }}
                            />
                        </ShareCard>
                        
                        <TouchableOpacity 
                            style={[
                                styles.logButton, 
                                { backgroundColor: activityAnalysis.safetyScore >= 70 ? theme.accent : theme.textSecondary }
                            ]}
                            onPress={async () => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                await addLog({
                                    id: Date.now().toString(),
                                    timestamp: Date.now(),
                                    activity: selectedActivity || 'walk',
                                    score: activityAnalysis.safetyScore,
                                    conditions: weather.currently.icon,
                                    temperature: weather.currently.temperature
                                });
                                Alert.alert("Session Logged!", `Your ${selectedActivity || 'walk'} session has been logged in Activity History.`);
                                getWeeklySummary().then(setWeeklySummary);
                            }}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="#fff" />
                            <Text style={styles.logButtonText}>Log this session</Text>
                        </TouchableOpacity>
                        
                        <WatchlistCard />
                        <ComparisonCard />
                        <WeeklyReportCard />
                        <StravaInsightCard />
                        {Platform.OS === 'android' && <HealthInsightCard />}
                        <LogSessionCard />
                        <WeeklyLogSummary summary={weeklySummary} />
                        <GoalProgressCard dailyData={weather?.daily?.data} units={units} />
                        
                        <TouchableOpacity  
                            style={{ alignSelf: 'center', marginBottom: 20 }}
                            onPress={() => navigation.navigate('Watchlist')}
                        >
                            <Text style={{ color: theme.accent, fontWeight: 'bold' }}>Set Condition Alert +</Text>
                        </TouchableOpacity>

                        {cardOrder.map(id => {
                            switch (id) {
                                case 'smart-summary':
                                    return (
                                        <View key={id}>
                                            <SmartSummaryCard weather={weather} activity={selectedActivity} />
                                            <ConditionComparisonCard 
                                                currentScore={activityAnalysis?.safetyScore} 
                                                currentTemp={weather?.currently?.temperature} 
                                                currentConditions={weather?.currently?.summary} 
                                            />
                                        </View>
                                    );
                                case 'activity-hub':
                                    return (
                                        <CollapsibleSection key={id} title="Activity Overview" icon="fitness-outline" sectionId="activity-hub" accentColor="#22c55e">
                                            <ActivityHub minutelyData={weather.minutely?.data} currently={weather.currently} />
                                        </CollapsibleSection>
                                    );
                                case 'minute-banner':
                                    return (
                                        <CollapsibleSection key={id} title="Minute-by-Minute" icon="timer-outline" sectionId="minute-banner" accentColor="#3b82f6">
                                            <MinuteTextBanner minutelyData={weather.minutely?.data} />
                                        </CollapsibleSection>
                                    );
                                case 'outdoor-comfort':
                                    return (
                                        <CollapsibleSection key={id} title="Outdoor Comfort" icon="thermometer-outline" sectionId="comfort" accentColor="#f59e0b">
                                            <OutdoorComfortCard currently={weather.currently} />
                                        </CollapsibleSection>
                                    );
                                case 'aqi':
                                    return (
                                        <CollapsibleSection key={id} title="Air Quality" icon="leaf-outline" sectionId="aqi" accentColor="#22c55e">
                                            <AirQualityCard />
                                        </CollapsibleSection>
                                    );
                                case 'golden-hour':
                                    return (
                                        <CollapsibleSection key={id} title="Golden Hour" icon="sunny-outline" sectionId="golden-hour" accentColor="#f59e0b">
                                            <GoldenHourCard />
                                        </CollapsibleSection>
                                    );
                                case 'moon-phase':
                                    return (
                                        <CollapsibleSection key={id} title="Moon & Stargazing" icon="moon-outline" sectionId="moon-phase" accentColor="#8b5cf6">
                                            <MoonPhaseCard />
                                        </CollapsibleSection>
                                    );
                                case 'pollen':
                                    return (
                                        <CollapsibleSection key={id} title="Pollen Index (Est.)" icon="flower-outline" sectionId="pollen" accentColor="#ec4899">
                                            <PollenCard />
                                        </CollapsibleSection>
                                    );
                                case 'timeline':
                                    return (
                                        <CollapsibleSection key={id} title="Hourly Timeline" icon="time-outline" sectionId="timeline" accentColor="#8b5cf6">
                                            <ActivityTimeline hourlyData={weather.hourly?.data} currently={weather.currently} currentAnalysis={activityAnalysis} />
                                        </CollapsibleSection>
                                    );
                                case 'daily':
                                    return (
                                        <CollapsibleSection key={id} title="7-Day" icon="calendar-outline" sectionId="daily" accentColor="#ec4899">
                                            <DailyOutlookCard dailyData={weather.daily?.data} />
                                        </CollapsibleSection>
                                    );
                                case 'weekly-forecast':
                                    return <WeeklyForecastCard key={id} dailyData={weather.daily?.data} activity={selectedActivity} units={units} />;
                                case 'rain-chart':
                                    return (
                                        <CollapsibleSection key={id} title="Rain Forecast" icon="rainy-outline" sectionId="rain-chart" accentColor="#3b82f6">
                                            <RainChart minutelyData={weather.minutely?.data} currently={weather.currently} />
                                        </CollapsibleSection>
                                    );
                                default:
                                    return null;
                            }
                        })}

                        <BannerAdComponent />
                    </Animated.View>
                )}
            </ScrollView>

            <CitySearchModal
                visible={searchVisible}
                onClose={() => setSearchVisible(false)}
                onSelect={(item) => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (searchAction === 'save') {
                        addSpot({ id: Date.now().toString(), name: item.name, lat: item.latitude, lon: item.longitude, activity: selectedActivity });
                    }
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
    locationInfo: {
        flex: 1,
    },
    locationTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchIcon: {
        marginLeft: 6,
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
    },
    trialBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    trialText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    trialActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    trialBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    trialBtnText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    trialCloseBtn: {
        padding: 4,
    },
    logButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    logButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default HomeScreen;
