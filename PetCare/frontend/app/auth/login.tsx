import React, { useState, useLayoutEffect, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../../firebase"; // Import your Firebase config
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import Icon from "react-native-vector-icons/FontAwesome"; // Import FontAwesome icons

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false); // State for password visibility

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Logging in: ", user);
      if (user) {
        navigation.navigate("index"); // Navigate to index after login
      } 
      
    });

    return () => unsubscribe();
  }, [navigation]);

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken();

      const response = await axios.post(
        "http://10.91.144.154:8080/api/auth/login",
        {
          idToken: idToken,
        }
      );

      // Alert.alert("Success", response.data);
      navigation.navigate("(tabs)");
    } catch (error) {
      switch (error.code) {
        case "auth/user-not-found":
          Alert.alert("Error", "Email does not exist!");
          break;
        case "auth/invalid-email":
          Alert.alert("Error", "The email address is not valid.");
          break;
        case "auth/invalid-credential":
          Alert.alert("Error", "Incorrect email/password. Please try again.");
          break;
        case "auth/wrong-password":
          Alert.alert("Error", "Incorrect password. Please try again.");
          break;
        default:
          Alert.alert("Error", error.message);
          break;
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.content}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
            />
            <Text style={styles.welcomeText}>Welcome!</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="example@abc.com"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#9D9D9D"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  secureTextEntry={!showPassword} // Toggle secureTextEntry based on showPassword
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#9D9D9D"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)} // Toggle the showPassword state
                >
                  <Icon
                    name={showPassword ? "eye-slash" : "eye"} // Display eye-slash when password is visible
                    size={20}
                    color="#000000" // Eye icon in black
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate("auth/reset_password")}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("auth/register")}
              >
                <Text style={styles.signUpLink}>Sign Up</Text>
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
    backgroundColor: "#FFFFFF",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 20,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#000000",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000000",
  },
  input: {
    borderWidth: 2,
    borderColor: "#FF9F43",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000000",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF9F43",
    borderRadius: 25,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000000",
  },
  eyeButton: {
    padding: 10,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: "#FF9F43",
    fontWeight: "bold",
  },
  loginButton: {
    backgroundColor: "#FF9F43",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signUpText: {
    fontSize: 14,
    color: "#000000",
  },
  signUpLink: {
    color: "#FF9F43",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default LoginForm;
