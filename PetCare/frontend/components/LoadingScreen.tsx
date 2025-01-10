import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Easing } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

const LoadingScreen = () => {
    const colorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous animation between grey and black
        const animateColor = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(colorAnim, {
                        toValue: 1, // transition to black
                        duration: 1000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(colorAnim, {
                        toValue: 0, // transition back to grey
                        duration: 1000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animateColor();
    }, [colorAnim]);

    // Interpolate between grey and black
    const pawColor = colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["white", "black"], // Transition colors
    });

    return (
        <LinearGradient
            colors={['#FFA14B', '#FF7600', '#FF5900']} // Adjust these colors to match the gradient
            style={styles.container}
        >
            <Animated.Image
                source={require("../assets/images/logo.png")}
                style={[styles.pawIcon, { tintColor: pawColor }]}
            />
        </LinearGradient>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pawIcon: {
        width: 65,
        height: 65,
    },
});

export default LoadingScreen;
