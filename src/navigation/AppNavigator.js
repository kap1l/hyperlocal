import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();

    const triggerHaptic = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <Tab.Navigator
            initialRouteName="Home"
            tabBarPosition="bottom"
            tabBar={({ state, descriptors, navigation, position }) => (
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: theme.tabBar,
                    borderTopColor: theme.glassBorder,
                    borderTopWidth: 1,
                    paddingBottom: insets.bottom,
                    height: 60 + insets.bottom,
                }}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label =
                            options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                    ? options.title
                                    : route.name;

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }

                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        };

                        const onLongPress = () => {
                            navigation.emit({
                                type: 'tabLongPress',
                                target: route.key,
                            });
                        };

                        let iconName;
                        if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
                        else if (route.name === 'Radar') iconName = isFocused ? 'map' : 'map-outline';
                        else if (route.name === 'Hourly') iconName = isFocused ? 'time' : 'time-outline';
                        else if (route.name === 'Alerts') iconName = isFocused ? 'notifications' : 'notifications-outline';
                        else if (route.name === 'Settings') iconName = isFocused ? 'settings' : 'settings-outline';

                        const color = isFocused ? theme.accent : theme.tabInactive;

                        return (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                testID={options.tabBarTestID}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}
                                key={index}
                            >
                                <Ionicons name={iconName} size={24} color={color} />
                                <Text style={{
                                    color: color,
                                    fontSize: 10,
                                    marginTop: 4,
                                    fontWeight: isFocused ? '700' : '500' // Bolder when active
                                }}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
            screenOptions={{
                swipeEnabled: true,
                animationEnabled: true,
            }}
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
