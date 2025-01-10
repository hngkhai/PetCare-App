import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import Icon from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome icons

const RegistrationForm: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility

  const navigation = useNavigation(); // Hook for navigation

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all the fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Password and confirm password do not match.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumeric || !hasSpecial) {
      Alert.alert(
        "Error",
        "Password must contain at least one uppercase letter, one lowercase letter, one numeric character, and one special character."
      );
      return;
    }

    const userData = {
      userName: `${firstName} ${lastName}`,
      email: email,
      password: confirmPassword,
      status: "normal",
      phoneNumber: 0,
      address: "NA",
    };

    try {
      const response = await axios.post(
        "http://10.91.144.154:8080/api/auth/register",
        userData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        if (response.data === "Email already in use.") {
          Alert.alert("Error", "Email already in use!");
        } else {
          Alert.alert("Success", "User created successfully!");
          setFirstName("");
          setLastName("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          navigation.navigate("auth/login");
        }
      } else {
        Alert.alert("Error", "User creation failed. Please try again.");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        switch (error.response.data.message) {
          case "WEAK_PASSWORD":
            Alert.alert("Error", "The password is too weak.");
            break;
          case "EMAIL_ALREADY_IN_USE":
            Alert.alert("Error", "The email is already in use.");
            break;
          default:
            Alert.alert("Error", "An error occurred. Please try again.");
            break;
        }
      } else {
        Alert.alert("Error", "An error occurred. Please try again.");
      }
    }
  };

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.pageContainer}>
            <View style={styles.pawContainer}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.pawImage}
              />
            </View>

            <Text style={styles.header}>Register</Text>

            <TouchableOpacity onPress={() => navigation.navigate("auth/login")}>
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text style={styles.loginLink}>Login</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Name</Text>
            <View style={styles.nameContainer}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="First"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#9D9D9D"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Last"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#9D9D9D"
              />
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="example@abc.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#9D9D9D"
            />

            <Text style={styles.label}>Password</Text>
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
                onPress={() => setShowPassword(prev => !prev)}
              >
                <Icon
                  name={showPassword ? "eye-slash" : "eye"}
                  size={20}
                  color="#000"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
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
                onPress={() => setShowConfirmPassword(prev => !prev)}
              >
                <Icon
                  name={showConfirmPassword ? "eye-slash" : "eye"}
                  size={20}
                  color="#000"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleSubmit}
              >
                <Text style={styles.registerButtonText}>Register</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>
              By signing up, you are agreeing to our Terms of Service and
              Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "flex-start",
    padding: 20,
    paddingTop: 100,
  },
  pawContainer: {
    alignItems: "flex-start",
    marginBottom: 10,
  },
  pawImage: {
    width: 60,
    height: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 5,
    color: "#000",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    marginLeft: 5,
  },
  loginText: {
    textAlign: "left",
    color: "#333",
    fontSize: 14,
    marginBottom: 20,
  },
  loginLink: {
    color: "#FF9F43",
    fontWeight: "bold",
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#FF9F43",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    color: "#000",
  },
  halfInput: {
    width: "48%",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FF9F43",
    borderRadius: 25,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000",
  },
  eyeButton: {
    padding: 10,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 15,
    alignItems: "center",
  },
  registerButton: {
    backgroundColor: "#FF9F43",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    width: 200,
    alignSelf: "center",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: 20,
    color: "#9D9D9D",
  },
});

export default RegistrationForm;

