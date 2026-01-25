import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import RadarScreen from '../screens/RadarScreen';
import HourlyScreen from '../screens/HourlyScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createMaterialTopTabNavigator();

const AppNavigator = () => {
    const { theme } = useTheme();

    const triggerHaptic = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <Tab.Navigator
            initialRouteName="Home"
            tabBarPosition="bottom"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color }) => {
                    let iconName;
                    // Material Top Tabs doesn't pass 'size' by default, pick one
                    const size = 24;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Radar') iconName = focused ? 'map' : 'map-outline';
                    else if (route.name === 'Hourly') iconName = focused ? 'time' : 'time-outline';
                    else if (route.name === 'Alerts') iconName = focused ? 'notifications' : 'notifications-outline';
                    else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.accent,
                tabBarInactiveTintColor: theme.tabInactive,
                tabBarStyle: {
                    backgroundColor: theme.tabBar,
                    borderTopColor: theme.glassBorder, // Use our theme border
                    borderTopWidth: 1, // Add explicit border since MaterialTopTabs doesn't have shadow/elevation the same way
                    height: 60, // Fixed height to accommodate safe area or look like standard bottom tab
                    paddingBottom: 5, // slight padding
                    elevation: 0, // Remove default shadow
                    shadowOpacity: 0,
                },
                tabBarIndicatorStyle: {
                    backgroundColor: theme.accent,
                    height: 3,
                    top: 0, // Place indicator at top of the bar (standard for "bottom" tabs is usually no indicator or top)
                },
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 10,
                    textTransform: 'none',
                    fontWeight: '600',
                    marginTop: -5,
                },
                tabBarItemStyle: {
                    paddingVertical: 5,
                },
                swipeEnabled: true, // ENABLE SWIPE
                animationEnabled: true,
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                listeners={{ tabPress: triggerHaptic }}
            />
            <Tab.Screen
                name="Radar"
                component={RadarScreen}
                listeners={{ tabPress: triggerHaptic }}
            />
            <Tab.Screen
                name="Hourly"
                component={HourlyScreen}
                listeners={{ tabPress: triggerHaptic }}
            />
            <Tab.Screen
                name="Alerts"
                component={AlertsScreen}
                listeners={{ tabPress: triggerHaptic }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                listeners={{ tabPress: triggerHaptic }}
            />
        </Tab.Navigator>
    );
};

export default AppNavigator;
