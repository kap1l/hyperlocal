import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HourlyScreen = () => {
    const { weather, units, selectedActivity } = useWeather();
    const { theme } = useTheme();
    const [expandedIds, setExpandedIds] = useState(new Set());

    const hourlyData = weather?.hourly?.data || [];

    const calculateReadiness = (item) => {
        const { temperature, humidity, windSpeed, uvIndex, apparentTemperature, precipProbability } = item;
        const isMetric = units === 'si';
        const tempF = isMetric ? (temperature * 9 / 5) + 32 : temperature;
        const feelsLikeF = isMetric ? (apparentTemperature * 9 / 5) + 32 : apparentTemperature;

        let score = 100;
        let reasons = [];

        // --- ACTIVITY SPECIFIC THRESHOLDS ---

        // 1. Temperature Deductions
        if (selectedActivity === 'run') {
            if (tempF > 85 || feelsLikeF > 90) { score -= 45; reasons.push("High Heat"); }
            else if (tempF < 20) { score -= 40; reasons.push("Extreme Cold"); }
        } else if (selectedActivity === 'cycle') {
            if (tempF > 95) { score -= 40; reasons.push("Extreme Heat"); }
            else if (tempF < 30) { score -= 50; reasons.push("Windchill"); }
        } else {
            if (tempF < 10 || feelsLikeF < 5) { score -= 60; reasons.push("Extreme Cold"); }
            else if (tempF < 32 || feelsLikeF < 25) { score -= 40; reasons.push("Freezing"); }
            else if (tempF > 100) { score -= 60; reasons.push("Extreme Heat"); }
        }

        // 2. Rain Deductions
        if (precipProbability > 0.2) {
            if (selectedActivity === 'camera') { score -= 70; reasons.push("Rain Gear Hazard"); }
            else if (selectedActivity === 'cycle') { score -= 60; reasons.push("Heavy Rain/Slippery"); }
            else { score -= 50; reasons.push("Rain"); }
        }

        // 3. Wind Deductions
        if (windSpeed > 15) {
            if (selectedActivity === 'cycle') { score -= 45; reasons.push("Strong Headwinds"); }
            else if (selectedActivity === 'camera') { score -= 40; reasons.push("Camera Shake"); }
            else if (windSpeed > 25) { score -= 40; reasons.push("Heavy Gales"); }
        }

        // 4. UV Deductions
        if (uvIndex > 8 && selectedActivity !== 'drive') {
            score -= 15;
            reasons.push("High UV");
        }

        let status = 'Good';
        let color = '#22c55e';
        let icon = 'checkmark-circle-outline';

        if (score < 40) {
            status = 'Poor';
            color = '#ef4444';
            icon = 'close-circle-outline';
        } else if (score < 75) {
            status = 'Fair';
            color = '#f59e0b';
            icon = 'alert-circle-outline';
        }

        return { status, color, icon, reasons, score };
    };

    const sections = useMemo(() => {
        if (!hourlyData.length) return [];

        const groups = {
            'Morning (6AM - 12PM)': [],
            'Afternoon (12PM - 6PM)': [],
            'Evening (6PM - 10PM)': [],
            'Night (10PM - 6AM)': []
        };

        hourlyData.slice(0, 24).forEach(item => {
            const hour = new Date(item.time * 1000).getHours();
            if (hour >= 6 && hour < 12) groups['Morning (6AM - 12PM)'].push(item);
            else if (hour >= 12 && hour < 18) groups['Afternoon (12PM - 6PM)'].push(item);
            else if (hour >= 18 && hour < 22) groups['Evening (6PM - 10PM)'].push(item);
            else groups['Night (10PM - 6AM)'].push(item);
        });

        return Object.entries(groups)
            .filter(([_, data]) => data.length > 0)
            .map(([title, data]) => ({ title, data }));
    }, [hourlyData]);

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

        const readiness = calculateReadiness(item);

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
                        <Text style={[styles.statusText, { color: readiness.color }]}>{readiness.status}</Text>
                    </View>

                    <View style={styles.mainInfo}>
                        <View style={styles.tempRow}>
                            <Text style={[styles.temp, { color: theme.text }]}>{Math.round(item.temperature)}°</Text>
                            <View style={styles.summaryWrap}>
                                <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={1}>
                                    {item.summary}
                                </Text>
                                <Text style={[styles.reasonText, { color: readiness.reasons.length > 0 ? readiness.color : theme.success }]}>
                                    {readiness.reasons.length > 0 ? readiness.reasons[0] : `Optimal for ${selectedActivity}`}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.iconBox}>
                        <Ionicons name={readiness.icon} size={28} color={readiness.color} />
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
                        {readiness.reasons.length > 1 && (
                            <Text style={[styles.fullReasons, { color: theme.textSecondary }]}>
                                Issues: {readiness.reasons.join(' • ')}
                            </Text>
                        )}
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
