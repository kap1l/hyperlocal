import React, { useRef } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import OutdoorComfortCard from './OutdoorComfortCard';
import AirQualityCard from './AirQualityCard';
import MoonPhaseCard from './MoonPhaseCard';
import PollenCard from './PollenCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85; // 85% of screen width to show peek of next card
const SNAP_INTERVAL = CARD_WIDTH + 16; // Card width + margin

const ConditionsCarousel = ({ weather, currently }) => {
    const { theme } = useTheme();
    const scrollX = useRef(new Animated.Value(0)).current;

    // We need to modify standard cards to fit in carousel:
    // 1. Remove marginHorizontal (Layout handles spacing)
    // 2. Set strict width
    const carouselStyles = {
        width: CARD_WIDTH,
        marginHorizontal: 8,
        flex: 1, // Ensure content fills height
    };

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={SNAP_INTERVAL}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                {/* Spacer for left alignment */}
                <View style={{ width: 8 }} />

                <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
                    <OutdoorComfortCard currently={currently} />
                </View>

                <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
                    <AirQualityCard />
                </View>

                <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
                    <MoonPhaseCard />
                </View>

                <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
                    <PollenCard />
                </View>

                {/* Spacer for right alignment */}
                <View style={{ width: 8 }} />
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    scrollContent: {
        alignItems: 'stretch',
        paddingVertical: 10,
    },
    cardWrapper: {
        marginHorizontal: 8,
        // Hack: The child cards have internal margins. We might need to override styles via props if possible,
        // or just accept the double margin for now. The internal cards have marginHorizontal: 16.
        // If we wrap them in a view of fixed width, they will stretch to fill it minus their own margins.
    }
});

export default ConditionsCarousel;
