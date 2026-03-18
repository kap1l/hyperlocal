import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getActivityLog } from '../services/ActivityLogService';
import { useNavigation, useIsFocused } from '@react-navigation/native';

export default function LogSessionCard() {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [recentLogs, setRecentLogs] = useState([]);

    useEffect(() => {
        if (isFocused) {
            getActivityLog().then(logs => {
                setRecentLogs(logs.slice(0, 3)); // Only show top 3 recent
            });
        }
    }, [isFocused]);

    if (recentLogs.length === 0) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="list-outline" size={16} color={theme.accent} />
                    <Text style={[styles.title, { color: theme.text }]}>Recent Activities</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('ActivityLog')}>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: 'bold' }}>View All</Text>
                </TouchableOpacity>
            </View>

            {recentLogs.map((log, index) => {
                const dateObj = new Date(log.date);
                return (
                    <View key={log.id} style={[styles.itemRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.glassBorder }]}>
                        <View>
                            <Text style={{ color: theme.text, textTransform: 'capitalize', fontWeight: '500' }}>
                                {log.activity}
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                {dateObj.toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: theme.text, fontWeight: 'bold' }}>{log.duration}m</Text>
                            {log.distance && (
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{log.distance}mi</Text>
                            )}
                        </View>
                    </View>
                );
            })}
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
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    }
});
