import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Switch, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const SettingsScreen = () => {
    const {
        apiKey, setApiKey,
        units, setUnits,
        locationConfig, setLocationConfig,
        selectedActivity, setSelectedActivity,
        weather // Needed for live safety check
    } = useWeather();
    const { theme, mode, setMode, useOled, toggleOled } = useTheme();

    const [barometerEnabled, setBarometerEnabled] = useState(false);
    const [alertsEnabled, setAlertsEnabled] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);

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
        if (!apiKey) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("API Key Missing", "Please save your Pirate Weather API key first.");
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsTesting(true);
        try {
            await checkWeatherAndNotify(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Notification Failed", error.message);
        } finally {
            setIsTesting(false);
        }
    };



    const handleSearchLocation = async () => {
        if (!locationInput.trim()) return;
        setIsGeocoding(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const coords = await geocodeAddress(locationInput);
            setLocationConfig({
                mode: 'manual',
                coords: { latitude: coords.latitude, longitude: coords.longitude },
                label: coords.name
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Location Found", `Weather will now be shown for ${coords.name}`);
        } catch (e) {
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
        { id: 'walk', label: 'Walking', icon: 'walk-outline' },
        { id: 'run', label: 'Running', icon: 'speedometer-outline' },
        { id: 'cycle', label: 'Cycling', icon: 'bicycle-outline' },
        { id: 'camera', label: 'Photo/Film', icon: 'camera-outline' },
        { id: 'drive', label: 'Driving', icon: 'car-outline' }
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
                <Text style={[styles.header, { color: theme.text }]}>Settings</Text>

                {/* Activity Selection */}
                <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                    <GlassDropdown
                        label="My Primary Activity"
                        value={selectedActivity}
                        onSelect={handleUpdateActivity}
                        options={[
                            { label: 'Walking', value: 'walk', icon: 'walk-outline', category: 'Basics' },
                            { label: 'Running', value: 'run', icon: 'speedometer-outline', category: 'Basics' },
                            { label: 'Cycling', value: 'cycle', icon: 'bicycle-outline', category: 'Wheels' },
                            { label: 'Hiking', value: 'hike', icon: 'trail-sign-outline', category: 'Basics' },

                            { label: 'Tennis / Pickleball', value: 'tennis', icon: 'tennisball-outline', category: 'Sports' },
                            { label: 'Golf', value: 'golf', icon: 'golf-outline', category: 'Sports' },
                            { label: 'Outdoor Yoga', value: 'yoga', icon: 'body-outline', category: 'Sports' },

                            { label: 'Picnic', value: 'picnic', icon: 'basket-outline', category: 'Leisure' },
                            { label: 'Fishing', value: 'fishing', icon: 'fish-outline', category: 'Leisure' },
                            { label: 'Stargazing', value: 'stargaze', icon: 'star-outline', category: 'Leisure' },
                            { label: 'Photography', value: 'camera', icon: 'camera-outline', category: 'Leisure' },

                            { label: 'Motorcycle', value: 'moto', icon: 'bicycle', category: 'Commute' },
                            { label: 'Driving', value: 'drive', icon: 'car-outline', category: 'Commute' },
                        ]}
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
                            style={[styles.tab, locationConfig.mode === 'manual' && { backgroundColor: theme.accent }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLocationConfig({ ...locationConfig, mode: 'manual' });
                            }}
                        >
                            <Text style={[styles.tabText, { color: locationConfig.mode === 'manual' ? '#fff' : theme.textSecondary }]}>Manual</Text>
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
                    <Text style={[styles.info, { color: theme.textSecondary }]}>microWeather Local v1.5.0 (Activity Core)</Text>

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
