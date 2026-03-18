import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function LogSessionCard({ entry, onDelete }) {
    const { theme } = useTheme();

    if (!entry) return null;

    const dateObj = new Date(entry.timestamp);
    
    // Map activity name to basic icon
    let iconName = "fitness-outline";
    if (entry.activity === 'walk') iconName = "walk-outline";
    if (entry.activity === 'run') iconName = "body-outline";
    if (entry.activity === 'cycle') iconName = "bicycle-outline";
    
    // Score Badge Color
    const getScoreColor = (score) => {
        if (score >= 70) return '#22c55e';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
            <View style={styles.leftSection}>
                <Ionicons name={iconName} size={24} color={theme.text} style={styles.icon} />
                <View>
                    <Text style={[styles.dateText, { color: theme.text }]}>
                        {dateObj.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}, {dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                    <View style={styles.conditionsRow}>
                        <Text style={[styles.conditionsText, { color: theme.textSecondary }]}>
                            {Math.round(entry.temperature)}° · {entry.conditions}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.rightSection}>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(entry.score) }]}>
                    <Text style={styles.scoreText}>{entry.score}</Text>
                </View>
                {onDelete && (
                    <TouchableOpacity onPress={() => onDelete(entry.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    icon: {
        marginRight: 12,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    conditionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    conditionsText: {
        fontSize: 13,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    scoreText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    deleteBtn: {
        padding: 4,
    }
});
