import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import MapView, { UrlTile, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../context/ThemeContext';
import * as Sentry from '@sentry/react-native';

const RadarScreen = () => {
    const { weather, locationName } = useWeather();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [focusMode, setFocusMode] = useState(false);

    // Weather Map State
    const [host, setHost] = useState('');
    const [frames, setFrames] = useState([]);
    
    // Playback State
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    const lat = weather?.latitude || 40.7128;
    const lon = weather?.longitude || -74.0060;

    const fetchRadarData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data = await res.json();
            
            setHost(data.host);
            if (data.radar && data.radar.past) {
                setFrames(data.radar.past);
            }
        } catch (error) {
            Sentry.captureException(error);
            console.error('Radar fetch error', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRadarData();
    }, [fetchRadarData]);

    useEffect(() => {
        if (!isPlaying || frames.length === 0) return;
        
        let timer;
        const animate = () => {
            setCurrentStep((prev) => {
                const next = (prev + 1) % frames.length;
                // Pause slightly longer on the most recent frame
                const delay = next === 0 ? 2000 : 800;
                timer = setTimeout(animate, delay);
                return next;
            });
        };
        
        timer = setTimeout(animate, 800);
        return () => clearTimeout(timer);
    }, [isPlaying, frames]);

    const toggleFocus = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFocusMode(!focusMode);
    };

    const togglePlay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsPlaying(!isPlaying);
    };

    // Format current frame time
    const frameTime = frames[currentStep]?.time 
        ? new Date(frames[currentStep].time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : '--:--';

    // Base region
    const region = {
        latitude: lat,
        longitude: lon,
        latitudeDelta: focusMode ? 0.3 : 2.5,
        longitudeDelta: focusMode ? 0.3 : 2.5,
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={[styles.header, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Sat-Link Radar</Text>
                        <Text style={[styles.headerSub, { color: theme.accent }]}>
                            {locationName || 'Localizing...'}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, focusMode && { backgroundColor: theme.accent + '20' }]}
                            onPress={toggleFocus}
                        >
                            <Ionicons name={focusMode ? "locate" : "locate-outline"} size={22} color={focusMode ? theme.accent : theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                fetchRadarData();
                            }}
                        >
                            <Ionicons name="refresh" size={22} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={region}
                    region={region}
                    userInterfaceStyle={theme.name === 'day' ? 'light' : 'dark'}
                    showsUserLocation={true}
                    showsPointsOfInterest={false}
                    showsBuildings={false}
                >
                    {/* Render all radar frames as UrlTiles. Only the active frame is opaque. */}
                    {host && frames.map((frame, index) => {
                        const url = `${host}${frame.path}/256/{z}/{x}/{y}/4/1_1.png`;
                        return (
                            <UrlTile
                                key={frame.path}
                                urlTemplate={url}
                                zIndex={100 + index}
                                opacity={index === currentStep ? 0.75 : 0}
                                maximumZ={19}
                            />
                        );
                    })}
                </MapView>

                {loading && (
                    <View style={styles.syncOverlay}>
                        <View style={[styles.syncBox, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
                            <ActivityIndicator size="small" color={theme.accent} />
                            <Text style={[styles.syncText, { color: theme.text }]}>SYNCING SATELLITE...</Text>
                        </View>
                    </View>
                )}

                {!loading && frames.length > 0 && (
                    <View style={[styles.footer, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>

                        {/* Status Row */}
                        <View style={styles.footerTop}>
                            <View style={styles.liveIndicator}>
                                <View style={[styles.dot, isPlaying && styles.dotActive, { backgroundColor: isPlaying ? theme.success : theme.textSecondary }]} />
                                <Text style={[styles.liveText, { color: theme.text }]}>
                                    {isPlaying ? 'LIVE FEED' : 'PAUSED'}
                                </Text>
                            </View>
                            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
                                {frameTime}
                            </Text>
                        </View>

                        {/* Controls Row */}
                        <View style={styles.controlsRow}>
                            <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
                                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={theme.accent} />
                            </TouchableOpacity>

                            {/* Progress Dots */}
                            <View style={styles.progressContainer}>
                                {frames.map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.stepDot,
                                            { backgroundColor: i <= currentStep ? theme.accent : theme.glassBorder },
                                            i === currentStep && { transform: [{ scale: 1.5 }] }
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Rain Legend */}
                        <View style={styles.legendContainer}>
                            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Light</Text>
                            <View style={styles.legendBar}>
                                <View style={[styles.legendSegment, { backgroundColor: '#3b82f6' }]} />
                                <View style={[styles.legendSegment, { backgroundColor: '#8b5cf6' }]} />
                                <View style={[styles.legendSegment, { backgroundColor: '#f59e0b' }]} />
                                <View style={[styles.legendSegment, { backgroundColor: '#ef4444' }]} />
                            </View>
                            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Heavy</Text>
                        </View>

                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderBottomWidth: 1,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        paddingTop: 45, 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    headerSub: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 15,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    mapContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    map: {
        flex: 1,
    },
    syncOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    syncBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        elevation: 5,
    },
    syncText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    footerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dotActive: {
        shadowColor: '#22c55e',
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 5,
    },
    liveText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    timestamp: {
        fontSize: 12,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 12,
    },
    playBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
    },
    progressContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 20,
    },
    stepDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    legendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendBar: {
        flex: 1,
        flexDirection: 'row',
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    legendSegment: {
        flex: 1,
    },
    legendLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});

export default RadarScreen;
