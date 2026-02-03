import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../context/ThemeContext';
import { analyzeActivitySafety } from '../utils/weatherSafety';
import { useSubscription } from '../context/SubscriptionContext';
import { Alert } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Optimization: Extracted & Memoized List Item
// This prevents the entire list from re-rendering when one item expands
const HourlyItem = React.memo(({ item, isExpanded, onToggle, theme }) => {
    const date = new Date(item.time * 1000);
    const hour = date.getHours();
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hourDisp = hour % 12 || 12;

    const readiness = item.analysis;

    // Map safety score to icon
    let icon = 'checkmark-circle-outline';
    if (readiness.status === 'Poor' || readiness.status === 'Hazardous') icon = 'close-circle-outline';
    else if (readiness.status === 'Fair') icon = 'alert-circle-outline';

    const mainReason = readiness.advice;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onToggle(item.time)}
            style={[
                styles.card,
                {
                    backgroundColor: theme.cardBg,
                    borderColor: isExpanded ? theme.accent : 'rgba(255,255,255,0.05)',
                    height: isExpanded ? 160 : 90
                }
            ]}
        >
            <View style={[styles.statusIndicator, { backgroundColor: readiness.color }]} />

            <View style={styles.cardHeader}>
                <View style={styles.timeSection}>
                    <Text style={[styles.time, { color: theme.text }]}>{hourDisp}{ampm}</Text>
                    <Text style={[styles.statusText, { color: readiness.color }]}>{readiness.label}</Text>
                </View>

                <View style={styles.mainInfo}>
                    <View style={styles.tempRow}>
                        <Text style={[styles.temp, { color: theme.text }]}>{Math.round(item.temperature)}°</Text>
                        <View style={styles.summaryWrap}>
                            <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={1}>
                                {item.summary}
                            </Text>
                            <Text style={[styles.reasonText, { color: readiness.color }]} numberOfLines={1}>
                                {mainReason}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.iconBox}>
                    <Ionicons name={icon} size={28} color={readiness.color} />
                </View>
            </View>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    <View style={styles.statGrid}>
                        <View style={styles.statItem}>
                            <Ionicons name="water-outline" size={14} color={theme.accent} />
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Rain</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{Math.round(item.precipProbability * 100)}%</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="leaf-outline" size={14} color={theme.accent} />
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Wind</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{Math.round(item.windSpeed)}<Text style={styles.unit}>mph</Text></Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="sunny-outline" size={14} color={theme.accent} />
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>UV</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{Math.round(item.uvIndex)}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="thermometer-outline" size={14} color={theme.accent} />
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Feels</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{Math.round(item.apparentTemperature)}°</Text>
                        </View>
                    </View>
                    <Text style={[styles.fullReasons, { color: theme.textSecondary }]}>
                        {readiness.advice}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for performance
    // Only re-render if expansion state changes or if data deep changes (unlikely for static weather)
    return prevProps.isExpanded === nextProps.isExpanded &&
        prevProps.theme.name === nextProps.theme.name &&
        prevProps.item.time === nextProps.item.time;
});

const HourlyScreen = () => {
    const { weather, units, selectedActivity } = useWeather();
    const { theme } = useTheme();
    const { isPro, purchasePro } = useSubscription();
    const [expandedIds, setExpandedIds] = useState(new Set());

    const hourlyData = weather?.hourly?.data || [];
    const minutely = weather?.minutely?.data;
    const currently = weather?.currently;

    const flatData = useMemo(() => {
        if (!hourlyData.length) return [];

        const filtered = hourlyData.filter(item => {
            const hour = new Date(item.time * 1000).getHours();
            return hour >= 5 && hour <= 22;
        });

        const limit = isPro ? 48 : 24;
        const sliced = filtered.slice(0, limit);

        const result = [];
        let currentSection = null;

        sliced.forEach((item, index) => {
            const date = new Date(item.time * 1000);
            const hour = date.getHours();
            const now = new Date();
            const isNow = date.getDate() === now.getDate() && hour === now.getHours();

            // Determine Section
            let sectionTitle = '';
            if (hour >= 5 && hour < 12) sectionTitle = 'Morning (5AM - 12PM)';
            else if (hour >= 12 && hour < 18) sectionTitle = 'Afternoon (12PM - 6PM)';
            else if (hour >= 18 && hour <= 22) sectionTitle = 'Evening (6PM - 10PM)';

            // Insert Header if changed
            if (sectionTitle !== currentSection) {
                result.push({ type: 'header', title: sectionTitle });
                currentSection = sectionTitle;
            }

            // SYNC OVERRIDE
            const dataToUse = (isNow && currently) ? currently : item;
            const analysis = analyzeActivitySafety(selectedActivity || 'walk', dataToUse, units);

            result.push({
                type: 'item',
                id: `${item.time}`,
                ...item,
                ...dataToUse,
                analysis
            });
        });

        return result;
    }, [hourlyData, currently, selectedActivity, units, isPro]);

    const toggleExpand = useCallback((id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIds(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(id)) newExpanded.delete(id);
            else newExpanded.add(id);
            return newExpanded;
        });
    }, []);

    const renderItem = useCallback(({ item }) => {
        if (item.type === 'header') {
            return <Text style={[styles.sectionHeader, { color: theme.accent }]}>{item.title}</Text>;
        }
        return (
            <HourlyItem
                item={item}
                isExpanded={expandedIds.has(item.time)}
                onToggle={toggleExpand}
                theme={theme}
            />
        );
    }, [expandedIds, toggleExpand, theme]);

    return (
        <GradientBackground>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Planner: {selectedActivity.charAt(0).toUpperCase() + selectedActivity.slice(1)}</Text>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Tap hours for survival details</Text>
            </View>
            <FlatList
                data={flatData}
                keyExtractor={(item, index) => item.type === 'header' ? `header-${index}` : `${item.id}-${index}`}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={5}
                ListFooterComponent={
                    !isPro ? (
                        <TouchableOpacity
                            onPress={purchasePro}
                            style={{
                                margin: 20,
                                padding: 15,
                                backgroundColor: theme.cardBg,
                                borderRadius: 12,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: theme.accent,
                                borderStyle: 'dashed'
                            }}
                        >
                            <Ionicons name="lock-closed" size={24} color={theme.accent} style={{ marginBottom: 8 }} />
                            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Unlock Full Forecast</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                                See 48+ hours ahead and plan your entire weekend with OutWeather+.
                            </Text>
                            <Text style={{ color: theme.accent, fontWeight: 'bold', marginTop: 10 }}>$1.99/month</Text>
                        </TouchableOpacity>
                    ) : null
                }
            />
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    headerSub: {
        fontSize: 14,
        marginTop: 4,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '800',
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        overflow: 'hidden',
    },
    statusIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        height: 90,
    },
    timeSection: {
        width: 75,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.05)',
    },
    time: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    mainInfo: {
        flex: 1,
        paddingHorizontal: 15,
    },
    tempRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    temp: {
        fontSize: 32,
        fontWeight: '300',
        marginRight: 12,
    },
    summaryWrap: {
        flex: 1,
    },
    summary: {
        fontSize: 14,
        fontWeight: '500',
    },
    reasonText: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    iconBox: {
        paddingRight: 15,
    },
    expandedContent: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 10,
    },
    statGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        marginTop: 4,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    unit: {
        fontSize: 9,
        fontWeight: 'normal',
    },
    fullReasons: {
        fontSize: 11,
        marginTop: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});

export default HourlyScreen;
