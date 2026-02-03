import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const SubscriptionContext = createContext();

// RevenueCat API Keys (replace with your actual keys from RevenueCat dashboard)
const API_KEYS = {
    apple: 'appl_YOUR_IOS_KEY_HERE',  // Replace with your iOS key
    google: 'test_oSAJeVHcbmnrWgtsXqiomeaDNer'  // Your Android key
};

const ENTITLEMENT_ID = 'pro';

export const SubscriptionProvider = ({ children }) => {
    const [isPro, setIsPro] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [offerings, setOfferings] = useState(null);

    useEffect(() => {
        initializeRevenueCat();
    }, []);

    const initializeRevenueCat = async () => {
        try {
            // Set log level for debugging
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);

            // Configure RevenueCat
            const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;

            // Check if using placeholder keys
            if (apiKey.includes('YOUR_') || apiKey.includes('_KEY_HERE')) {
                console.warn('⚠️ RevenueCat: Using placeholder API keys. Purchases will not work.');
                console.warn('Please update API_KEYS in SubscriptionContext.js with your actual keys.');
                setIsLoading(false);
                return;
            }

            await Purchases.configure({ apiKey });

            // Get current customer info
            const customerInfo = await Purchases.getCustomerInfo();
            updateSubscriptionStatus(customerInfo);

            // Get available offerings
            const availableOfferings = await Purchases.getOfferings();
            setOfferings(availableOfferings.current);

            // Listen for purchase updates
            Purchases.addCustomerInfoUpdateListener(updateSubscriptionStatus);

            setIsLoading(false);
        } catch (error) {
            console.error('RevenueCat initialization error:', error);
            setIsLoading(false);
        }
    };

    const updateSubscriptionStatus = async (customerInfo) => {
        const hasProEntitlement = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
        setIsPro(hasProEntitlement);
        console.log('Subscription status:', hasProEntitlement ? 'PRO' : 'FREE');
        try {
            await AsyncStorage.setItem('@is_pro_user', hasProEntitlement ? 'true' : 'false');
        } catch (e) {
            console.error('Failed to save subscription status:', e);
        }
    };

    const purchasePro = async () => {
        try {
            if (!offerings) {
                Alert.alert('Error', 'No subscription packages available. Please try again later.');
                return false;
            }

            // Get the monthly package
            const monthlyPackage = offerings.availablePackages.find(
                pkg => pkg.identifier === 'monthly' || pkg.identifier === '$rc_monthly'
            );

            if (!monthlyPackage) {
                Alert.alert('Error', 'Monthly subscription not found.');
                return false;
            }

            // Make the purchase
            const { customerInfo } = await Purchases.purchasePackage(monthlyPackage);
            updateSubscriptionStatus(customerInfo);

            if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
                Alert.alert('Success!', 'Welcome to OutWeather+! 🎉');
                return true;
            } else {
                console.log('Purchase successful but no entitlement. Entitlements:', customerInfo.entitlements.active);
                Alert.alert(
                    'Purchase Successful',
                    'The purchase worked, but the "pro" entitlement (OutWeather+) wasn\'t granted. Please check your RevenueCat configuration.'
                );
                return true;
            }

            return false;
        } catch (error) {
            if (error.userCancelled) {
                console.log('User cancelled purchase');
                return false;
            }

            console.error('Purchase error:', error);
            Alert.alert('Purchase Failed', error.message || 'An error occurred. Please try again.');
            return false;
        }
    };

    const restorePurchases = async () => {
        try {
            const customerInfo = await Purchases.restorePurchases();
            updateSubscriptionStatus(customerInfo);

            if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
                Alert.alert('Success', 'Your subscription has been restored!');
            } else {
                Alert.alert('No Purchases Found', 'No active subscriptions to restore.');
            }
        } catch (error) {
            console.error('Restore error:', error);
            Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
        }
    };

    const presentPaywall = async () => {
        // This is a simple implementation - you can customize the paywall UI
        if (isPro) {
            Alert.alert('Already Subscribed', 'You already have OutWeather+!');
            return;
        }

        if (!offerings) {
            Alert.alert('Error', 'Unable to load subscription options.');
            return;
        }

        const monthlyPackage = offerings.availablePackages.find(
            pkg => pkg.identifier === 'monthly' || pkg.identifier === '$rc_monthly'
        );

        if (monthlyPackage) {
            const price = monthlyPackage.product.priceString;
            Alert.alert(
                'Upgrade to OutWeather+',
                `Get unlimited features for ${price}/month\n\n✓ Search any city\n✓ No ads\n✓ Advanced forecasts\n✓ Priority support`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: `Subscribe (${price})`, onPress: purchasePro }
                ]
            );
        }
    };

    const presentCustomerCenter = async () => {
        // Simple customer center - you can enhance this
        if (!isPro) {
            Alert.alert('Not Subscribed', 'You don\'t have an active subscription.');
            return;
        }

        Alert.alert(
            'Manage Subscription',
            'To manage your subscription, go to your device settings:\n\niOS: Settings → [Your Name] → Subscriptions\nAndroid: Play Store → Menu → Subscriptions',
            [{ text: 'OK' }]
        );
    };

    const debugResetSubscription = async () => {
        // For testing only - resets local state
        setIsPro(false);
        Alert.alert('Debug', 'Subscription status reset to FREE (local only)');
    };

    return (
        <SubscriptionContext.Provider value={{
            isPro,
            isLoading,
            offerings,
            purchasePro,
            presentPaywall,
            presentCustomerCenter,
            restorePurchases,
            debugResetSubscription
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
