import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking'; // Import Expo Linking to handle deep links
import { getAuth, confirmPasswordReset } from 'firebase/auth'; // Firebase Auth
import Icon from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome icons

const CreateNewPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null); // For the reset token
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
      headerTransparent: true,
      headerStyle: {
        backgroundColor: 'transparent',
      },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  useEffect(() => {
    const getResetToken = async () => {
      const initialUrl = await Linking.getInitialURL();
      console.log('Initial URL:', initialUrl);

      if (initialUrl) {
        const { queryParams } = Linking.parse(initialUrl);
        if (queryParams && queryParams.oobCode) {
          console.log('Reset token found:', queryParams.oobCode);
          setResetToken(queryParams.oobCode);
        } else {
          Alert.alert('Error', 'No reset token found in the URL');
        }
      }
    };

    getResetToken();

    const urlListener = Linking.addEventListener('url', (event) => {
      console.log('URL changed to:', event.url);
      const { queryParams } = Linking.parse(event.url);
      if (queryParams && queryParams.oobCode) {
        setResetToken(queryParams.oobCode);
      }
    });

    return () => {
      urlListener.remove();
    };
  }, []);

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // At least 8 characters, 1 letter, and 1 number

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }

    if (!passwordRegex.test(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long and contain at least one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match. Please re-enter.');
      return;
    }

    if (!resetToken) {
      Alert.alert('Error', 'Invalid reset token. Please try again.');
      return;
    }

    try {
      const auth = getAuth();
      await confirmPasswordReset(auth, resetToken, password);
      Alert.alert('Success', 'Password has been reset. Please log in with your new password.');
      navigation.navigate('(tabs)'); // Adjust this based on your app's structure
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.content}>
              <Text style={styles.header}>Create New Password</Text>
              
              <Text style={styles.instructions}>
                Your new password must be different from the previously used password and meet the following criteria: at least 8 characters, 1 letter, and 1 number.
              </Text>

              {/* Password Input */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#9D9D9D"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholderTextColor="#9D9D9D"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <Icon name={showConfirmPassword ? 'eye-slash' : 'eye'} size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
                <Text style={styles.resetButtonText}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#000',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF9F43',
    borderRadius: 8,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    padding: 10,
  },
  resetButton: {
    backgroundColor: '#FF9F43',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateNewPassword;




