import React, { useState, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Import navigation hook
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const ResetPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const navigation = useNavigation(); // Initialize navigation

    useLayoutEffect(() => {
        navigation.setOptions({
          title: "",
          headerTransparent: true,
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerTintColor: "#fff",
        });
    }, [navigation]);

    // Simulate a list of emails in the database
    const validEmails = ['john@example.com', 'jane@example.com', 'test@domain.com'];

    const handleReset = async () => {
        const auth = getAuth(); // Initialize Firebase auth
    
        // Check if the email field is empty
        if (!email) {
            Alert.alert("Error", "Please enter your email address.");
            return;
        }
    
        try {
            // Use Firebase's `sendPasswordResetEmail` function to send reset instructions
            await sendPasswordResetEmail(auth, email);
            Alert.alert("Success", "Reset instructions sent to: " + email);
            navigation.navigate("auth/reset_password_email"); // Navigate to check email screen
        } catch (error) {
            // Handle different Firebase errors
            switch (error.code) {
                case "auth/user-not-found":
                    Alert.alert("Error", "Email does not exist!");
                    break;
                case "auth/invalid-email":
                    Alert.alert("Error", "The email address is not valid.");
                    break;
                default:
                    Alert.alert("Error", error.message); // Generic error message
                    break;
            }
        }
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={styles.container}>
                        <View style={styles.card}>
                            {/* Header Section with Logo and Back Button */}
                            <View style={styles.headerContainer}>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                    <Image source={require('../../assets/images/back_button.png')} style={styles.backIcon} />
                                </TouchableOpacity>
                                <Text style={styles.backButtonText}>Back</Text>
                            </View>

                            <Text style={styles.header}>Reset Password</Text>
                            <Text style={styles.instructions}>
                                Enter the email associated with your account and we’ll send an email with instructions to reset your password.
                            </Text>

                            {/* Email Address Label */}
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="example@abc.com" // Placeholder text
                                placeholderTextColor="#9D9D9D" // Placeholder text color
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />

                            <TouchableOpacity style={styles.button} onPress={handleReset}>
                                <Text style={styles.buttonText}>Send Instructions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // Set background color to white
        justifyContent: 'flex-start', // Start aligning content from the top
        padding: 20, // Add padding around the edges
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        width: '100%',  // Use full width
        padding: 20,
        elevation: 5,
        marginTop: 60, // Add margin from the top
    },
    scrollContainer: {
        paddingBottom: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 80,
    },
    backIcon: {
        width: 24,
        height: 24,
        marginRight: 10, // Space between logo and back text
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'left', // Align text to the left
        marginBottom: 10,
        color: '#000',
    },
    instructions: {
        fontSize: 16,
        textAlign: 'left', // Align text to the left
        marginBottom: 20,
        color: '#000',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold', // Bold text for the label
        textAlign: 'left',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#fff', // Set background color to white
        borderWidth: 1,
        borderColor: '#FF9F43',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#FF9F43',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginBottom: 20,
    },
    backButtonText: {
        color: '#000', // Black color for the back button
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ResetPassword;
