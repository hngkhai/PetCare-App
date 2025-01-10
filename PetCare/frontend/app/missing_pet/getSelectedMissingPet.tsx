import React, {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Pressable,
  Switch,
  ActivityIndicator,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import MapView, { Marker, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { CustomModal } from "@/components/CustomModal";
import { CustomMarker } from "@/components/CustomMarker";
import * as Location from "expo-location";
import axios from "axios";

export default function GetSelectedMissingPet() {
  const navigation = useNavigation();
  const route = useRoute();
  const { petId, userId } = route.params;
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const [petData, setPetData] = useState(null);
  const [petMarkers, setPetMarkers] = useState([]);
  const [found, setFound] = useState(false);
  const [foundModalVisible, setFoundModalVisible] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const imageContainerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const formatPublishedTime = (publishedTime) => {
    const now = new Date();
    const publishedDate = new Date(publishedTime);
    const timeDiffInSeconds = Math.floor((now - publishedDate) / 1000); // Difference in seconds

    if (timeDiffInSeconds < 60) {
      return "just now"; // Less than 1 minute
    } else if (timeDiffInSeconds < 3600) {
      const minutes = Math.floor(timeDiffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`; // Less than 1 hour
    } else if (timeDiffInSeconds < 86400) {
      const hours = Math.floor(timeDiffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`; // Less than 1 day
    } else if (timeDiffInSeconds < 2592000) {
      const days = Math.floor(timeDiffInSeconds / 86400);
      return `${days} day${days !== 1 ? "s" : ""} ago`; // Less than 30 days
    } else if (timeDiffInSeconds < 31536000) {
      const months = Math.floor(timeDiffInSeconds / 2592000);
      return `${months} month${months !== 1 ? "s" : ""} ago`; // Less than 12 months
    } else {
      const years = Math.floor(timeDiffInSeconds / 31536000);
      return `${years} year${years !== 1 ? "s" : ""} ago`; // 1 year or more
    }
  };

  // Function to get address from latitude and longitude
  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      // Check each part of the address and filter out null values
      const addressParts = [
        address.street,
        address.city,
        address.region,
        address.postalCode,
        address.country,
      ];

      // Filter out null or undefined parts and join them with a comma
      const formattedAddress = addressParts
        .filter((part) => part) // Remove any null or undefined values
        .join(", ");

      return formattedAddress || "Address not found"; // Return a fallback message if empty
    } catch (error) {
      console.error("Error fetching address:", error);
      return null; // Handle errors gracefully
    }
  };

  const convertDateToTimestampObject = (dateString) => {
    const date = new Date(dateString);

    // Get the total seconds since the epoch
    const seconds = Math.floor(date.getTime() / 1000);

    // Get the nanoseconds (remainder of milliseconds)
    const nanos = (date.getTime() % 1000) * 1000000; // Convert milliseconds to nanoseconds

    return {
      seconds: seconds,
      nanos: nanos,
    };
  };

  const formatSightingDateTime = (sightingDateTime) => {
    //console.log("check: "+ sightingDateTime);
    const { seconds, nanos } = sightingDateTime;
    const date = new Date(seconds * 1000 + nanos / 1000000); // Convert to milliseconds

    const day = String(date.getDate()).padStart(2, "0"); // Day with leading zero
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Month with leading zero
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0"); // Minutes with leading zero

    const period = hours >= 12 ? "p.m" : "a.m"; // Determine if it is a.m or p.m
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format

    return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${period}`;
  };

  useFocusEffect(
    useCallback(() => {
      fetchPetData();
    }, [])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerTransparent: true,
      headerStyle: {
        backgroundColor: "transparent",
      },
      headerTintColor: "#fff",
      headerLeft: () => (
        <Animated.View style={{ opacity: headerOpacity }}>
          <Pressable
            onPress={() => navigation.navigate("missing_pets")}
            style={({ pressed }) => [
              styles.headerButton,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        </Animated.View>
      ),
    });
  }, [navigation, headerOpacity]);

  const fetchPetData = async () => {
    try {
      setLoading(true); // Start loading before fetching data
      const response = await axios.get(
        `http://10.91.144.154:8080/api/missing/getMissingById/${petId}`
      );
      const fetchedPet = response.data;
      if (fetchedPet) {
        const updatedPetInfo = {
          ...fetchedPet,
          lastSeenImage: fetchedPet.lastSeenImage.startsWith("data:image")
            ? fetchedPet.lastSeenImage.thumbnailImage
            : `${fetchedPet.lastSeenImage.trim()}`,
          missingPet: {
            ...fetchedPet.missingPet,
            petImageUrl: fetchedPet.missingPet.petImageUrl.startsWith(
              "data:image"
            )
              ? fetchedPet.missingPet.petImageUrl
              : `${fetchedPet.missingPet.petImageUrl.trim()}`,
          },
          owner: {
            ...fetchedPet.owner,
            profilePicUrl: fetchedPet.owner.profilePicUrl.startsWith(
              "data:image"
            )
              ? fetchedPet.owner.profilePicUrl
              : `${fetchedPet.owner.profilePicUrl.trim()}`,
          },
          sightingList: fetchedPet.sightingList.map((sighting) => ({
            ...sighting,
            sightingImage: sighting.sightingImage.startsWith("data:image")
              ? sighting.sightingImage
              : `${sighting.sightingImage.trim()}`,
          })),
        };
        // console.log(updatedPetInfo.sightingList[0].sightingImage);
        setPetData(updatedPetInfo);

        const markers = [];
        const lastSeenLocation = updatedPetInfo.lastSeenLocation;
        const lastSeenLatitude = lastSeenLocation.latitude;
        const lastSeenLongitude = lastSeenLocation.longitude;
        const lastSeenAddress = await getAddressFromCoords(
          lastSeenLatitude,
          lastSeenLongitude
        );
        markers.push({
          id: "last_seen",
          latitude: lastSeenLatitude,
          longitude: lastSeenLongitude,
          number: 1,
          image: updatedPetInfo.missingPet.petImageUrl,
          sightingInfo: {
            title: "Sighting 1",
            description: updatedPetInfo.lastSeenDescription,
            location:
              lastSeenAddress ||
              `Lat: ${lastSeenLatitude}, Lon: ${lastSeenLongitude}`,
            lastSeen: convertDateToTimestampObject(updatedPetInfo.lastSeenDateTime),
            sightingImage: updatedPetInfo.lastSeenImage,
          },
        });
        // Process markers for each sighting in the sightingList
        const sightingMarkers = await Promise.all(
          fetchedPet.sightingList.map(async (sighting, index) => {
            const { latitude, longitude } = sighting.sightingLocation; // Access latitude and longitude
            const address = await getAddressFromCoords(latitude, longitude);
            return {
              id: (index + 1).toString(),
              latitude,
              longitude,
              number: index + 2,
              image: fetchedPet.missingPet.petImageUrl,
              sightingInfo: {
                title: `Sighting ${index + 2}`,
                description: sighting.sightingDescription,
                location: address || `Lat: ${latitude}, Lon: ${longitude}`,
                lastSeen: sighting.sightingDateTime,
                sightingImage: updatedPetInfo.sightingList[index].sightingImage,
              },
            };
          })
        );

        // Combine last seen marker with the subsequent sighting markers
        markers.push(...sightingMarkers);

        // Set the markers state
        setPetMarkers(markers);

        if (markers.length > 0) {
          setSelectedMarkerId(markers[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching pet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: { seconds: number; nanos: number }) => {
    // Convert seconds and nanoseconds to a Date object
    const birthDate = new Date(
      dateOfBirth.seconds * 1000 + dateOfBirth.nanos / 1000000
    );

    const now = new Date();
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
      const ageInYears = Math.floor(ageInMonths / 12); // Calculate age in whole years
      const remainingMonths = ageInMonths % 12; // Remaining months after whole years
      return `${ageInYears} years ${remainingMonths} months old`; // Display in years and months
    }
  };

  useEffect(() => {
    fetchPetData();
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    };

    fetchLocation();
  }, []);

  const goToNextSighting = () => {
    const currentIndex = petMarkers.findIndex(
      (marker) => marker.id === selectedMarkerId
    );
    const nextIndex = (currentIndex + 1) % petMarkers.length;
    const nextMarker = petMarkers[nextIndex];

    setSelectedMarkerId(nextMarker.id);

    const userRegion: Region = {
      latitude: nextMarker.latitude,
      longitude: nextMarker.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    mapRef.current?.animateToRegion(userRegion, 1000);
  };

  // const handleToggleFound = () => {
  //   setFound((prev) => !prev);
  // };

  const handleConfirmFound = async () => {
    setFound((prev) => !prev);
    try {
      const response = await axios.put(
        `http://10.91.144.154:8080/api/missing/markFound/${petId}`
      );
      if (response.status === 200) {
        console.log("Missing pet marked as found!");
        setFoundModalVisible(false);
        navigation.navigate("missing_pets");
      } else {
        alert("Failed to mark pet as found. Please try again.");
      }
    } catch (error) {
      console.error("Error marking pet as found:", error);
      alert("An error occurred while trying to mark pet as found.");
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
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View
          style={[styles.petImageContainer, { opacity: imageContainerOpacity }]}
        >
          <Image
            source={{
              uri: petData?.missingPet.petImageUrl || "default_image_url_here",
            }}
            style={styles.petImage}
          />
        </Animated.View>

        <View style={styles.petDetailsContainer}>
          <View style={styles.petInfo}>
            <View style={styles.activeButton}>
              <Text style={styles.petStatus}>
                {petData?.active ? "ACTIVE" : "INACTIVE"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.petName, { marginRight: 5 }]}>
                {petData?.missingPet.petName}
              </Text>
              {petData?.missingPet.sex === "M" ? (
                <Ionicons name="male" size={20} color="blue" />
              ) : (
                <Ionicons name="female" size={20} color="pink" />
              )}
            </View>
            <Text style={styles.petDetailsText}>
              {petData?.missingPet.breed}
            </Text>
            <Text style={styles.petDetailsText}>
              {calculateAge(petData?.missingPet.dateOfBirth)}
            </Text>
            <View style={styles.petDetailsRow}>
              <Text style={styles.petDetailsText}>
                +65 {petData?.owner.phoneNumber}
              </Text>

              {/* Conditional Toggle Button for Owner */}
              {petData?.owner.id === userId && (
                <View style={styles.toggleContainer}>
                  <Text style={[styles.toggleLabel, styles.petDetailsText]}>
                    Found
                  </Text>
                  <Switch
                    value={found}
                    onValueChange={() => setFoundModalVisible(true)}
                    trackColor={{ false: "#767577", true: "#FFA500" }}
                    thumbColor={found ? "#fff" : "#f4f3f4"}
                  />
                </View>
              )}
            </View>
          </View>

          <View style={styles.postedInfo}>
            <Text style={styles.posterInfoText}>
              Posted {formatPublishedTime(petData?.publishedTime)}
            </Text>
            <Text style={styles.posterInfoText}>
              By: {petData?.owner.userName}
            </Text>
          </View>
        </View>

        <View style={styles.sightingInfoContainer}>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude:
                  petMarkers.find((marker) => marker.id === selectedMarkerId)
                    ?.latitude || 1.345,
                longitude:
                  petMarkers.find((marker) => marker.id === selectedMarkerId)
                    ?.longitude || 103.685,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {petMarkers.map((marker) => (
                <Marker
                  key={marker.id}
                  coordinate={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                  }}
                  onPress={() => setSelectedMarkerId(marker.id)}
                >
                  <CustomMarker
                    color={selectedMarkerId === marker.id ? "orange" : "white"}
                    image={petData?.missingPet.petImageUrl}
                  />
                </Marker>
              ))}
            </MapView>

            <TouchableOpacity
              style={styles.userLocationButton}
              onPress={goToNextSighting}
            >
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Display selected marker's sighting info */}
          {selectedMarkerId && (
            <View style={styles.sightingDetailsContainer}>
              {petMarkers
                .filter((marker) => marker.id === selectedMarkerId)
                .map((marker) => (
                  <View key={marker.id} style={styles.sightingInfoCard}>
                    <Text style={styles.sightingTitle}>
                      {marker.sightingInfo.title}
                    </Text>

                    <View style={styles.sightingImageContainer}>
                      <Image
                        source={{ uri: marker.sightingInfo.sightingImage }}
                        style={styles.sightingImage}
                        resizeMode="cover"
                      />
                    </View>

                    <Text style={styles.sightingDescription}>
                      {marker.sightingInfo.description}
                    </Text>
                    <View style={styles.iconRow}>
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.sightingText}>
                        {marker.sightingInfo.location}
                      </Text>
                    </View>
                    <View style={styles.iconRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.sightingText}>
                        {formatSightingDateTime(marker.sightingInfo.lastSeen)}
                      </Text>
                    </View>
                    <View style={styles.reportContainer}>
                      <TouchableOpacity
                        style={styles.reportButton}
                        onPress={() =>
                          navigation.navigate("missing_pet/reportSighting", {
                            petId: petId,
                            userId: userId,
                          })
                        }
                      >
                        <Text style={styles.reportButtonText}>
                          Report Sighting
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Found Confirmation Modal */}
      <CustomModal
        visible={foundModalVisible}
        onClose={() => setFoundModalVisible(false)}
        onConfirm={handleConfirmFound} // Call delete on confirmation
        title="Mark Missing Pet As Found"
        message={`Please confirm that you have found your pet.\nYour pet will no longer be displayed in the map and users are no longer able to add new sightings.\nYou will not be able to access this page anymore.\nNote that this change is irreversible.`}
        confirmText="Yes"
        cancelText="No"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerButton: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  petDetailsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  petImageContainer: {
    width: "100%",
    height: 200,
    marginBottom: 10,
  },
  petImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  petInfo: {
    flex: 1,
  },
  activeButton: {
    backgroundColor: "#f88c00",
    borderRadius: 8,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    width: 80,
  },
  petStatus: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  petName: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
  },
  petDetailsText: {
    fontSize: 14,
    color: "#888",
  },
  posterInfoText: {
    fontSize: 12,
    color: "#888",
  },
  postedInfo: {
    position: "absolute",
    right: 10,
    top: 5,
    textAlign: "right",
  },
  petDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleLabel: {
    marginRight: 5,
  },
  mapContainer: {
    position: "relative",
  },
  map: {
    height: 250,
    width: "100%",
    overflow: "hidden",
  },
  userLocationButton: {
    position: "absolute",
    bottom: 15,
    right: 15,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  sightingInfoContainer: {
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    backgroundColor: "#6A4EFC",
    flexGrow: 1,
  },
  sightingDetailsContainer: {
    padding: 20,
    paddingHorizontal: 30,
    minHeight: "auto",
  },
  sightingImageContainer: {
    width: "auto",
    height: 180,
    overflow: "hidden",
    borderRadius: 10,
    marginBottom: 10,
  },
  sightingImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  sightingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  sightingDescription: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 15,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sightingText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 5,
    marginRight: 5,
  },
  reportContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reportButton: {
    width: "65%",
    backgroundColor: "#f89c02",
    marginVertical: 10,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  reportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
