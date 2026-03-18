import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getLatestWeeklyReport } from '../services/WeeklyReportService';
import { useIsFocused } from '@react-navigation/native';

export default function WeeklyReportCard() {
    const { theme } = useTheme();
    const isFocused = useIsFocused();
    const [report, setReport] = useState(null);

    useEffect(() => {
        if (isFocused) {
            getLatestWeeklyReport().then(setReport);
        }
    }, [isFocused]);

    if (!report || report.sessionCount === 0) return null;

    const dateStr = new Date(report.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="bar-chart-outline" size={16} color={theme.accent} />
                    <Text style={[styles.title, { color: theme.text }]}>Weekly Report</Text>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{dateStr}</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{report.sessionCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sessions</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                        {Math.round(report.totalDuration / 60)}h {report.totalDuration % 60}m
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active Time</Text>
                </View>

                {report.totalDistance > 0 && (
                    <>
                        <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {report.totalDistance.toFixed(1)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Miles</Text>
                        </View>
                    </>
                )}
            </View>
            
            {report.topActivity !== 'None' && (
                <View style={[styles.footer, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '500' }}>
                        Top Activity: <Text style={{ color: theme.accent, textTransform: 'capitalize' }}>{report.topActivity}</Text>
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        width: 1,
        height: 30,
        marginHorizontal: 10,
    },
    footer: {
        marginTop: 16,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    }
});
