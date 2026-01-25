import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { findBestTimeSlots } from '../utils/ActivityScheduler';
import { LinearGradient } from 'expo-linear-gradient';

// Helper component for Date Pill
const DatePill = ({ date, isSelected, onSelect, theme }) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon
    const dayNum = date.getDate(); // 24

    return (
        <TouchableOpacity
            onPress={() => onSelect(date)}
            style={[
                styles.datePill,
                {
                    backgroundColor: isSelected ? theme.accent : 'rgba(255,255,255,0.05)',
                    borderColor: isSelected ? theme.accent : 'rgba(255,255,255,0.1)'
                }
            ]}
        >
            <Text style={[styles.dayName, { color: isSelected ? '#000' : theme.textSecondary }]}>{dayName}</Text>
            <Text style={[styles.dayNum, { color: isSelected ? '#000' : theme.text }]}>{dayNum}</Text>
        </TouchableOpacity>
    );
};

const BestTimeModal = ({ visible, onClose, hourlyData, activityId, units }) => {
    const { theme } = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date()); // Default today
    const [slots, setSlots] = useState([]);

    // Generate next 7 days for picker
    const dates = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(today);
            nextDay.setDate(today.getDate() + i);
            days.push(nextDay);
        }
        return days;
    }, []); // Stable unless mounted

    useEffect(() => {
        // Reset to today when modal opens
        if (visible) setSelectedDate(new Date());
    }, [visible]);

    useEffect(() => {
        if (visible && hourlyData) {
            // Find best slots for the SPECIFIC selected date
            const best = findBestTimeSlots(hourlyData, activityId, units, selectedDate);
            setSlots(best);
        }
    }, [visible, hourlyData, activityId, selectedDate]);

    const formatTime = (ts) => {
        const d = new Date(ts * 1000);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const formatDuration = (hours) => {
        if (hours === 1) return '1 hr';
        return `${hours} hrs`;
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
                        <View>
                            <Text style={[styles.title, { color: theme.text }]}>Best Times</Text>
                            <Text style={[styles.subtitle, { color: theme.accent }]}>
                                for {activityId?.charAt(0).toUpperCase() + activityId?.slice(1)}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close-circle" size={32} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Date Selector */}
                    <View style={styles.dateSelectorContainer}>
                        <FlatList
                            horizontal
                            data={dates}
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.toISOString()}
                            renderItem={({ item }) => (
                                <DatePill
                                    date={item}
                                    theme={theme}
                                    isSelected={item.getDate() === selectedDate.getDate()}
                                    onSelect={setSelectedDate}
                                />
                            )}
                            contentContainerStyle={{ paddingHorizontal: 0, gap: 10 }}
                        />
                    </View>

                    <ScrollView contentContainerStyle={styles.scroll}>
                        {slots.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="cloud-offline-outline" size={48} color={theme.textSecondary} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    No ideal windows found for this day.
                                </Text>
                                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                                    Try checking another date?
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TOP SUGGESTIONS</Text>
                                {slots.map((slot, index) => (
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
                                                <View style={styles.timeCluster}>
                                                    <Text style={[styles.timeText, { color: theme.text }]}>
                                                        {formatTime(slot.startTime)}
                                                    </Text>
                                                    <Text style={[styles.durationText, { color: theme.textSecondary }]}>
                                                        {formatDuration(slot.durationHours)} duration
                                                    </Text>
                                                </View>

                                                <View style={styles.scoreBox}>
                                                    <Text style={[styles.scoreVal, { color: index === 0 ? '#F59E0B' : theme.accent }]}>
                                                        {slot.avgScore}
                                                    </Text>
                                                    <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Score</Text>
                                                </View>
                                            </View>

                                            <View style={styles.divider} />
                                            <Text style={[styles.adviceText, { color: theme.text }]}>
                                                {slot.bestAdvice}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </>
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
        height: '75%', // Taller for date picker
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '500',
        marginTop: 2,
    },
    dateSelectorContainer: {
        height: 70,
        marginBottom: 10,
    },
    datePill: {
        width: 55,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    dayName: {
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 4,
    },
    dayNum: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 15,
        marginTop: 5,
        opacity: 0.7,
    },
    scroll: {
        paddingBottom: 40,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        gap: 10,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
    emptySub: {
        fontSize: 14,
        opacity: 0.7,
    },
    slotWrapper: {
        marginBottom: 16,
    },
    goldenBadge: {
        position: 'absolute',
        top: -12,
        right: 20, // Moved to right for style
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    goldenText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 0.5,
    },
    slotCard: {
        padding: 20,
        borderRadius: 24,
    },
    slotRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeCluster: {
        gap: 4,
    },
    timeText: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    durationText: {
        fontSize: 14,
        fontWeight: '600',
    },
    scoreBox: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    scoreVal: {
        fontSize: 20,
        fontWeight: '900',
    },
    scoreLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 12,
    },
    adviceText: {
        fontSize: 15,
        fontStyle: 'italic',
        lineHeight: 22,
        opacity: 0.9,
    }
});

export default BestTimeModal;
