import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../context/ThemeContext';
import { analyzeActivitySafety } from '../utils/weatherSafety';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HourlyScreen = () => {
    const { weather, units, selectedActivity } = useWeather();
    const { theme } = useTheme();
    const [expandedIds, setExpandedIds] = useState(new Set());

    const hourlyData = weather?.hourly?.data || [];
    const minutely = weather?.minutely?.data;
    const currently = weather?.currently;

    const sections = useMemo(() => {
        if (!hourlyData.length) return [];

        const groups = {
            'Morning (5AM - 12PM)': [],
            'Afternoon (12PM - 6PM)': [],
            'Evening (6PM - 10PM)': []
        };

        // Filter 5 AM - 10 PM
        const filtered = hourlyData.filter(item => {
            const hour = new Date(item.time * 1000).getHours();
            return hour >= 5 && hour <= 22;
        });

        filtered.slice(0, 24).forEach(item => {
            const date = new Date(item.time * 1000);
            const hour = date.getHours();
            const now = new Date();
            const isNow = date.getDate() === now.getDate() && hour === now.getHours();

            // SYNC OVERRIDE: Use 'currently' data if it's the current hour
            const dataToUse = (isNow && currently) ? currently : item;

            // Calculate safety using the CENTRALIZED utility
            const analysis = analyzeActivitySafety(selectedActivity || 'walk', dataToUse, units);

            // Enrich the item with analysis data for rendering
            const enrichedItem = {
                ...item,
                ...dataToUse, // Ensure temp etc match
                analysis // { status, color, advice, metrics }
            };

            if (hour >= 5 && hour < 12) groups['Morning (5AM - 12PM)'].push(enrichedItem);
            else if (hour >= 12 && hour < 18) groups['Afternoon (12PM - 6PM)'].push(enrichedItem);
            else if (hour >= 18 && hour <= 22) groups['Evening (6PM - 10PM)'].push(enrichedItem);
        });

        return Object.entries(groups)
            .filter(([_, data]) => data.length > 0)
            .map(([title, data]) => ({ title, data }));
    }, [hourlyData, currently, selectedActivity, units]);

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedIds(newExpanded);
    };

    const renderItem = ({ item }) => {
        const isExpanded = expandedIds.has(item.time);
        const date = new Date(item.time * 1000);
        const hour = date.getHours();
        const ampm = hour >= 12 ? 'pm' : 'am';
        const hourDisp = hour % 12 || 12;

        const readiness = item.analysis;

        // Map safety score to icon (approximate since we don't have icon in safety object, logic can be inferred)
        let icon = 'checkmark-circle-outline';
        if (readiness.status === 'Poor' || readiness.status === 'Hazardous') icon = 'close-circle-outline';
        else if (readiness.status === 'Fair') icon = 'alert-circle-outline';

        const mainReason = readiness.advice;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleExpand(item.time)}
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
    };

    return (
        <GradientBackground>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Planner: {selectedActivity.charAt(0).toUpperCase() + selectedActivity.slice(1)}</Text>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Tap hours for survival details</Text>
            </View>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.time.toString()}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={[styles.sectionHeader, { color: theme.accent }]}>{title}</Text>
                )}
                contentContainerStyle={styles.list}
                stickySectionHeadersEnabled={false}
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
