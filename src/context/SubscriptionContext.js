import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { navigate, navigationRef } from '../navigation/NavigationService';
import { getTrialStatus } from '../services/TrialService';

const SubscriptionContext = createContext();

// RevenueCat keys are injected at build time via app.config.js + EAS Secrets.
// Set them with:
//   eas secret:create --scope project --name REVENUECAT_ANDROID_KEY --value <key>
//   eas secret:create --scope project --name REVENUECAT_IOS_KEY --value <key>
const API_KEYS = {
    google: Constants.expoConfig?.extra?.revenueCatAndroidKey || null,
};

const ENTITLEMENT_ID = 'pro';

export const SubscriptionProvider = ({ children }) => {
    const [isPro, setIsPro] = useState(false);
    const [isTrialing, setIsTrialing] = useState(false);
    const [trialDaysLeft, setTrialDaysLeft] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [offerings, setOfferings] = useState(null);
    const [packages, setPackages] = useState({ monthly: null, annual: null, lifetime: null });
    const [trialStatus, setTrialStatus] = useState({ isInTrial: false, daysUsed: 0, daysRemaining: 0, trialExpired: false });

    useEffect(() => {
        const setup = async () => {
            const status = await getTrialStatus();
            setTrialStatus(status);
            await initializeRevenueCat();
        };
        setup();
    }, []);

    const initializeRevenueCat = async () => {
        const apiKey = API_KEYS.google;

        // Gracefully degrade if no key is configured (purchases disabled, no Pro granted)
        if (!apiKey) {
            if (__DEV__) {
                console.warn('⚠️ RevenueCat: No API key found. Set REVENUECAT_ANDROID_KEY / REVENUECAT_IOS_KEY as EAS Secrets.');
            }
            setIsLoading(false);
            return;
        }

        try {
            if (__DEV__) {
                Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            }

            await Purchases.configure({ apiKey });

            const customerInfo = await Purchases.getCustomerInfo();
            updateSubscriptionStatus(customerInfo);

            const availableOfferings = await Purchases.getOfferings();
            setOfferings(availableOfferings.current);
            if (availableOfferings.current) {
                setPackages({
                    monthly: availableOfferings.current.monthly,
                    annual: availableOfferings.current.annual,
                    lifetime: availableOfferings.current.lifetime,
                });
            }

            Purchases.addCustomerInfoUpdateListener(updateSubscriptionStatus);

            setIsLoading(false);
        } catch (error) {
        Sentry.captureException(error);
            console.error('RevenueCat initialization error:', error);
            setIsLoading(false);
        }
    };

    const updateSubscriptionStatus = async (customerInfo) => {
        const entitlement = customerInfo?.entitlements?.active[ENTITLEMENT_ID];
        const hasProEntitlement = !!entitlement;
        const currentTrialStatus = await getTrialStatus();
        setIsPro(hasProEntitlement || currentTrialStatus.isInTrial);
        
        if (hasProEntitlement && entitlement.periodType === 'trial') {
            setIsTrialing(true);
            const daysLeft = Math.ceil((new Date(entitlement.expirationDate) - new Date()) / 86400000);
            setTrialDaysLeft(daysLeft > 0 ? daysLeft : 0);
        } else {
            setIsTrialing(false);
            setTrialDaysLeft(null);
        }

        if (__DEV__) {
            console.log('Subscription status:', hasProEntitlement ? 'PRO' : 'FREE', isTrialing ? `(Trial: ${trialDaysLeft} days left)` : '');
        }
    };

    const purchasePro = async (pkg = null) => {
        try {
            if (!offerings) {
                Alert.alert('Error', 'No subscription packages available. Please try again later.');
                return false;
            }

            if (!pkg) {
                pkg = packages?.annual 
                    || packages?.monthly 
                    || offerings.availablePackages[0];
            }

            if (!pkg) {
                Alert.alert('Error', 'Subscription package not found.');
                return false;
            }

            const { customerInfo } = await Purchases.purchasePackage(pkg);
            updateSubscriptionStatus(customerInfo);

            if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
                Alert.alert('Start your 30-day free trial', "You won't be charged until day 31. Cancel anytime.");
                return true;
            } else {
                Alert.alert(
                    'Purchase Successful',
                    'The purchase worked, but the "pro" entitlement wasn\'t granted. Please check your RevenueCat configuration.'
                );
                return true;
            }
        } catch (error) {
        Sentry.captureException(error);
            if (error.userCancelled) {
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
        Sentry.captureException(error);
            console.error('Restore error:', error);
            Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
        }
    };

    const presentPaywall = async () => {
        if (isPro) {
            Alert.alert('Already Subscribed', 'You already have OutWeather+!');
            return;
        }

        if (!offerings) {
            Alert.alert('Error', 'Unable to load subscription options.');
            return;
        }

        if (navigationRef.isReady()) {
            navigate('Paywall');
        } else {
            const pkg = packages?.monthly || offerings.availablePackages[0];
            if (pkg) {
                Alert.alert(
                    'Upgrade to OutWeather+',
                    `Get unlimited features for ${pkg.product.priceString}/month`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: `Subscribe (${pkg.product.priceString})`, onPress: () => purchasePro(pkg) }
                    ]
                );
            }
        }
    };

    const presentCustomerCenter = async () => {
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
        setIsPro(false);
        Alert.alert('Debug', 'Subscription status reset to FREE (local only)');
    };

    return (
        <SubscriptionContext.Provider value={{
            isPro,
            isTrialing,
            trialDaysLeft,
            isLoading,
            offerings,
            packages,
            trialStatus,
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
