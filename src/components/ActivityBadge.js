import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ActivityBadge = ({
    icon,
    label,
    status = 'safe', // 'safe', 'warning', 'unsafe'
    message,
    subMessage,
    onPress
}) => {
    const { theme } = useTheme();

    let statusColor, borderColor;

    // Status color mapping
    if (status === 'safe') {
        statusColor = theme.name === 'day' ? '#22c55e' : '#4ade80'; // Green
        borderColor = 'rgba(34, 197, 94, 0.3)';
    } else if (status === 'warning') {
        statusColor = '#f59e0b'; // Amber
        borderColor = 'rgba(245, 158, 11, 0.3)';
    } else {
        statusColor = '#ef4444'; // Red
        borderColor = 'rgba(239, 68, 68, 0.3)';
    }

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.container, {
                backgroundColor: theme.glass,
                borderColor: theme.glassBorder,
                borderLeftColor: statusColor,
                borderLeftWidth: 4,
                shadowColor: theme.shadow
            }]}
        >
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons name={icon} size={18} color={theme.text} />
                    <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{status.toUpperCase()}</Text>
                </View>
            </View>

            <Text style={[styles.message, { color: theme.text }]} numberOfLines={2}>
                {message}
            </Text>

            {subMessage && (
                <Text style={[styles.subMessage, { color: theme.textSecondary }]}>
                    {subMessage}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderLeftWidth: 4, // Accent on left
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    message: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    subMessage: {
        fontSize: 13,
    }
});

export default ActivityBadge;
