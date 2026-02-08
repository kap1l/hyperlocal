import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../context/ThemeContext';

const RADAR_SNAPSHOT_KEY = '@last_radar_snapshot';

const RadarScreen = () => {
    const { weather, locationName } = useWeather();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [cachedSnapshot, setCachedSnapshot] = useState(null);
    const [focusMode, setFocusMode] = useState(false);

    // Playback State
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(0);
    const [frameTime, setFrameTime] = useState('');

    const webViewRef = React.useRef(null);

    const lat = weather?.latitude || 40.7128;
    const lon = weather?.longitude || -74.0060;

    // Load initial cache from memory
    useEffect(() => {
        const loadCache = async () => {
            const saved = await AsyncStorage.getItem(RADAR_SNAPSHOT_KEY);
            if (saved) {
                setCachedSnapshot(JSON.parse(saved));
            }
        };
        loadCache();
    }, []);

    const toggleFocus = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFocusMode(!focusMode);
        setLoading(true);
    };

    const togglePlay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsPlaying(!isPlaying);
        webViewRef.current?.postMessage(JSON.stringify({ type: isPlaying ? 'PAUSE' : 'PLAY' }));
    };

    const htmlContent = useMemo(() => {
        const zoom = focusMode ? 13 : 8;
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; background-color: transparent; font-family: sans-serif; height: 100vh; overflow: hidden; }
                #map { height: 100%; width: 100%; }
                .leaflet-control-attribution { display: none !important; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map;
                var radarLayers = [];
                var currentFrame = 0;
                var isPlaying = true;
                var timer = null;

                // Listen for RN messages
                window.addEventListener("message", function(event) {
                    try {
                        var data = JSON.parse(event.data);
                        if (data.type === 'PAUSE') {
                            isPlaying = false;
                            clearTimeout(timer);
                        } else if (data.type === 'PLAY') {
                            isPlaying = true;
                            animateRadar();
                        }
                    } catch (e) {}
                });
                // Also support document listen for Android sometimes
                document.addEventListener("message", function(event) {
                    try {
                        var data = JSON.parse(event.data);
                        if (data.type === 'PAUSE') {
                            isPlaying = false;
                            clearTimeout(timer);
                        } else if (data.type === 'PLAY') {
                            isPlaying = true;
                            animateRadar();
                        }
                    } catch (e) {}
                });

                try {
                    map = L.map('map', {
                        zoomControl: false,
                        attributionControl: false,
                        fadeAnimation: true,
                        zoomSnap: 0.5
                    }).setView([${lat}, ${lon}], ${zoom});

                    L.tileLayer('https://{s}.basemaps.cartocdn.com/${theme.name === 'day' ? 'light_all' : 'dark_all'}/{z}/{x}/{y}{r}.png').addTo(map);
                    
                    L.circleMarker([${lat}, ${lon}], {
                        radius: 8, fillColor: "#3b82f6", color: "#fff", weight: 2, opacity: 1, fillOpacity: 1
                    }).addTo(map);

                    fetch('https://api.rainviewer.com/public/weather-maps.json')
                        .then(res => res.json())
                        .then(data => {
                            var apiData = data;
                            var frames = apiData.radar.past;
                            
                            // Let RN know total frames
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'META',
                                total: frames.length
                            }));

                            // Prepare caching snapshot
                            if (frames.length > 0) {
                                var latest = frames[frames.length - 1];
                                var snapshotUrl = apiData.host + latest.path + '/512/${zoom}/${lat}/${lon}/1/1_1.png';
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'SNAPSHOT',
                                    url: snapshotUrl,
                                    time: latest.time
                                }));
                            }

                            // Load layers
                            frames.forEach((frame, i) => {
                                var layer = L.tileLayer(apiData.host + frame.path + '/256/{z}/{x}/{y}/4/1_1.png', {
                                    opacity: 0, zIndex: 1000 + i
                                });
                                layer.timeLabel = new Date(frame.time * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                radarLayers.push(layer);
                                layer.addTo(map);
                            });

                            if (radarLayers.length > 0) {
                                animateRadar();
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOADED' }));
                            }
                        })
                        .catch(err => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOADED' })));
                } catch (e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOADED' }));
                }

                function animateRadar() {
                    if (radarLayers.length === 0) return;
                    
                    // Update opacity
                    radarLayers.forEach(l => l.setOpacity(0)); 
                    radarLayers[currentFrame].setOpacity(0.75); 
                    
                    // Inform RN of progress
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'PROGRESS',
                        current: currentFrame,
                        time: radarLayers[currentFrame].timeLabel
                    }));

                    if (isPlaying) {
                        currentFrame = (currentFrame + 1) % radarLayers.length;
                        var delay = (currentFrame === 0) ? 2000 : 800;
                        timer = setTimeout(animateRadar, delay);
                    }
                }
            </script>
        </body>
        </html>
        `;
    }, [lat, lon, theme.name, refreshKey, focusMode]);

    const onMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'LOADED') setLoading(false);
            if (data.type === 'META') setTotalSteps(data.total);
            if (data.type === 'PROGRESS') {
                setCurrentStep(data.current);
                setFrameTime(data.time);
            }
            if (data.type === 'SNAPSHOT') {
                const snapshot = { url: data.url, time: data.time };
                await AsyncStorage.setItem(RADAR_SNAPSHOT_KEY, JSON.stringify(snapshot));
            }
        } catch (e) { }
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
                                setLoading(true);
                                setRefreshKey(k => k + 1);
                            }}
                        >
                            <Ionicons name="refresh" size={22} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <View style={styles.mapContainer}>
                {cachedSnapshot && (
                    <View style={styles.backgroundLayer}>
                        <Image
                            source={{ uri: cachedSnapshot.url }}
                            style={styles.cachedImage}
                            resizeMode="cover"
                        />
                    </View>
                )}

                <WebView
                    ref={webViewRef}
                    key={`${refreshKey}-${focusMode}`}
                    originWhitelist={['*']}
                    source={{ html: htmlContent }}
                    style={[styles.map, { opacity: loading ? 0 : 1 }]}
                    onMessage={onMessage}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    transparent={true}
                    backgroundColor="transparent"
                />

                {loading && (
                    <View style={[styles.syncOverlay, !cachedSnapshot && { backgroundColor: '#000' }]}>
                        <View style={[styles.syncBox, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
                            <ActivityIndicator size="small" color={theme.accent} />
                            <Text style={[styles.syncText, { color: theme.text }]}>SYNCING SATELLITE...</Text>
                        </View>
                    </View>
                )}

                {!loading && (
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
                                {frameTime || '--:--'}
                            </Text>
                        </View>

                        {/* Controls Row */}
                        <View style={styles.controlsRow}>
                            <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
                                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={theme.accent} />
                            </TouchableOpacity>

                            {/* Progress Dots */}
                            <View style={styles.progressContainer}>
                                {Array.from({ length: totalSteps || 10 }).map((_, i) => (
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
        paddingTop: 45, // Safe Area offset
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
        backdropFilter: 'blur(10px)', // Web only support, native ignores
    },
    mapContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cachedImage: {
        width: '100%',
        height: '100%',
        opacity: 0.5,
    },
    map: {
        flex: 1,
        marginTop: 100, // Make room for header
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
        backgroundColor: 'rgba(255,255,255,0.2)',
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
