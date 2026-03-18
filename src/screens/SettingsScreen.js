import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Switch, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../context/ThemeContext';
import { Barometer } from 'expo-sensors';
import { checkWeatherAndNotify, registerBackgroundWeatherTask } from '../services/BackgroundWeatherTask';
import { geocodeAddress } from '../services/LocationService';
import CitySearchModal from '../components/CitySearchModal';
import GlassDropdown from '../components/GlassDropdown';
import { useSubscription } from '../context/SubscriptionContext';
import * as Sentry from '@sentry/react-native';

const SettingsScreen = ({ navigation }) => {
    const {
        apiKey, setApiKey,
        units, setUnits,
        locationConfig, setLocationConfig,
        selectedActivity, setSelectedActivity,
        weather, // Needed for live safety check
        savedSpots, removeSpot
    } = useWeather();
    const { theme, mode, setMode, useOled, toggleOled } = useTheme();
    const { isPro, purchasePro, restorePurchases } = useSubscription(); // Now uses the safe mock context

    const [barometerEnabled, setBarometerEnabled] = useState(false);
    const [alertsEnabled, setAlertsEnabled] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [locationInput, setLocationInput] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);

    useEffect(() => {
        loadAlertsState();
    }, []);

    const loadAlertsState = async () => {
        const saved = await AsyncStorage.getItem('@alerts_enabled');
        setAlertsEnabled(saved !== 'false');
    };

    const toggleAlerts = async (val) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAlertsEnabled(val);
        await AsyncStorage.setItem('@alerts_enabled', val.toString());
        if (val) await registerBackgroundWeatherTask();
    };

    const runTestNotify = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsTesting(true);
        try {
            // Request notification permissions first
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable notifications in your phone settings to receive weather alerts.');
                setIsTesting(false);
                return;
            }

            await checkWeatherAndNotify(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success!', 'Test notification sent! Check your notification shade.');
        } catch (error) {
        Sentry.captureException(error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Notification Failed', error.message);
        } finally {
            setIsTesting(false);
        }
    };



    const handleSearchLocation = async () => {
        if (!locationInput.trim()) return;
        setIsGeocoding(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            // geocodeAddress returns an array of matches — take the best (first) result
            const results = await geocodeAddress(locationInput);
            const best = results[0];
            if (!best) throw new Error('No results found');
            setLocationConfig({
                mode: 'manual',
                coords: { latitude: best.latitude, longitude: best.longitude },
                label: best.name
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Location Found", `Weather will now be shown for ${best.name}`);
        } catch (e) {
        Sentry.captureException(e);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Could not find that location.");
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleUpdateActivity = (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedActivity(id);
    };

    const activities = [
        { id: 'walk', label: 'Walking', icon: 'walk-outline', locked: false },
        { id: 'run', label: 'Running', icon: 'speedometer-outline', locked: false },
        { id: 'drive', label: 'Driving', icon: 'car-outline', locked: false },
        // Premium Activities
        { id: 'cycle', label: 'Cycling', icon: 'bicycle-outline', locked: false },
        { id: 'camera', label: 'Photo/Film', icon: 'camera-outline', locked: !isPro },
        { id: 'hike', label: 'Hiking', icon: 'trail-sign-outline', locked: !isPro },
        { id: 'tennis', label: 'Tennis', icon: 'tennisball-outline', locked: !isPro },
        { id: 'golf', label: 'Golf', icon: 'golf-outline', locked: !isPro },
        { id: 'yoga', label: 'Outdoor Yoga', icon: 'body-outline', locked: !isPro },
        { id: 'fishing', label: 'Fishing', icon: 'fish-outline', locked: !isPro },
        { id: 'stargaze', label: 'Stargazing', icon: 'star-outline', locked: !isPro },
    ];

    const handleWipeData = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Clear All Data?",
            "This will reset your location history, activity preferences, and cached weather. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Everything",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            // Note: We do NOT clear SecureStore to preserve the API Key
                            // since the user can no longer manually enter it.

                            setLocationConfig({ mode: 'auto' });
                            setUnits('us');
                            setMode('system');
                            setSelectedActivity('walk');

                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert("Data Cleared", "The app has been reset to factory defaults.");
                        } catch (e) {
        Sentry.captureException(e);
                            Alert.alert("Error", "Failed to clear data: " + e.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <GradientBackground>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={[styles.header, { color: theme.text, marginBottom: 0 }]}>Settings</Text>
                    {!isPro && (
                        <TouchableOpacity onPress={purchasePro} style={{ backgroundColor: theme.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>GO PRO</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Activity Selection */}
                <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                    <GlassDropdown
                        label="My Primary Activity"
                        value={selectedActivity}
                        onSelect={(id) => {
                            const act = activities.find(a => a.id === id);
                            if (act?.locked) {
                                Alert.alert(
                                    "Premium Feature 🔒",
                                    "Try OutWeather+ free for 30 days — unlock all activities, remove ads, and search any city.",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Start Free Trial", onPress: purchasePro }
                                    ]
                                );
                                return;
                            }
                            handleUpdateActivity(id);
                        }}
                        options={activities.map(a => ({
                            ...a,
                            label: a.locked ? `${a.label} 🔒` : a.label,
                            value: a.id
                        }))}
                    />

                    {/* Live Preview */}
                    {weather?.currently && (
                        <View style={{ marginTop: 10, padding: 12, backgroundColor: theme.accent + '15', borderRadius: 12 }}>
                            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>CURRENT FORECAST</Text>
                            <Text style={{ fontSize: 14, color: theme.text, fontWeight: '700' }}>
                                {require('../utils/weatherSafety').analyzeActivitySafety(selectedActivity, weather.currently, units)?.advice || 'Loading...'}
                            </Text>
                        </View>
                    )}
                </View>


                {/* Data Source — hidden Advanced toggle for power users */}
                <TouchableOpacity
                    style={[styles.section, { backgroundColor: theme.cardBg }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowAdvanced(v => !v);
                    }}
                    activeOpacity={0.8}
                >
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 4 }]}>Advanced Options</Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                                {apiKey ? 'Custom PirateWeather key active' : 'Using Open-Meteo (default, no key needed)'}
                            </Text>
                        </View>
                        <Ionicons
                            name={showAdvanced ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={theme.textSecondary}
                        />
                    </View>

                    {showAdvanced && (
                        <View style={{ marginTop: 16 }}>
                            <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginBottom: 6 }}>
                                Optional: Override with your own PirateWeather key
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 10 }}>
                                Leave blank to use the default Open-Meteo data source (free, no sign-up).
                                Supply your own PirateWeather key for per-minute precipitation data.
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: theme.background,
                                        color: theme.text,
                                        borderColor: theme.glassBorder,
                                        borderWidth: 1,
                                        flex: 1,
                                        marginBottom: 0,
                                    }]}
                                    placeholder="PirateWeather API Key (optional)"
                                    placeholderTextColor={theme.textSecondary}
                                    value={apiKey || ''}
                                    onChangeText={setApiKey}
                                    autoCapitalize="none"
                                    secureTextEntry
                                />
                                {apiKey ? (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#ef4444',
                                            justifyContent: 'center',
                                            paddingHorizontal: 14,
                                            borderRadius: 8,
                                            height: 45,
                                        }}
                                        onPress={() => {
                                            Alert.alert(
                                                'Remove Custom Key?',
                                                'The app will switch back to the default Open-Meteo source.',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { text: 'Remove', style: 'destructive', onPress: () => setApiKey(null) }
                                                ]
                                            );
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#fff" />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                            <TouchableOpacity
                                onPress={() => Linking.openURL('https://pirateweather.net/en/latest/API/')}
                                style={{ alignSelf: 'flex-start', marginTop: 8 }}
                            >
                                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}>
                                    Get a free key from PirateWeather.net ↗
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Location Settings */}
                <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Location Mode</Text>
                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={[styles.tab, locationConfig.mode === 'auto' && { backgroundColor: theme.accent }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLocationConfig({ mode: 'auto' });
                            }}
                        >
                            <Text style={[styles.tabText, { color: locationConfig.mode === 'auto' ? '#fff' : theme.textSecondary }]}>Auto (GPS)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                locationConfig.mode === 'manual' && { backgroundColor: theme.accent },
                                !isPro && { opacity: 0.5 }
                            ]}
                            onPress={() => {
                                if (!isPro) {
                                    Alert.alert(
                                        "Travel Mode Locked 🔒",
                                        "Try OutWeather+ free for 30 days — unlock all activities, remove ads, and search any city.",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Start Free Trial", onPress: purchasePro }
                                        ]
                                    );
                                    return;
                                }
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLocationConfig({ ...locationConfig, mode: 'manual' });
                            }}
                        >
                            <Text style={[styles.tabText, { color: locationConfig.mode === 'manual' ? '#fff' : theme.textSecondary }]}>
                                {isPro ? 'Manual Search' : 'Manual (Pro 🔒)'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {locationConfig.mode === 'manual' && (
                        <View style={styles.manualEntry}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: theme.accent, marginTop: 10 }]}
                                onPress={() => setSearchVisible(true)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="search" size={18} color={theme.name === 'day' ? '#fff' : '#000'} />
                                    <Text style={[styles.buttonText, { color: theme.name === 'day' ? '#fff' : '#000' }]}>
                                        Search City
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {locationConfig.label && (
                                <Text style={[styles.currentLocLabel, { color: theme.accent }]}>
                                    Selected: {locationConfig.label}
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Home Screen Layout */}
                <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Layout</Text>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.text + '20', flexDirection: 'row', justifyContent: 'space-between' }]}
                        onPress={() => {
                            if (!isPro) {
                                Alert.alert(
                                    "Custom Layout Locked 🔒",
                                    "Try OutWeather+ free for 30 days to unlock customising your home screen.",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Start Free Trial", onPress: purchasePro }
                                    ]
                                );
                            } else {
                                navigation.navigate('CardOrder');
                            }
                        }}
                    >
                        <Text style={[styles.buttonText, { color: theme.text }]}>Customise Home Screen Layout</Text>
                        {!isPro && <Ionicons name="lock-closed" size={16} color={theme.accent} />}
                    </TouchableOpacity>
                </View>

                {/* Saved Locations */}
                {savedSpots?.length > 0 && (
                    <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Saved Locations</Text>
                        {savedSpots.map((spot, index) => (
                            <View 
                                key={spot.id} 
                                style={[
                                    styles.row, 
                                    { paddingVertical: 12 },
                                    index < savedSpots.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.glassBorder }
                                ]}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, color: theme.text, fontWeight: '600' }}>{spot.name}</Text>
                                </View>
                                <TouchableOpacity
                                    style={{ padding: 8 }}
                                    onPress={() => {
                                        Alert.alert("Remove Spot?", `Are you sure you want to remove ${spot.name}?`, [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Remove", style: 'destructive', onPress: () => {
                                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                                removeSpot(spot.id);
                                            }}
                                        ]);
                                    }}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Unit Conversions */}
                <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Measurement Units</Text>
                    <View style={styles.themeRow}>
                        {[
                            { label: 'Standard (US/F)', value: 'us' },
                            { label: 'Metric (SI/C)', value: 'si' },
                            { label: 'UK (Hybrid)', value: 'uk2' }
                        ].map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.themeButton,
                                    { backgroundColor: units === opt.value ? theme.accent : 'transparent', borderColor: theme.accent },
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setUnits(opt.value);
                                }}
                            >
                                <Text style={[
                                    styles.themeButtonText,
                                    { color: units === opt.value ? '#fff' : theme.text }
                                ]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Theme Section */}
                <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>App Theme</Text>
                    <View style={styles.themeRow}>
                        {[
                            { label: 'Day', value: 'day', color: '#FFFFFF', border: '#E2E8F0' },
                            { label: 'Dark', value: 'dark', color: '#000000', border: '#1E1E1E' },
                            { label: 'System', value: 'system', color: '#64748B', border: '#475569' }
                        ].map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.themeButton,
                                    { backgroundColor: opt.color, borderColor: opt.border },
                                    mode === opt.value && { borderColor: theme.accent, borderWidth: 2 }
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setMode(opt.value);
                                }}
                            >
                                <Text style={[
                                    styles.themeButtonText,
                                    { color: (opt.value === 'day') ? '#000' : '#fff' }
                                ]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* OLED Toggle - Only relevant if dark mode is possible */}
                    <View style={[styles.row, { marginTop: 20 }]}>
                        <View>
                            <Text style={[styles.label, { marginBottom: 4, color: theme.text }]}>True Black Mode</Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>Save battery on OLED screens</Text>
                        </View>
                        <Switch
                            value={useOled}
                            onValueChange={(val) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                toggleOled(val);
                            }}
                            trackColor={{ false: "#767577", true: theme.accent }}
                            thumbColor={useOled ? "#fff" : "#f4f3f4"}
                        />
                    </View>
                </View>

                {/* Mobile Alerts Section */}
                <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                    <View style={styles.row}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Local Rain Alerts</Text>
                        <Switch
                            value={alertsEnabled}
                            onValueChange={toggleAlerts}
                            trackColor={{ false: "#767577", true: theme.accent }}
                            thumbColor={alertsEnabled ? theme.accent : "#f4f3f4"}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.testButton, { borderColor: theme.accent }]}
                        onPress={runTestNotify}
                        disabled={isTesting}
                    >
                        {isTesting ? (
                            <ActivityIndicator size="small" color={theme.accent} />
                        ) : (
                            <Text style={[styles.testButtonText, { color: theme.accent }]}>Send Test Notification</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Version</Text>
                    <Text style={[styles.info, { color: theme.textSecondary }]}>OutWeather Local v1.5.0 (Activity Core)</Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.text + '20', marginTop: 20 }]}
                        onPress={async () => {
                            await AsyncStorage.removeItem('@onboarding_complete');
                            Alert.alert('Done', 'Onboarding tutorial will be shown on next Home Screen load.');
                        }}
                    >
                        <Text style={[styles.buttonText, { color: theme.text }]}>Reset Onboarding Tutorial</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#EF4444', marginTop: 20 }]}
                        onPress={handleWipeData}
                    >
                        <Text style={[styles.buttonText, { color: '#fff' }]}>Delete All App Data</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <CitySearchModal
                visible={searchVisible}
                onClose={() => setSearchVisible(false)}
                onSelect={(item) => {
                    setLocationConfig({
                        mode: 'manual',
                        coords: { latitude: item.latitude, longitude: item.longitude },
                        label: item.name
                    });
                    Alert.alert("Location Updated", `Set to ${item.name}`);
                }}
            />
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 100,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    section: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 15,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    button: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: 'bold',
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
        padding: 4,
        marginBottom: 15,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    tabText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    manualEntry: {
        marginTop: 5,
    },
    currentLocLabel: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    testButton: {
        marginTop: 15,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 45,
    },
    testButtonText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    info: {
        fontSize: 14,
        marginTop: 4,
    },
    themeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    themeButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 2,
        minWidth: 90,
        alignItems: 'center',
    },
    themeButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
