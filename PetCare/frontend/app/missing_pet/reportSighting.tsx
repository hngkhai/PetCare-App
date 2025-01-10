import React, { useState, useLayoutEffect, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Float } from "react-native/Libraries/Types/CodegenTypes";

const AddSightingReport: React.FC = () => {
  const [form, setForm] = useState({
    lastSeenLocation: "",
    lastSeenDate: "",
    lastSeenTime: "",
    description: "",
    pickedDate: new Date(),
    pickedTime: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Loading state

  const route = useRoute();
  const { petId, userId } = route.params;

  const [displayDate, setDisplayDate] = useState("");
  const [displayTime, setDisplayTime] = useState("");

  const navigation = useNavigation();
  const [location, setLocation] = useState<{
    lat: number;
    long: number;
  } | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Report Sighting" });
  }, [navigation]);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location permission is required to proceed."
      );
      return;
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    setLocation({
      lat: currentLocation.coords.latitude,
      long: currentLocation.coords.longitude,
    });
  };

  const getCoordinatesByPostalCode = async (postalCode: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&country=Singapore&postalcode=${encodeURIComponent(
          postalCode
        )}`,
        {
          headers: {
            "User-Agent": "PetCareApp/1.0",
          },
        }
      );

      const data = await response.json(); // Only call .json() once

      if (data.length > 0) {
        const { lat, lon } = data[0];
        // Format latitude and longitude as per your requirement
        return [
          `${parseFloat(lat).toFixed(4)}° N`, // Convert to the desired format
          `${parseFloat(lon).toFixed(4)}° E`,
        ];
      } else {
        Alert.alert("Error", "No location found for this postal code.");
        return null;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      Alert.alert("Error", "Could not retrieve location.");
      return null;
    }
  };

  const handleConfirmDate = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || form.pickedDate;
    const localDate = new Date(currentDate.getTime() + 8 * 60 * 60 * 1000); // Adding 8 hours in milliseconds
    const displayDate = `${localDate.getDate().toString().padStart(2, "0")}/${(
      localDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${localDate.getFullYear()}`;

    setDisplayDate(displayDate);
    setShowDatePicker(false);
    setForm({
      ...form,
      lastSeenDate: localDate.toISOString().split("T")[0], // Set date as 'YYYY-MM-DD'
      pickedDate: localDate,
    });
  };

  const handleConfirmTime = (event: any, selectedTime: Date | undefined) => {
    const currentTime = selectedTime || form.pickedTime;

    setShowTimePicker(false);

    // Use getHours() and getMinutes() directly (no timezone conversions)
    const hours = currentTime.getHours(); // Already in UTC+8
    const minutes = currentTime.getMinutes();

    // Convert to 12-hour format
    const formattedHours = hours % 12 || 12; // Convert '0' hour to '12' for 12 AM
    const ampm = hours >= 12 ? "PM" : "AM"; // Determine AM/PM

    // Format time as 'h:mm AM/PM'
    const displayTime = `${formattedHours}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`; // Example: 1:35 PM

    // Set the display and form values
    setDisplayTime(displayTime);

    setShowTimePicker(false);

    // Store the raw time in 'HH:mm:ss' format
    const lastSeenTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`;

    setForm({
      ...form,
      lastSeenTime: lastSeenTime, // Store as 'HH:mm:ss'
      pickedTime: currentTime, // Keep the original Date object
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setForm({ ...form, [field]: value });
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (pickerResult.canceled) {
      return;
    }

    setImageUri(pickerResult.assets[0].uri);
  };

  const handleConfirm = async () => {
    const { lastSeenLocation, lastSeenDate, lastSeenTime, description } = form;

    // Check if all mandatory fields are filled
    if (
      !lastSeenLocation ||
      !lastSeenDate ||
      !lastSeenTime ||
      !description ||
      !imageUri
    ) {
      Alert.alert("Error", "Please fill in all the fields.");
      return;
    }
    setLoading(true); // Set loading to true

    const coordinates = await getCoordinatesByPostalCode(form.lastSeenLocation);

    if (coordinates) {
      // Combine date and time into a valid UTC Date object
      const sightingDateTime = new Date(`${lastSeenDate}T${lastSeenTime}Z`);

      // Prepare the data payload
      const sightingData = new FormData();
      sightingData.append("sightingDateTime", sightingDateTime.toISOString());
      sightingData.append("sightingDescription", description);
      sightingData.append("latitude", parseFloat(coordinates[0]));
      sightingData.append("longitude", parseFloat(coordinates[1]));
      sightingData.append("missingId", petId);
      sightingData.append("reporterId", userId);

      const filename = imageUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      sightingData.append("sightingImage", {
        uri: imageUri,
        name: filename,
        type: type,
      });

      console.log(sightingData);

      try {
        const response = await axios.post(
          "http://10.91.144.154:8080/api/sighting/addSighting",
          sightingData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("Response:", response.data);
        Alert.alert("Success", "Sighting report submitted successfully!");
        navigation.navigate("missing_pet/getSelectedMissingPet", {
          petId: petId,
          userId: userId,
        });
      } catch (error) {
        console.error("Submission error:", error);
        Alert.alert("Error", "There was an error submitting the report.");
      } finally {
        setLoading(false); // Stop loading
      }
    } else {
      setLoading(false); // Stop loading if coordinates not found
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA04A" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.imageContainer}>
        <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
          {imageUri ? (
            <Image
              key={imageUri} // Add a key to force re-rendering
              source={{ uri: imageUri }}
              style={styles.imageThumbnail}
            />
          ) : (
            <>
              <Ionicons name="camera" size={60} color="#6B6B6B" />
              <Text style={styles.uploadText}>Upload last sighting image</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>
        Sighting Postal Code<Text style={styles.requiredAsterisk}>*</Text>
      </Text>
      <LinearGradient
        colors={["#FFA04A", "#FF7802"]}
        style={styles.gradientBorder}
      >
        <TextInput
          style={styles.input}
          placeholder="Enter postal code"
          value={form.lastSeenLocation} // Ensure this is set to the postal code input
          onChangeText={(value) => handleInputChange("lastSeenLocation", value)} // Keep using lastSeenLocation for postal code
          keyboardType="numeric" // Ensure this input is numeric
          maxLength={6} 
        />
      </LinearGradient>

      <View style={styles.row}>
        <View style={styles.dateContainer}>
          <Text style={styles.label}>
            Sighting Date<Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <LinearGradient
            colors={["#FFA04A", "#FF7802"]}
            style={styles.gradientBorder}
          >
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.input}
            >
              <Text>{displayDate || "Select Date"}</Text>
            </TouchableOpacity>
          </LinearGradient>
          {showDatePicker && (
            <DateTimePicker
              value={form.pickedDate}
              mode="date"
              display="default"
              onChange={handleConfirmDate}
            />
          )}
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.label}>
            Sighting Time<Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <LinearGradient
            colors={["#FFA04A", "#FF7802"]}
            style={styles.gradientBorder}
          >
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={styles.input}
            >
              <Text>{form.lastSeenTime || "Select Time"}</Text>
            </TouchableOpacity>
          </LinearGradient>
          {showTimePicker && (
            <DateTimePicker
              value={form.pickedTime}
              mode="time"
              display="default"
              onChange={handleConfirmTime}
            />
          )}
        </View>
      </View>

      <Text style={styles.label}>Sighting Description/ Notes<Text style={styles.requiredAsterisk}>*</Text></Text>
      <LinearGradient
        colors={["#FFA04A", "#FF7802"]}
        style={styles.gradientBorder}
      >
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe what you saw"
          value={form.description}
          onChangeText={(value) => handleInputChange("description", value)}
          multiline
        />
      </LinearGradient>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
      <Text style={styles.confirmInfoText}>
        Reporter Contact Details will be displayed!
      </Text>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingHorizontal: 35,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
    margin: 0,
  },
  imageUpload: {
    width: "100%",
    height: 180,
    borderWidth: 2,
    borderColor: "#FFA04A",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  imageThumbnail: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  uploadText: {
    paddingHorizontal: 25,
    textAlign: "center",
    color: "#6B6B6B",
    fontWeight: "bold",
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  requiredAsterisk: {
    color: "red",
  },
  gradientBorder: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFA04A",
    overflow: "hidden",
    marginBottom: 20,
  },
  input: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateContainer: {
    flex: 1,
    marginRight: 10,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: "#FFA04A",
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    paddingVertical: 12,
    alignSelf: "center",
    marginTop: 20,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  confirmInfoText: {
    color: "#6B6B6B",
    fontWeight: "300",
    fontSize: 12,
    textAlign: "center",
  },
});

export default AddSightingReport;
