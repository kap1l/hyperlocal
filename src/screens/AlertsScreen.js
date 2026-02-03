import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../context/ThemeContext';

const AlertsScreen = () => {
    const { weather } = useWeather();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const [history, setHistory] = useState([]);
    const minutely = weather?.minutely?.data || [];

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadHistory();
        });
        return unsubscribe;
    }, [navigation]);

    const loadHistory = async () => {
        const historyStr = await AsyncStorage.getItem('@alert_history');
        if (historyStr) {
            setHistory(JSON.parse(historyStr));
        }
    };

    const clearHistory = async () => {
        Alert.alert("Clear History", "Are you sure you want to delete all alert history?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Clear",
                style: "destructive",
                onPress: async () => {
                    await AsyncStorage.removeItem('@alert_history');
                    setHistory([]);
                }
            }
        ]);
    };

    const currentAlerts = useMemo(() => {
        const list = [];
        if (weather?.alerts) {
            list.push(...weather.alerts);
        }

        let isRaining = minutely[0]?.precipProbability > 0.2;
        for (let i = 1; i < minutely.length; i++) {
            const willRain = minutely[i].precipProbability > 0.2;
            if (!isRaining && willRain) {
                list.push({
                    title: "Rain Starting Soon",
                    description: `Rain predicted at your location in ${i} minutes.`,
                    time: minutely[i].time,
                    id: `rain-${minutely[i].time}`,
                    type: 'forecast'
                });
                isRaining = true;
            } else if (isRaining && !willRain) {
                isRaining = false;
            }
        }
        return list;
    }, [weather]);

    const allData = useMemo(() => {
        // Combine history and current forecast alerts
        return [
            ...currentAlerts.map(a => ({ ...a, isHistorical: false })),
            ...history.map(a => ({ ...a, isHistorical: true }))
        ].sort((a, b) => b.time - a.time);
    }, [currentAlerts, history]);

    const renderItem = ({ item }) => {
        const date = new Date(item.time * 1000);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

        return (
            <View style={[
                styles.alertCard,
                {
                    backgroundColor: item.isHistorical ? theme.cardBg : theme.danger,
                    borderLeftColor: item.isHistorical ? theme.accent : (theme.name === 'day' ? '#C62828' : '#F44336')
                }
            ]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.alertTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>{dateStr} {timeStr}</Text>
                </View>
                <Text style={[styles.alertDesc, { color: theme.textSecondary }]}>{item.description}</Text>
                {!item.isHistorical && (
                    <View style={styles.nowBadge}>
                        <Text style={styles.nowBadgeText}>FORECAST</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <GradientBackground>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Alerts</Text>
                {history.length > 0 && (
                    <TouchableOpacity onPress={clearHistory}>
                        <Text style={[styles.clearLink, { color: theme.accent }]}>Clear History</Text>
                    </TouchableOpacity>
                )}
            </View>
            <FlatList
                data={allData}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No active or recent alerts.</Text>
                    </View>
                }
            />
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: 20,
        paddingTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    clearLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        paddingBottom: 100,
    },
    alertCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    alertTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        flex: 1,
    },
    timeLabel: {
        fontSize: 12,
        marginLeft: 8,
    },
    alertDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    nowBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 8,
    },
    nowBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    empty: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    }
});

export default AlertsScreen;
