import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

const GlassDropdown = ({ label, value, options, onSelect }) => {
    const { theme, mode } = useTheme();
    const [visible, setVisible] = useState(false);

    const selectedOption = options.find(o => o.value === value) || options[0];

    const handleSelect = (val) => {
        onSelect(val);
        setVisible(false);
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>

            <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.button, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}
                onPress={() => setVisible(true)}
            >
                <View style={styles.btnContent}>
                    <Ionicons name={selectedOption.icon} size={20} color={theme.accent} />
                    <Text style={[styles.btnText, { color: theme.text }]}>{selectedOption.label}</Text>
                </View>
                <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]}>
                    <SafeAreaView style={styles.safeArea}>
                        <TouchableOpacity style={styles.closeZone} onPress={() => setVisible(false)} />

                        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>Select Activity</Text>
                                <TouchableOpacity onPress={() => setVisible(false)}>
                                    <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={options}
                                keyExtractor={(item) => item.value}
                                contentContainerStyle={styles.listContent}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.optionItem,
                                            item.value === value && { backgroundColor: theme.accent + '20' }
                                        ]}
                                        onPress={() => handleSelect(item.value)}
                                    >
                                        <View style={[styles.iconBox, { backgroundColor: theme.cardBg }]}>
                                            <Ionicons name={item.icon} size={22} color={item.value === value ? theme.accent : theme.text} />
                                        </View>
                                        <View style={styles.optionTextContainer}>
                                            <Text style={[styles.optionLabel, { color: theme.text }]}>{item.label}</Text>
                                            <Text style={[styles.optionCategory, { color: theme.textSecondary }]}>{item.category}</Text>
                                        </View>
                                        {item.value === value && (
                                            <Ionicons name="checkmark" size={20} color={theme.accent} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    btnText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    safeArea: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    closeZone: {
        flex: 1,
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        maxHeight: '80%',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 40,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginBottom: 4,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    optionCategory: {
        fontSize: 12,
        marginTop: 2,
    }
});

export default GlassDropdown;
