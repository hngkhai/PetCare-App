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
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

type Pet = {
  ownerId: number;
  id: string;
  petImage: string;
  petName: string;
  dateOfBirth: string;
  sex: string;
};

const AddMissingPetReport: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [lastSeenDate, setLastSeenDate] = useState("");
  const [lastSeenTime, setLastSeenTime] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [location, setLocation] = useState<{
    lat: number;
    long: number;
  } | null>(null);

  const [description, setDescription] = useState("");
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState(new Date());
  const [pickedTime, setPickedTime] = useState(new Date());

  const route = useRoute();
  const { userId } = route.params;

  const handleConfirmDate = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || pickedDate;
    setShowDatePicker(false);
    setLastSeenDate(currentDate.toLocaleDateString("en-GB"));
    setPickedDate(currentDate);
  };

  const handleConfirmTime = (event: any, selectedTime: Date | undefined) => {
    const currentTime = selectedTime || pickedTime;
    setShowTimePicker(false);
    setLastSeenTime(
      currentTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    ); // Format as HH:MM AM/PM
    setPickedTime(currentTime);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Missing Pet Report",
    });
  }, [navigation]);

  useEffect(() => {
    fetchPetData();
  }, []);

  useEffect(() => {
    getLocation();
  }, []);

  const fetchPetData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://10.91.144.154:8080/api/pet/getPetsByUserId/${userId}`
      );

      // console.log(response.data.map((pet: Pet) => pet.petName));

      const fetchedPets = response.data;
      const updatedPets = fetchedPets.map((pet: Pet) => ({
        ...pet,
        petImage: pet.petImage.startsWith("data:image")
          ? pet.petImage
          : `${pet.petImage.trim()}`,
      }));
      setPets(updatedPets);

      // Default select the first pet
      if (updatedPets.length > 0) {
        setSelectedPet(updatedPets[0]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Could not fetch pets. Please try again.");
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  const handleConfirm = async () => {
    if (
      !selectedPet ||
      !location ||
      !lastSeenDate ||
      !lastSeenTime ||
      !description
    ) {
      Alert.alert("Error", "Please fill in all the fields.");
      return;
    }
    const coordinates = await getCoordinatesByPostalCode(location);

    if (coordinates) {
      try {
        // FIX THIS
        const lastSeenDateTime = new Date(`${lastSeenDate}T${lastSeenTime}Z`);

        const missingData = new FormData();
        missingData.append("active", true);
        // FIX THIS!!!
        missingData.append("lastSeenDateTime", new Date().toISOString());
        missingData.append("lastSeenDescription", description);
        missingData.append("latitude", parseFloat(coordinates[0]));
        missingData.append("longitude", parseFloat(coordinates[1]));
        missingData.append("petId", selectedPet.id);
        missingData.append("ownerId", userId);
        missingData.append("publishedTime", new Date().toISOString());

        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        missingData.append("lastSeenImage", {
          uri: imageUri,
          name: filename,
          type: type,
        });


        try {
          const response = await axios.post(
            "http://10.91.144.154:8080/api/missing/addMissing",
            missingData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          if (response.status === 201) {
            Alert.alert("Success", "Missing Pet submitted successfully!");
            // Reset form fields after success
            setSelectedPet(pets[0]);
            setLastSeenDate("");
            setLastSeenTime("");
            setLocation(null);
            setDescription("");
            navigation.navigate("missing_pet/getSelectedMissingPet", {
              petId: response.data,
              userId: userId,
            });
          } else {
            Alert.alert(
              "Error",
              "Failed to submit missing pet report. Please try again."
            );
          }
        } catch (error) {
          if (error.response && error.response.status === 409) {
            Alert.alert("Error", "Already an Active Missing Pet Case!");
            setSelectedPet(pets[0]);
            setLastSeenDate("");
            setLastSeenTime("");
            setLocation(null);
            setDescription("");
          } else {
            Alert.alert(
              "Error",
              "An error occurred while submitting missing pet report. Please try again."
            );
          }
        }
      } catch (error) {
        console.error("Submission error:", error);
        Alert.alert("Error", "There was an error submitting the report.");
      }
      
    }
  
  };

  const calculateAge = (dateOfBirth: string) => {
    const now = new Date();
    const birthDate = new Date(dateOfBirth);

    const ageInMonths =
      (now.getFullYear() - birthDate.getFullYear()) * 12 +
      (now.getMonth() - birthDate.getMonth());
    const daysDiff = Math.floor(
      (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    ); // Total days difference

    if (ageInMonths < 1) {
      return `${daysDiff} days old`; // Display in days if less than 1 month
    } else if (ageInMonths < 12) {
      return `${ageInMonths} months old`; // Display in months if less than 1 year
    } else {
      const ageInYears = (ageInMonths / 12).toFixed(1); // Calculate age in years and format to one decimal
      return `${ageInYears} years old`; // Display in years if 1 year or older
    }
  };

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

      const data = await response.json(); 

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

  // Loading screen
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imageContainer}
      >
        {pets.map((pet) => (
          <TouchableOpacity
            style={{ marginRight: 20 }}
            key={pet.id}
            onPress={() => setSelectedPet(pet)}
          >
            {selectedPet?.id === pet.id ? (
              <LinearGradient
                colors={["#6044FF", "#8675E6", "#AEA0ED", "#E8DEF8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.selectedPetGradient}
              >
                <View style={styles.petCard}>
                  <Image
                    source={{ uri: pet.petImage }}
                    style={styles.petImage}
                  />
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.petCard}>
                <Image source={{ uri: pet.petImage }} style={styles.petImage} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedPet && (
        <>
          <Text style={styles.label}>
            Name<Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <LinearGradient
            colors={["#FFA04A", "#FF7802"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <TextInput
              style={styles.inputContainer}
              value={selectedPet.petName}
              editable={false}
            />
          </LinearGradient>

          <View style={styles.row}>
            <View style={styles.ageContainer}>
              <Text style={styles.label}>
                Age<Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <LinearGradient
                colors={["#FFA04A", "#FF7802"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBorder}
              >
                <TextInput
                  style={styles.inputContainer}
                  value={calculateAge(selectedPet.dateOfBirth)}
                  editable={false}
                />
              </LinearGradient>
            </View>

            <View style={styles.genderContainer}>
              <View style={styles.row}>
                <Ionicons
                  name="male"
                  size={28}
                  color={selectedPet?.sex === "M" ? "blue" : "gray"}
                  style={{ marginRight: 20 }}
                />
                <Ionicons
                  name="female"
                  size={28}
                  color={selectedPet?.sex === "F" ? "pink" : "gray"}
                />
              </View>
            </View>
          </View>
        </>
      )}
      <Text style={styles.label}>
        Last Seen Location<Text style={styles.requiredAsterisk}>*</Text>
      </Text>
      <LinearGradient
        colors={["#FFA04A", "#FF7802"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter last seen postal code"
            value={location}
            onChangeText={setLocation}
            keyboardType="numeric"
            maxLength={6} 
          />
        </View>
      </LinearGradient>

      <View style={styles.row}>
        <View style={[styles.dateContainer, { marginRight: 25 }]}>
          <Text style={styles.label}>
            Last Seen Date<Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <LinearGradient
            colors={["#FFA04A", "#FF7802"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder} // Added gradient border
          >
            <View style={styles.inputContainer}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateInput}
              >
                <Text>{lastSeenDate || "Select Date"}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
          {showDatePicker && (
            <DateTimePicker
              value={pickedDate}
              mode="date"
              display="default"
              onChange={handleConfirmDate}
            />
          )}
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.label}>
            Last Seen Time<Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <LinearGradient
            colors={["#FFA04A", "#FF7802"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder} // Added gradient border
          >
            <View style={styles.inputContainer}>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={styles.dateInput}
              >
                <Text>{lastSeenTime || "Select Time"}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
          {showTimePicker && (
            <DateTimePicker
              value={pickedTime}
              mode="time"
              display="default"
              onChange={handleConfirmTime}
            />
          )}
        </View>
      </View>

      <Text style={styles.label}>Last Seen Description/Notes<Text style={styles.requiredAsterisk}>*</Text></Text>
      <LinearGradient
        colors={["#FFA04A", "#FF7802"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Describe what happened"
            value={description}
            onChangeText={setDescription}
            multiline
            style={styles.textArea}
          />
        </View>
      </LinearGradient>

      <View style={styles.lastSeenImageContainer}>
        <TouchableOpacity
          style={styles.lastSeenImageUpload}
          onPress={pickImage}
        >
          {imageUri ? (
            <Image
              key={imageUri}
              source={{ uri: imageUri }}
              style={styles.lastSeenImageThumbnail}
            />
          ) : (
            <>
              <Ionicons name="camera" size={60} color="#6B6B6B" />
              <Text style={styles.uploadText}>Upload Last Seen Image<Text style={styles.requiredAsterisk}>*</Text></Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
      <Text style={styles.confirmInfoText}>
        Your Contact Details will be displayed!
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingHorizontal: 35,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  petsScrollContainer: {
    flexDirection: "row",
    gap: 16,
  },
  petCard: {
    alignItems: "center",
    justifyContent: "center",
    width: 115,
    height: 115,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedPetGradient: {
    borderRadius: 60,
    padding: 3,
  },
  petImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  imageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    marginRight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  requiredAsterisk: {
    color: "red",
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 5,
    paddingLeft: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  ageContainer: {
    width: "50%",
  },
  dateContainer: {
    flex: 1,
  },
  dateInput: {
    borderRadius: 8,
    padding: 5,
  },

  genderContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  gradientBorder: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFA04A",
    overflow: "hidden",
    marginBottom: 20,
  },
  lastSeenImageContainer: {
    alignItems: "center",
    marginBottom: 15,
    margin: 0,
  },
  lastSeenImageUpload: {
    width: "100%",
    height: 180,
    borderWidth: 2,
    borderColor: "#FFA04A",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  lastSeenImageThumbnail: {
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
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmInfoText: {
    color: "#6B6B6B",
    fontWeight: "300",
    fontSize: 12,
    textAlign: "center",
  },
});

export default AddMissingPetReport;
