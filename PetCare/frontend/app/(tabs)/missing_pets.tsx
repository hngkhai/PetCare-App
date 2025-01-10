import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Marker, Region, } from "react-native-maps";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { CustomMarker } from "@/components/CustomMarker";
import axios from "axios";
import { auth } from "../../firebase";

type Pet = {
  id: string;
  name: string;
  image: any;
  color: string;
  latitude: number;
  longitude: number;
};

// type User = {
//   userId: string;
//   email: string;
//   phoneNumber: number;
//   userName: string;
// };

const colors = [
  "blue",
  "green",
  "purple",
  "red",
  "orange",
  "yellow",
  "pink",
  "cyan",
];

export default function MissingPets() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Loading state
  const [pets, setPets] = useState<Pet[]>([]); // Pets state

  const navigation = useNavigation();
  const mapRef = useRef<MapView | null>(null); // Create a ref for the MapView
  
  const userId = auth.currentUser?.uid;

  const fetchMissingPetData = async () => {
    setLoading(true);
    console.log("updating data in missing")
    try {
      const response = await axios.get(
        `http://10.91.144.154:8080/api/missing/getAllMissingPets`
      );
      
      // console.log(response.data.map((pet: Pet) => pet.petName));
      // console.log("here");
      // console.log(response.data[0].missingPet.petName);
      // console.log(response.data[0].owner);
      
      const petsData = response.data.map((pet: any) => ({
        id: pet.id,
        name: pet.missingPet.petName,
        latitude: pet.lastSeenLocation.latitude,
        longitude: pet.lastSeenLocation.longitude,
        color: colors[Math.floor(Math.random() * colors.length)],
        petImage: pet.missingPet.petImageUrl.startsWith("data:image")
          ? pet.missingPet.petImageUrl
          : `${pet.missingPet.petImageUrl.trim()}`, 
      }));

      setPets(petsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Could not fetch pets. Please try again.");
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        setErrorMsg(
          "Location services are not enabled. Please enable them in your settings."
        );
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);


  useFocusEffect(
    useCallback(() => {
      fetchMissingPetData();
    }, [])
  );

  // If location is not available, render a loading message or error message
  if (!location || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA04A" />
      </View>
    );
  }

  const goToUserLocation = () => {
    if (location) {
      const userRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(userRegion, 1000);
    }
  };

  // Set region based on current location
  const region: Region = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView
        showsUserLocation={true}
        showsMyLocationButton={false}
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
      >
        {pets.map((pet) => (
          <Marker
            key={pet.id}
            coordinate={{ latitude: pet.latitude, longitude: pet.longitude }}
            title={pet.name}
            onPress={() =>
              navigation.navigate("missing_pet/getSelectedMissingPet", {
                petId: pet.id,
                userId: userId
              })
            }
          >
            <CustomMarker color={pet.color} image={pet.petImage} />
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity
        style={styles.userLocationButton}
        onPress={goToUserLocation}
      >
        <Ionicons name="locate" size={33} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addPetButton}
        onPress={() =>
          navigation.navigate("missing_pet/addMissingPet", { userId })
        }
      >
        <Ionicons name="add" size={33} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userLocationButton: {
    position: "absolute",
    bottom: 95,
    right: 20,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  addPetButton: {
    backgroundColor: "#FF8800",
    position: "absolute",
    bottom: 25,
    right: 20,
    padding: 10,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
});
