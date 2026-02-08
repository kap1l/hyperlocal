import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = '@onboarding_complete';

const SLIDES = [
    {
        icon: 'sunny-outline',
        title: 'Welcome to OutWeather',
        subtitle: 'Weather designed for outdoor activities',
        description: 'Get hyperlocal forecasts tailored to what YOU want to do outside.',
        color: '#f59e0b',
    },
    {
        icon: 'fitness-outline',
        title: 'Activity-First Forecasts',
        subtitle: 'Not just weather — safety scores',
        description: 'We analyze temperature, wind, rain, UV, and more to tell you if it\'s safe to walk, run, cycle, or hike.',
        color: '#22c55e',
    },
    {
        icon: 'time-outline',
        title: 'Find the Best Time',
        subtitle: 'Our killer feature ⭐',
        description: 'Tap "Find Best Time" to discover the optimal window for your activity today. No more guessing!',
        color: '#3b82f6',
        highlight: true,
    },
    {
        icon: 'notifications-outline',
        title: 'Smart Alerts',
        subtitle: 'Rain starting? We\'ll tell you.',
        description: 'Get notified when conditions change — rain starting in 10 minutes, or temperature dropping fast.',
        color: '#8b5cf6',
    },
    {
        icon: 'rocket-outline',
        title: 'You\'re All Set!',
        subtitle: 'Start exploring',
        description: 'Swipe through the tabs to discover radar, hourly forecasts, and more. Enjoy!',
        color: '#ec4899',
    },
];

const OnboardingOverlay = ({ onComplete }) => {
    const { theme } = useTheme();
    const [visible, setVisible] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [currentSlide]);

    const checkOnboardingStatus = async () => {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!completed) {
            setVisible(true);
        }
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        fadeAnim.setValue(0);

        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        completeOnboarding();
    };

    const completeOnboarding = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        setVisible(false);
        onComplete?.();
    };

    if (!visible) return null;

    const slide = SLIDES[currentSlide];
    const isLast = currentSlide === SLIDES.length - 1;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            statusBarTranslucent
        >
            <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {/* Skip Button */}
                    {!isLast && (
                        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                            <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
                        </TouchableOpacity>
                    )}

                    {/* Icon */}
                    <View style={[styles.iconCircle, { backgroundColor: slide.color + '20', borderColor: slide.color }]}>
                        <Ionicons name={slide.icon} size={64} color={slide.color} />
                    </View>

                    {/* Highlight Badge */}
                    {slide.highlight && (
                        <View style={[styles.highlightBadge, { backgroundColor: slide.color }]}>
                            <Text style={styles.highlightText}>KILLER FEATURE</Text>
                        </View>
                    )}

                    {/* Title */}
                    <Text style={[styles.title, { color: '#fff' }]}>{slide.title}</Text>
                    <Text style={[styles.subtitle, { color: slide.color }]}>{slide.subtitle}</Text>
                    <Text style={[styles.description, { color: 'rgba(255,255,255,0.7)' }]}>{slide.description}</Text>

                    {/* Progress Dots */}
                    <View style={styles.dotsContainer}>
                        {SLIDES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: index === currentSlide ? slide.color : 'rgba(255,255,255,0.3)',
                                        width: index === currentSlide ? 24 : 8,
                                    }
                                ]}
                            />
                        ))}
                    </View>

                    {/* Next Button */}
                    <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: slide.color }]}
                        onPress={handleNext}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.nextBtnText}>
                            {isLast ? 'Get Started' : 'Next'}
                        </Text>
                        <Ionicons
                            name={isLast ? 'checkmark' : 'arrow-forward'}
                            size={20}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    skipBtn: {
        position: 'absolute',
        top: -80,
        right: 0,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 2,
    },
    highlightBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 10,
    },
    highlightText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        maxWidth: 280,
        marginBottom: 40,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 40,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});

export default OnboardingOverlay;
