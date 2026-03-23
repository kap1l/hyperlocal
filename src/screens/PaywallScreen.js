import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';
import GradientBackground from '../components/GradientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const PaywallScreen = ({ navigation }) => {
    const { packages, purchasePro, restorePurchases, isLoading } = useSubscription();
    const { theme } = useTheme();
    const [purchasing, setPurchasing] = useState(false);

    const handlePurchase = async (pkg) => {
        if (!pkg) return;
        setPurchasing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await purchasePro(pkg);
        setPurchasing(false);
        if (success) {
            navigation.goBack();
        }
    };

    const renderCard = (pkg, title, subtitle, isBestValue = false) => {
        if (!pkg) return null;
        return (
            <TouchableOpacity 
                style={[styles.card, { borderColor: isBestValue ? theme.accent : theme.glassBorder, backgroundColor: theme.cardBg }]}
                onPress={() => handlePurchase(pkg)}
                disabled={purchasing}
            >
                {isBestValue && (
                    <View style={[styles.bestValueBadge, { backgroundColor: theme.accent }]}>
                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                )}
                <View style={styles.cardContent}>
                    <View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
                        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
                    </View>
                    <Text style={[styles.priceText, { color: theme.text }]}>{pkg.product.priceString}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} disabled={purchasing} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.hero}>
                    <Ionicons name="star" size={50} color={theme.accent} style={{ marginBottom: 20 }} />
                    <Text style={[styles.title, { color: theme.text }]}>Unlock OutWeather+</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Get unlimited spots, condition alerts, ad-free experience, and advanced activity tracking.
                    </Text>
                </View>
                
                <View style={styles.features}>
                    {['Search any city globally', 'Unlimited condition alerts', 'Unlimited saved spots', 'Detailed Activity History', 'Weekly Reports', 'No Ads'].map((feat, i) => (
                        <View key={i} style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={20} color={theme.success || '#10b981'} />
                            <Text style={[styles.featureText, { color: theme.text }]}>{feat}</Text>
                        </View>
                    ))}
                </View>

                {isLoading || purchasing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.accent} />
                        <Text style={{color: theme.textSecondary, marginTop: 10}}>
                            {purchasing ? 'Processing...' : 'Loading packages...'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.cardsContainer}>
                        {renderCard(packages?.annual, 'Annual', 'Includes 30-day Free Trial', true)}
                        {renderCard(packages?.monthly, 'Monthly', 'Includes 30-day Free Trial')}
                        {renderCard(packages?.lifetime, 'Lifetime', 'Pay once, yours forever')}
                    </View>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => restorePurchases()}>
                        <Text style={[styles.footerLink, { color: theme.textSecondary }]}>Restore Purchases</Text>
                    </TouchableOpacity>
                    <View style={styles.legalRow}>
                        <TouchableOpacity onPress={(() => Linking.openURL('https://outweather.app/terms'))}>
                            <Text style={[styles.legalText, { color: theme.textSecondary }]}>Terms of Service</Text>
                        </TouchableOpacity>
                        <Text style={{ color: theme.textSecondary }}> • </Text>
                        <TouchableOpacity onPress={(() => Linking.openURL('https://outweather.app/privacy'))}>
                            <Text style={[styles.legalText, { color: theme.textSecondary }]}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    header: { alignItems: 'flex-start', paddingTop: 10 },
    closeBtn: { padding: 5 },
    hero: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 16, textAlign: 'center', marginHorizontal: 20, lineHeight: 22 },
    features: { marginBottom: 30, paddingHorizontal: 20 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    featureText: { fontSize: 16, marginLeft: 10, fontWeight: '500' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    cardsContainer: { gap: 15 },
    card: { borderWidth: 2, borderRadius: 16, padding: 20, position: 'relative' },
    bestValueBadge: { position: 'absolute', top: -12, right: 20, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
    bestValueText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    cardSubtitle: { fontSize: 13 },
    priceText: { fontSize: 20, fontWeight: 'bold' },
    footer: { marginTop: 'auto', marginBottom: 20, alignItems: 'center', gap: 15 },
    footerLink: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
    legalRow: { flexDirection: 'row', alignItems: 'center' },
    legalText: { fontSize: 12, textDecorationLine: 'underline' }
});

export default PaywallScreen;
