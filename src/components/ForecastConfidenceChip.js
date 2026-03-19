import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ForecastConfidenceChip({ confidence }) {
    const { theme } = useTheme();

    if (!confidence) return null;

    let icon, color, label;
    switch (confidence) {
        case 'high':
            icon = 'checkmark-circle';
            color = '#22c55e'; // Green
            label = 'High Confidence';
            break;
        case 'low':
            icon = 'warning';
            color = '#ef4444'; // Red
            label = 'Low Confidence';
            break;
        case 'medium':
        default:
            icon = 'information-circle';
            color = '#f59e0b'; // Amber
            label = 'Medium Confidence';
            break;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
            <Ionicons name={icon} size={14} color={color} style={styles.icon} />
            <Text style={[styles.text, { color: theme.textSecondary }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 16,
    },
    icon: {
        marginRight: 6,
    },
    text: {
        fontSize: 12,
        fontWeight: 'bold',
    }
});
