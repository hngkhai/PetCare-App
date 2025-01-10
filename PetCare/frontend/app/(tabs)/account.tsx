import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import axios from "axios";

const PersonalAccount = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  const route = useRoute();
  const { formData } = route.params || {};

  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const userId = auth.currentUser?.uid;

      const fetchData = async () => {
        setLoading(true); // Set loading to true when focus effect runs

        if (formData) {
          // Process formData if it exists
          processFormData(formData);
        }

        if (userId) {
          await fetchUserData(userId);
        }
      };

      fetchData().finally(() => {
        //if (imageLoaded) 
          setLoading(false);
      });
    }, [formData, imageLoaded])
  );

  // Process formData and set state accordingly
  const processFormData = (formData) => {
    formData._parts.forEach(([fieldName, value]) => {
      switch (fieldName) {
        case "userName":
          const fullName = value.split(" ");
          setFirstName(fullName[0] || "");
          setLastName(fullName[1] || "");
          break;
        case "email":
          setEmail(value || "");
          break;
        case "address":
          setAddress(value || "");
          break;
        case "phoneNumber":
          setContactNumber(value || "");
          break;
        case "profilePicUrl":
          handleProfilePicUrl(value);
          break;
        default:
          break;
      }
    });
  };

  const handleProfilePicUrl = (value) => {
    if (Array.isArray(value) && value.length > 0) {
      const profilePic = value[0];

      if (typeof profilePic === "string") {
        setImageLoaded(false);
        setProfileImage(profilePic);
        // Set image loaded true immediately since it's a URL
        setImageLoaded(true);
      } else if (profilePic instanceof Blob) {
        const reader = new FileReader();
        
        const readBlobAsDataURL = () => {
          return new Promise((resolve, reject) => {
            reader.onloadend = () => {
              resolve(reader.result);
            };
            reader.onerror = () => {
              reject(new Error("Failed to read blob as data URL"));
            };
            reader.readAsDataURL(profilePic); // Start reading the Blob as a Data URL
          });
        };

        readBlobAsDataURL()
          .then((dataURL) => {
            setProfileImage(dataURL); // Set the image to the result of the reader
            // Do not set imageLoaded yet, wait for onLoad
          })
          .catch((error) => {
            console.error("Error loading image:", error);
            setImageLoaded(false); // Set to false if there's an error
          });
      }
    }
  };

  
  // Fetch user data based on userId
  const fetchUserData = async (userId) => {
    console.log("fetching user data: " + userId);
    
    try {
      const response = await axios.get(
        `http://10.91.144.154:8080/api/auth/getUserByUserId/${userId}`
      );
      const userData = response.data;
      // console.log(userData);
      const fullName = userData.userName
        ? userData.userName.split(" ")
        : ["", ""];

      // Update state with user data
      setFirstName(fullName[0]);
      setLastName(fullName[1] || "");
      setEmail(userData.email);
      setAddress(userData.address);
      setContactNumber(userData.phoneNumber);
      setProfileImage(
        `${userData.profilePicUrl.trim()}`
      );
    } catch (error) {
      console.error("Error fetching user data: ", error);
      Alert.alert("Error", "Failed to fetch user data.");
    }
  };

  // Handle Edit Profile
  const handleEditProfile = () => {
    navigation.navigate("account/edit_account", {
      firstName: firstName,
      lastName: lastName,
      email: email,
      address: address,
      contactNumber: String(contactNumber),
      profilePicUrl: profileImage,
    });
  };

  // Show the confirmation modal for logout
  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  // Confirm Logout
  const confirmLogout = async () => {
    setIsLogoutModalVisible(false); // Close any logout modal you may have
    try {
      await signOut(auth); // Attempt to sign out from Firebase
      Alert.alert("Success", "You have been logged out."); // Show success message
      navigation.navigate("auth/login"); // Navigate to login screen
    } catch (error) {
      console.error("Logout failed: ", error);
      Alert.alert("Error", error.message); // Show error message
    }
  };

  // Show loading screen or user data
  if (loading) {
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
          <Text style={styles.title}>Personal Account</Text>

          <View style={styles.profileSection}>
            <Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : require("../../assets/images/user_profile.png")
              }
              style={styles.profileImage}
              onLoad={() => setImageLoaded(true)} 
            />
            <View style={styles.nameContainer}>
              <Text style={styles.labelBold}>Name</Text>
              <Text style={styles.name}>
                {firstName} {lastName}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={styles.labelBold}>Email</Text>
              <Text style={styles.value}>{email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.labelBold}>Address</Text>
              <Text style={styles.value}>
                {address &&
                address.trim() !== "" &&
                address.trim().toUpperCase() !== "NA"
                  ? address
                  : "Please enter your address"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.labelBold}>Contact Number</Text>
              <Text style={styles.value}>
                {contactNumber && Number(contactNumber) > 0
                  ? contactNumber
                  : "Please enter your phone number"}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal for Logout Confirmation */}
      <Modal
        visible={isLogoutModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Log Out of Your Account?</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.noButton}
                onPress={() => setIsLogoutModalVisible(false)}
              >
                <Text style={styles.buttonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.yesButton}
                onPress={confirmLogout}
              >
                <Text style={styles.buttonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "flex-start",
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 30,
    marginTop: 80,
    alignSelf: "flex-start",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 40,
    marginRight: 15,
  },
  nameContainer: {
    flex: 1,
  },
  labelBold: {
    fontSize: 16,
    color: "#000",
    marginBottom: 5,
    fontWeight: "bold",
  },
  name: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: "#FFA500",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 40,
    alignSelf: "flex-start",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  infoSection: {
    width: "100%",
    marginBottom: 30,
  },
  infoItem: {
    marginBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: "#FFA500",
    paddingBottom: 10,
  },
  value: {
    fontSize: 16,
    color: "#000000",
  },
  logoutButton: {
    backgroundColor: "#FFA500",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    alignSelf: "center",
    width: "60%",
    marginTop: 0,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: 300,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  noButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 10,
    width: "45%",
    alignItems: "center",
  },
  yesButton: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 10,
    width: "45%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default PersonalAccount;
