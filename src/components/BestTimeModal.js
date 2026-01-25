import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { findBestTimeSlots } from '../utils/ActivityScheduler';
import { LinearGradient } from 'expo-linear-gradient';

const BestTimeModal = ({ visible, onClose, hourlyData, activityId, units }) => {
    const { theme } = useTheme();
    const [slots, setSlots] = useState([]);

    useEffect(() => {
        if (visible && hourlyData) {
            const best = findBestTimeSlots(hourlyData, activityId, units);
            setSlots(best);
        }
    }, [visible, hourlyData, activityId]);

    const formatTime = (ts) => {
        const d = new Date(ts * 1000);
        // Returns "Sat 2 PM"
        const day = d.toLocaleDateString('en-US', { weekday: 'short' });
        const hour = d.toLocaleTimeString('en-US', { hour: 'numeric' });
        return `${day} ${hour}`;
    };

    const formatDuration = (hours) => {
        if (hours === 1) return '1 hr window';
        return `${hours} hr window`;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <BlurView intensity={theme.name === 'oled' ? 0 : 40} style={StyleSheet.absoluteFill} tint="dark" />

                <View style={[styles.content, { backgroundColor: theme.cardBg }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Best Times for {activityId?.charAt(0).toUpperCase() + activityId?.slice(1)}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scroll}>
                        {slots.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="rainy-outline" size={48} color={theme.textSecondary} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    No ideal windows found in the next 48h. Conditions look tough.
                                </Text>
                            </View>
                        ) : (
                            slots.map((slot, index) => (
                                <View key={index} style={styles.slotWrapper}>
                                    {index === 0 && (
                                        <LinearGradient
                                            colors={['#F59E0B', '#FBBF24']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.goldenBadge}
                                        >
                                            <Ionicons name="star" size={12} color="#000" />
                                            <Text style={styles.goldenText}>BEST CHOICE</Text>
                                        </LinearGradient>
                                    )}

                                    <View style={[
                                        styles.slotCard,
                                        {
                                            backgroundColor: index === 0 ? theme.cardBg : theme.surface,
                                            borderColor: index === 0 ? '#F59E0B' : theme.glassBorder,
                                            borderWidth: index === 0 ? 2 : 1
                                        }
                                    ]}>
                                        <View style={styles.slotRow}>
                                            <View>
                                                <Text style={[styles.timeText, { color: theme.text }]}>
                                                    {formatTime(slot.startTime)}
                                                </Text>
                                                <Text style={[styles.durationText, { color: theme.textSecondary }]}>
                                                    {formatDuration(slot.durationHours)} • Score: {slot.avgScore}
                                                </Text>
                                            </View>
                                            {index === 0 ? (
                                                <Ionicons name="trophy" size={24} color="#F59E0B" />
                                            ) : (
                                                <Ionicons name="time-outline" size={24} color={theme.accent} />
                                            )}
                                        </View>
                                        <View style={styles.divider} />
                                        <Text style={[styles.adviceText, { color: theme.text }]}>
                                            "{slot.bestAdvice}"
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        height: '60%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
    },
    scroll: {
        paddingBottom: 40,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
        gap: 10,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
    },
    slotWrapper: {
        marginBottom: 20,
    },
    goldenBadge: {
        position: 'absolute',
        top: -10,
        left: 10,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    goldenText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
    },
    slotCard: {
        padding: 16,
        borderRadius: 20,
        paddingTop: 20, // space for badge if needed
    },
    slotRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    timeText: {
        fontSize: 18,
        fontWeight: '800',
    },
    durationText: {
        fontSize: 13,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(128,128,128,0.1)',
        marginVertical: 10,
    },
    adviceText: {
        fontSize: 14,
        fontStyle: 'italic',
        opacity: 0.9,
    }
});

export default BestTimeModal;
