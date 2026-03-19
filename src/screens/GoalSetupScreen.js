import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassDropdown from '../components/GlassDropdown';
import { useTheme } from '../context/ThemeContext';
import { getGoal, saveGoal } from '../services/GoalService';
import * as Haptics from 'expo-haptics';

export default function GoalSetupScreen({ navigation }) {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [activity, setActivity] = useState('walk');
    const [targetDays, setTargetDays] = useState(3);
    const [preferredTime, setPreferredTime] = useState('any');
    const [isEditing, setIsEditing] = useState(false);

    const timeOptions = [
        { id: 'morning', label: 'Morning' },
        { id: 'afternoon', label: 'Afternoon' },
        { id: 'evening', label: 'Evening' },
        { id: 'any', label: 'Any' },
    ];

    const daysOptions = [1, 2, 3, 4, 5, 6, 7];

    useEffect(() => {
        loadExistingGoal();
    }, []);

    const loadExistingGoal = async () => {
        const existing = await getGoal();
        if (existing) {
            setActivity(existing.activity || 'walk');
            setTargetDays(existing.targetDays || 3);
            setPreferredTime(existing.preferredTime || 'any');
            setIsEditing(true);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await saveGoal({ activity, targetDays, preferredTime });
        navigation.goBack();
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Goal", 
            "Are you sure you want to stop tracking this goal?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        await saveGoal(null);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Weekly Goal</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Which activity?</Text>
                <GlassDropdown selectedActivity={activity} onSelectActivity={(act) => setActivity(act)} />
            </View>

            <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>How many days per week?</Text>
                <View style={styles.daysRow}>
                    {daysOptions.map(day => (
                        <TouchableOpacity 
                            key={day} 
                            style={[
                                styles.dayCircle, 
                                { 
                                    backgroundColor: targetDays === day ? theme.accent : theme.glassBorder,
                                    borderColor: targetDays === day ? theme.accent : 'transparent',
                                }
                            ]}
                            onPress={() => setTargetDays(day)}
                        >
                            <Text style={{ color: targetDays === day ? '#fff' : theme.text, fontWeight: 'bold' }}>{day}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferred time</Text>
                <View style={styles.segments}>
                    {timeOptions.map(opt => (
                        <TouchableOpacity 
                            key={opt.id}
                            style={[
                                styles.segment,
                                { backgroundColor: preferredTime === opt.id ? theme.accent : theme.glassBorder }
                            ]}
                            onPress={() => setPreferredTime(opt.id)}
                        >
                            <Text style={{ 
                                color: preferredTime === opt.id ? '#fff' : theme.text, 
                                fontSize: 13, 
                                fontWeight: preferredTime === opt.id ? 'bold' : 'normal' 
                            }}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Goal</Text>
            </TouchableOpacity>

            {isEditing && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Delete Goal</Text>
                </TouchableOpacity>
            )}
            
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backBtn: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segments: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    segment: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    saveBtn: {
        marginHorizontal: 16,
        marginTop: 10,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteBtn: {
        alignItems: 'center',
        marginTop: 20,
        padding: 10,
    }
});
