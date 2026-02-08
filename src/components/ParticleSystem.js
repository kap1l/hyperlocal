import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import { getAnimationConfig } from '../config/WeatherAnimationConfig';

const { width, height } = Dimensions.get('window');

const Particle = ({ config, delay, duration, startX }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(anim, {
                toValue: 1,
                duration: duration,
                delay: delay,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, height + 50],
    });

    const isSnow = config.type === 'snow';

    return (
        <Animated.View
            style={[
                styles.particle,
                {
                    backgroundColor: config.color,
                    width: config.width,
                    height: config.height,
                    borderRadius: isSnow ? config.width / 2 : 1,
                    left: startX,
                    transform: [{ translateY }],
                    opacity: config.opacity,
                },
            ]}
        />
    );
};

const ParticleSystem = ({ condition }) => {
    // 1. Get Benchmark Config
    const config = useMemo(() => getAnimationConfig(condition), [condition]);

    // 2. Memoize particles to avoid re-creation on every render 
    // (unless config changes significantly)
    const particles = useMemo(() => {
        if (!config || config.type === 'none') return [];
        return Array.from({ length: config.count }, (_, i) => {
            // Base duration: Rain ~1000ms, Snow ~4000ms
            const baseDuration = config.type === 'rain' ? 1000 : 4000;
            // Variance: +/- 50%
            const variance = Math.random() * (baseDuration * 0.5);
            // Apply Speed Factor from Benchmark
            const finalDuration = (baseDuration + variance) * config.speedFactor;

            return {
                id: i,
                startX: Math.random() * width,
                delay: Math.random() * 2000,
                duration: finalDuration
            };
        });
    }, [config]);

    if (!config || config.type === 'none') return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {particles.map(p => (
                <Particle
                    key={p.id}
                    config={config} // Pass specific stylings
                    startX={p.startX}
                    delay={p.delay}
                    duration={p.duration}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    particle: {
        position: 'absolute',
        top: 0,
    }
});

export default React.memo(ParticleSystem);
