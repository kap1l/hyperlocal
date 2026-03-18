import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getCardOrder, saveCardOrder, DEFAULT_ORDER, CARD_TITLES } from '../services/CardOrderService';
import GradientBackground from '../components/GradientBackground';
import * as Haptics from 'expo-haptics';

const CardOrderScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [cardOrder, setCardOrderState] = useState([]);

    useEffect(() => {
        loadOrder();
    }, []);

    const loadOrder = async () => {
        const order = await getCardOrder();
        setCardOrderState(order);
    };

    const handleReorder = async (index, direction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if ((direction === -1 && index === 0) || (direction === 1 && index === cardOrder.length - 1)) {
            return;
        }

        const newOrder = [...cardOrder];
        const temp = newOrder[index];
        newOrder[index] = newOrder[index + direction];
        newOrder[index + direction] = temp;

        setCardOrderState(newOrder);
        await saveCardOrder(newOrder);
    };

    const handleReset = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCardOrderState(DEFAULT_ORDER);
        await saveCardOrder(DEFAULT_ORDER);
    };

    const renderItem = ({ item, index }) => (
        <View style={[styles.cardRow, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
                {CARD_TITLES[item] || item}
            </Text>
            <View style={styles.controls}>
                <TouchableOpacity 
                    style={[styles.btn, index === 0 && styles.disabledBtn]} 
                    onPress={() => handleReorder(index, -1)}
                    disabled={index === 0}
                >
                    <Ionicons name="chevron-up" size={24} color={index === 0 ? theme.glassBorder : theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.btn, index === cardOrder.length - 1 && styles.disabledBtn]} 
                    onPress={() => handleReorder(index, 1)}
                    disabled={index === cardOrder.length - 1}
                >
                    <Ionicons name="chevron-down" size={24} color={index === cardOrder.length - 1 ? theme.glassBorder : theme.accent} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <GradientBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Customise Layout</Text>
            </View>

            <FlatList
                data={cardOrder}
                keyExtractor={item => item}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.resetBtn, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]} 
                    onPress={handleReset}
                >
                    <Text style={[styles.resetText, { color: theme.text }]}>Reset to Default</Text>
                </TouchableOpacity>
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 16,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btn: {
        padding: 10,
    },
    disabledBtn: {
        opacity: 0.5,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 10,
    },
    resetBtn: {
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    resetText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default CardOrderScreen;
