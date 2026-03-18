import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { isHealthConnectAvailable, isHealthConnectEnabled, enableHealthConnect, disableHealthConnect, fetchHealthData } from '../services/HealthConnectService';
import { useIsFocused } from '@react-navigation/native';

export default function HealthInsightCard() {
    const { theme } = useTheme();
    const isFocused = useIsFocused();
    
    const [available, setAvailable] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        const load = async () => {
            const isAvail = isHealthConnectAvailable();
            setAvailable(isAvail);
            
            if (isAvail) {
                const isEn = await isHealthConnectEnabled();
                setEnabled(isEn);
                if (isEn) {
                    const healthData = await fetchHealthData();
                    setData(healthData);
                }
            }
        };
        if (isFocused) load();
    }, [isFocused]);

    const toggleHealthConnect = async (value) => {
        if (value) {
            const success = await enableHealthConnect();
            if (success) {
                setEnabled(true);
                const healthData = await fetchHealthData();
                setData(healthData);
            }
        } else {
            await disableHealthConnect();
            setEnabled(false);
            setData(null);
        }
    };

    if (!available) return null; // Android only

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="fitness" size={18} color="#4285F4" />
                    <Text style={[styles.title, { color: theme.text }]}>Google Health Connect</Text>
                </View>
                <Switch
                    value={enabled}
                    onValueChange={toggleHealthConnect}
                    trackColor={{ false: theme.glassBorder, true: '#4285F4' }}
                    thumbColor={'#fff'}
                    ios_backgroundColor={theme.glassBorder}
                />
            </View>

            {enabled && data ? (
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Ionicons name="walk" size={20} color={theme.textSecondary} />
                        <Text style={[styles.statValue, { color: theme.text }]}>{data.steps.toLocaleString()}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Steps</Text>
                    </View>
                    
                    <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />
                    
                    <View style={styles.statBox}>
                        <Ionicons name="flame" size={20} color="#f97316" />
                        <Text style={[styles.statValue, { color: theme.text }]}>{data.calories}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Cal</Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />
                    
                    <View style={styles.statBox}>
                        <Ionicons name="navigate" size={20} color={theme.textSecondary} />
                        <Text style={[styles.statValue, { color: theme.text }]}>{data.distanceMi}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Mi</Text>
                    </View>
                </View>
            ) : (
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 8 }}>
                    Enable Health Connect to sync your daily activity progress alongside your weather insights.
                </Text>
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
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
    },
    divider: {
        width: 1,
        height: 30,
        marginHorizontal: 10,
    }
});
