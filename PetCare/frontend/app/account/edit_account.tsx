import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../firebase";

const EditAccount = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // Extract data from route.params or fallback to empty/default values
  const {
    firstName: initialFirstName = "",
    lastName: initialLastName = "",
    email: initialEmail = "",
    address: initialAddress = "",
    contactNumber: initialContactNumber = "",
    profilePicUrl: initialProfilePicUrl = "",
  } = route.params || {};

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail || auth.currentUser?.email);
  const [address, setAddress] = useState(initialAddress);
  const [contactNumber, setContactNumber] = useState(
    String(initialContactNumber)
  );
  const [isLoading, setIsLoading] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(initialProfilePicUrl);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Edit Personal Account",
      headerTransparent: true,
      headerStyle: {
        backgroundColor: "transparent",
      },
      headerTintColor: "black",
    });
  }, [navigation]);

  // Validation function to check user inputs
  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{8,15}$/;

    if (!firstName || !lastName || !email || !address || !contactNumber) {
      Alert.alert("Error", "All fields must be filled.");
      return false;
    }

    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return false;
    }

    if (!phoneRegex.test(contactNumber)) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return false;
    }

    return true;
  };

  // Function to pick an image from the user's gallery
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setImageUri(pickerResult.assets[0].uri);
    }
  };

  // Save changes and make the API call to the backend
  const handleSave = async () => {
    setIsLoading(true);

    if (validateInputs()) {
      const formData = new FormData();
      formData.append("userName", `${firstName} ${lastName}`);
      formData.append("phoneNumber", contactNumber);
      formData.append("address", address);

      // Append the selected thumbnail as a file
      const filename = imageUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append("profilePicUrl", {
        uri: imageUri,
        name: filename,
        type: type,
      });
      const userId = auth.currentUser?.uid;
      console.log(formData);
      try {
        const response = await axios.put(
          `http://10.91.144.154:8080/api/auth/updateUserDetails/${userId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        console.log(response.data);
        setIsLoading(false);
        if (response.status === 200) {
          Alert.alert("Success", "Account details updated successfully!");
          // Pass the updated data back to the PersonalAccount page
          navigation.navigate("account", { formData });
        } else {
          throw new Error("Failed to update account");
        }
      } catch (error) {
        setIsLoading(false);
        console.error("Error updating user data:", error);
        Alert.alert("Error", "Failed to update account details.");
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8675E6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.content}>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>
              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Profile Image */}
                <TouchableOpacity
                  style={styles.thumbnailContainer}
                  onPress={pickImage}
                >
                  {imageUri ? (
                    <Image
                      key={imageUri}
                      source={{ uri: imageUri }}
                      style={styles.thumbnailImage}
                    />
                  ) : (
                    <>
                      <Ionicons name="camera" size={60} color="#6B6B6B" />
                      <Text style={styles.uploadText}>
                        Upload Profile Image
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Name Input */}
                <Text style={styles.label}>Name</Text>
                <View style={styles.nameContainer}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholderTextColor="#9D9D9D"
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholderTextColor="#9D9D9D"
                  />
                </View>

                {/* Email Input */}
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  placeholderTextColor="#9D9D9D"
                  keyboardType="email-address"
                  editable={false}
                />

                {/* Address Input */}
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor="#9D9D9D"
                />

                {/* Contact Number Input */}
                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                  style={styles.input}
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  placeholderTextColor="#9D9D9D"
                  keyboardType="phone-pad"
                />

                {/* Save Button */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    marginTop: 50,
    alignItems: "flex-start",
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "left",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  input: {
    borderWidth: 2,
    borderColor: "#FF9F43",
    borderRadius: 25,
    paddingVertical: 7,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000000",
    marginBottom: 15,
  },
  halfInput: {
    width: "48%",
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#FF9F43",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
    width: "60%",
    alignSelf: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  thumbnailContainer: {
    backgroundColor: "#ececec",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
    height: 200,
    overflow: "hidden",
  },
  thumbnailImage: {
    backgroundColor: "#fff",
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B6B6B",
  },
});

export default EditAccount;
