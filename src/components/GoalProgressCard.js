import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getGoal, getProgress, getBestRemainingWindows } from '../services/GoalService';
import { ActivityIcons } from '../utils/activityIcons';

export default function GoalProgressCard({ dailyData, units }) {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [goal, setGoal] = useState(null);
    const [progress, setProgress] = useState(null);
    const [bestWindows, setBestWindows] = useState([]);

    useEffect(() => {
        if (isFocused) {
            loadGoalData();
        }
    }, [isFocused, dailyData]);

    const loadGoalData = async () => {
        const fetchedGoal = await getGoal();
        setGoal(fetchedGoal);
        if (fetchedGoal) {
            const fetchedProgress = await getProgress();
            setProgress(fetchedProgress);
            
            if (fetchedProgress && fetchedProgress.remaining > 0) {
                const windows = getBestRemainingWindows(dailyData, fetchedGoal.activity, units);
                setBestWindows(windows);
            }
        }
    };

    if (!goal) {
        return (
            <TouchableOpacity 
                style={[styles.emptyContainer, { backgroundColor: theme.cardBg + '80' }]} 
                onPress={() => navigation.navigate('GoalSetup')}
            >
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Set a weekly outdoor goal →</Text>
            </TouchableOpacity>
        );
    }

    if (!progress) return null;

    const { sessionsLogged, targetDays, isOnTrack } = progress;
    const isComplete = sessionsLogged >= targetDays;
    const progressPercent = Math.min(100, Math.round((sessionsLogged / targetDays) * 100));
    
    const iconName = ActivityIcons[goal.activity] || 'walk-outline';

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
            <View style={styles.headerRow}>
                <View style={styles.titleRow}>
                    <Ionicons name={iconName} size={16} color={theme.accent} style={{ marginRight: 6 }} />
                    <Text style={[styles.title, { color: theme.text }]}>
                        {sessionsLogged}/{targetDays} sessions this week
                    </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('GoalSetup')}>
                    <Ionicons name="settings-outline" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {isComplete ? (
                <Text style={styles.completeText}>✓ Goal complete this week!</Text>
            ) : (
                <View style={[styles.progressBarBg, { backgroundColor: theme.glassBorder }]}>
                    <View 
                        style={[
                            styles.progressBarFill, 
                            { 
                                width: `${progressPercent}%`, 
                                backgroundColor: isOnTrack ? '#22c55e' : '#f59e0b' 
                            }
                        ]} 
                    />
                </View>
            )}

            {!isComplete && bestWindows.length > 0 && (
                <View style={styles.windowsRow}>
                    <Text style={[styles.windowsLabel, { color: theme.textSecondary }]}>upcoming windows:</Text>
                    {bestWindows.map((win, idx) => (
                        <View key={idx} style={[styles.windowChip, { backgroundColor: theme.glassBorder }]}>
                            <Text style={[styles.windowChipText, { color: theme.textSecondary }]}>
                                {win.dayLabel} <Text style={{ color: win.score >= 80 ? '#22c55e' : '#f59e0b', fontWeight: 'bold' }}>{win.score}/100</Text>
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    emptyContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
    },
    container: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
    },
    completeText: {
        color: '#22c55e',
        fontWeight: 'bold',
        fontSize: 14,
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    windowsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 6,
    },
    windowsLabel: {
        fontSize: 11,
        marginRight: 2,
    },
    windowChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    windowChipText: {
        fontSize: 11,
    }
});
