import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Share as NativeShare } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const ShareCard = ({ children, style }) => {
    const viewRef = useRef();
    const { theme } = useTheme();

    const handleShare = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const uri = await viewRef.current.capture();
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                NativeShare.share({ url: uri });
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={[styles.container, style]}>
            <ViewShot ref={viewRef} options={{ format: 'png', quality: 0.9 }} style={{ flex: 1, backgroundColor: 'transparent' }}>
                {children}
            </ViewShot>
            <TouchableOpacity onPress={handleShare} style={[styles.shareBtn, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                <Ionicons name="share-outline" size={18} color={theme.accent} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    shareBtn: {
        position: 'absolute',
        top: 15,
        right: 30, // Inside the card margins
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10
    }
});

export default ShareCard;
