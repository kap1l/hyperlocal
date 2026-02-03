import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLLAPSE_STATE_KEY = '@collapsed_sections';

const CollapsibleSection = ({
    title,
    icon,
    children,
    defaultCollapsed = false,
    sectionId,
    accentColor
}) => {
    const { theme } = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const rotateAnim = useRef(new Animated.Value(defaultCollapsed ? 1 : 0)).current;

    // Load saved state
    useEffect(() => {
        loadCollapseState();
    }, []);

    const loadCollapseState = async () => {
        try {
            const saved = await AsyncStorage.getItem(COLLAPSE_STATE_KEY);
            if (saved) {
                const states = JSON.parse(saved);
                if (states[sectionId] !== undefined) {
                    setIsCollapsed(states[sectionId]);
                    rotateAnim.setValue(states[sectionId] ? 1 : 0);
                }
            }
        } catch (e) { }
    };

    const saveCollapseState = async (collapsed) => {
        try {
            const saved = await AsyncStorage.getItem(COLLAPSE_STATE_KEY);
            const states = saved ? JSON.parse(saved) : {};
            states[sectionId] = collapsed;
            await AsyncStorage.setItem(COLLAPSE_STATE_KEY, JSON.stringify(states));
        } catch (e) { }
    };

    const toggleCollapse = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        const newState = !isCollapsed;
        setIsCollapsed(newState);
        saveCollapseState(newState);

        Animated.timing(rotateAnim, {
            toValue: newState ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-90deg'],
    });

    const color = accentColor || theme.accent;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.header, { borderBottomColor: isCollapsed ? 'transparent' : theme.glassBorder }]}
                onPress={toggleCollapse}
                activeOpacity={0.7}
            >
                <View style={styles.titleRow}>
                    {icon && (
                        <Ionicons name={icon} size={18} color={color} style={styles.icon} />
                    )}
                    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                    <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
                </Animated.View>
            </TouchableOpacity>

            {!isCollapsed && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    content: {
        // Content gets the children
    },
});

export default CollapsibleSection;
