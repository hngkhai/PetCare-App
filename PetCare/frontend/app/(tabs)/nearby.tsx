import React, { useEffect, useState, useRef } from "react";
import {
  Platform,
  ScrollView,
  Linking,
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/Ionicons";
import axios from "axios";
import axiosRetry from "axios-retry";
import LoadingScreen from "../../components/LoadingScreen";

type DayTime = {
  day: number; // Day of the week: 0 (Sunday) to 6 (Saturday)
  time: string; // Time in "HHmm" format, e.g., "0900" for 9:00 AM
};

type PlaceOpeningHoursPeriodDetail = {
  open: DayTime | null;
  close: DayTime | null;
};

type PlaceDTO = {
  id: string;
  name: string;
  rating: number;
  phoneNumber: string;
  website: string;
  photoBase64?: string;
  openNow: boolean;
  openingHours: PlaceOpeningHoursPeriodDetail[] | null;
  vicinity: string;
  latitude: number;
  longitude: number;
  distance?: number;
};

const formatOpeningHours = (
  opening_hours: PlaceOpeningHoursPeriodDetail[]
): string => {
  const daysMap: Record<string, string[]> = {
    Sun: [],
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
  };

  opening_hours.forEach((period) => {
    if (period.open && period.close) {
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        period.open.day
      ];
      const openTime = formatTime(period.open.time);
      const closeTime = formatTime(period.close.time);
      daysMap[dayName].push(`${openTime} - ${closeTime}`);
    }
  });

  // Format the result for display
  let result = "";
  for (const [day, timeSlots] of Object.entries(daysMap)) {
    if (timeSlots.length > 0) {
      result += `${day}  `;
      timeSlots.forEach((slot, index) => {
        result += `\n${slot}`;
      });
      result += "\n";
    }
  }
  return result.trim();
};

// Helper function to format time from "HHmm" to "h:mm a" format
const formatTime = (time: string): string => {
  const hour = parseInt(time.slice(0, 2), 10);
  const minute = parseInt(time.slice(2), 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const hourFormatted = hour % 12 || 12;
  return `${hourFormatted}:${minute.toString().padStart(2, "0")}${ampm}`;
};

const Nearby = () => {
  const [keyword, setKeyword] = useState("");
  const [openNow, setOpenNow] = useState<string>("any");
  const [minRating, setMinRating] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sortOption, setSortOption] = useState("");
  const [hoveredOption, setHoveredOption] = useState("");
  const [places, setPlaces] = useState<PlaceDTO[]>([]);
  const [originalPlaces, setOriginalPlaces] = useState<PlaceDTO[]>([]);
  const [initialLocation, setInitialLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [placeIds, setPlaceIds] = useState<string[]>([]);
  const [visible, setVisible] = useState(false); // Modal visibility state
  const [selectedPlace, setSelectedPlace] = useState<PlaceDTO | null>(null);
  const [isFullScreen, setFullScreen] = useState(false); // State to toggle full screen

  const toggleFullScreen = () => {
    setFullScreen(!isFullScreen); // Toggle full-screen state
  };

  const handleLocationPress = (place) => {
    setSelectedPlace(place);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false); // Close the modal
    setSelectedPlace(null); // Reset the selected place
  };

  const clearSearch = () => {
    setKeyword("");
    setPlaces(originalPlaces); // Reset to full list when search is cleared
  };

  const mapRef = useRef<MapView | null>(null);
  const ratingOptions = [
    { label: "Any", value: 0 },
    { label: "2 ⭐", value: 2 },
    { label: "3 ⭐", value: 3 },
    { label: "4 ⭐", value: 4 },
    { label: "5 ⭐", value: 5 },
  ];

  // Axios calls
  axiosRetry(axios, { retries: 3 });

  const fetchNearbyPetCare = async (latitude: number, longitude: number) => {
    try {
      const response = await axios.get(
        "http://10.91.144.154:8080/api/googlemaps/getNearbyByTypes",
        {
          params: {
            latitude,
            longitude,
            radius: 10000, // 10km
            keyword: "pet, pet_adoption, vet, groomer",
          },
        }
      );

      const nearbyPlaces = response.data.map((place: PlaceDTO) => {
        // Calculate the distance from the user's current location
        const distance =
          getDistance(
            { latitude, longitude },
            { latitude: place.latitude, longitude: place.longitude }
          ) / 1000; // Convert to kilometers

        // Add the calculated distance to the place object
        return { ...place, distance: distance };
      });

      // Extract the placeIds and log them
      const ids = response.data.map(
        (place: PlaceDTO) => place.id || "undefined"
      );
      console.log("Extracted placeIds:", ids);
      setPlaceIds(ids);

      setPlaces(nearbyPlaces);
      setOriginalPlaces(nearbyPlaces);
    } catch (error) {
      console.error("Error fetching places:", error);
    }
  };

  // Search for a location by keyword
  const applySearch = async () => {
    const { latitude, longitude } = currentLocation;

    try {
      const response = await axios.get(
        `http://10.91.144.154:8080/api/googlemaps/searchLocationByKeyword`,
        {
          params: {
            latitude,
            longitude,
            radius: 20000, // 20km
            keyword: keyword,
            types: "veterinary_care, pet_store",
          },
        }
      );
      setPlaces(response.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const applyFilters = async () => {
    setShowModal(false);

    // Check if both filter options are 'any'
    if (minRating === 0 && openNow === "any") {
      clearFilters();
      return;
    }

    // Set filters to null if they are not applied (default case)
    const ratingFilter = minRating > 0 ? minRating : null;
    const openNowFilter = openNow !== "any" ? openNow : null;

    console.log(
      `Applying filters: Rating = ${minRating}, Open Now = ${openNow}`
    );

    try {
      // Convert placeIds to a comma-separated string
      const placeIdsString = placeIds.join(",");

      const response = await axios.get(
        `http://10.91.144.154:8080/api/googlemaps/filterLocations`,
        {
          params: {
            placeIds: placeIdsString, // Pass placeIds as a comma-separated string
            minRating: ratingFilter,
            openNow: openNowFilter,
          },
          timeout: 30000, // Increase timeout to 30 seconds
        }
      );

      const filteredPlaceIds = response.data;
      const filteredPlaces = originalPlaces.filter((place) =>
        filteredPlaceIds.includes(place.id)
      );
      setPlaces(filteredPlaces);
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  };

  // Function to clear filters and reset to the original places
  const clearFilters = () => {
    setShowModal(false);
    setMinRating(0);
    setOpenNow("any");
    setPlaces(originalPlaces);
    console.log(places);
  };

  // Sort by distance or rating
  const applySort = async (option) => {
    setSortOption(option);
    setShowDropdown(!showDropdown);
    console.log(`Applying sort: ${option}`);

    let sortedPlaces;
    if (option === "Distance") {
      // Sort using the pre-calculated distance
      sortedPlaces = [...places].sort(
        (a, b) => (a.distance || 0) - (b.distance || 0)
      );
    } else if (option === "Rating") {
      sortedPlaces = [...places].sort((a, b) => b.rating - a.rating);
    }
    setPlaces(sortedPlaces);
  };

  // UseEffect
  useEffect(() => {
    const checkLocationAndFetch = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        const isLocationEnabled = await Location.hasServicesEnabledAsync();
        if (!isLocationEnabled) {
          setErrorMsg(
            "Location services are not enabled. Please enable them in your settings."
          );
          return;
        }

        // Fetch current location
        let location = await Location.getCurrentPositionAsync({});
        if (!location) return;

        const { latitude, longitude } = location.coords;
        const coords = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        if (!initialLocation) {
          setInitialLocation(coords);
          fetchNearbyPetCare(coords.latitude, coords.longitude);
        } else {
          const distance = calculateDistance(initialLocation, coords);
          if (distance > 1000) {
            fetchNearbyPetCare(coords.latitude, coords.longitude);
            setInitialLocation(coords);
          }
        }

        setCurrentLocation(coords);
        setRegion(coords);
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    checkLocationAndFetch(); // Call the function when component mounts
  }, []);

  useEffect(() => {
    if (places.length > 0 && mapRef.current) {
      const latitudes = places.map((place) => place.latitude);
      const longitudes = places.map((place) => place.longitude);

      // Calculate the average latitude and longitude to center the map
      const avgLatitude =
        latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
      const avgLongitude =
        longitudes.reduce((a, b) => a + b, 0) / longitudes.length;

      // Zoom out by increasing the latitudeDelta and longitudeDelta
      const region = {
        latitude: avgLatitude,
        longitude: avgLongitude,
        latitudeDelta: 0.1, // Zoom out level
        longitudeDelta: 0.1,
      };
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [places]);

  // Util functions
  const calculateDistance = (loc1, loc2) => {
    const distance = getDistance(
      { latitude: loc1.latitude, longitude: loc1.longitude },
      { latitude: loc2.latitude, longitude: loc2.longitude }
    );
    return distance; // Distance in meters
  };

  const goToUserLocation = () => {
    if (currentLocation && mapRef.current) {
      const region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  if (!initialLocation) {
    return <LoadingScreen />;
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const renderPlace = ({ item }: { item: PlaceDTO }) => (
    <TouchableOpacity onPress={() => handleLocationPress(item)}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.cardInfoContainer}>
          <Text style={styles.cardRating}>
            {item.vicinity === "N/A" ? "-" : `⭐ ${item.rating}`}
          </Text>
          {item.distance && (
            <Text style={styles.cardDistance}>
              {item.distance.toFixed(2)} km away
            </Text>
          )}
        </View>
        {item.photoBase64 ? (
          <Image
            style={styles.cardImage}
            source={{ uri: `data:image/jpeg;base64,${item.photoBase64}` }}
          />
        ) : (
          <Image
            style={styles.cardImage}
            source={require("../../assets/images/default-amenity-img.jpg")}
          />
        )}
        <Text
          style={[styles.cardStatus, { color: item.openNow ? "green" : "red" }]}
        >
          {item.openNow ? "Open Now" : "Closed"}
        </Text>
        <View style={styles.cardDetails}>
          <Icon name="location-outline" size={20} color="gray" />
          <Text
            style={styles.cardAmenityDetails}
            numberOfLines={1} // Limits the text to one line
            ellipsizeMode="tail" // Adds "..." at the end if text overflows
          >
            {item.vicinity === "N/A" ? "-" : item.vicinity}
          </Text>
        </View>
        <View style={styles.cardDetails}>
          <Icon name="call-outline" size={20} color="gray" />
          <Text style={styles.cardAmenityDetails}>
            {item.phoneNumber === "N/A" ? "-" : item.phoneNumber}
          </Text>
        </View>
        <View style={styles.cardDetails}>
          <Icon name="earth" size={20} color="gray" />
          <Text
            style={styles.cardAmenityDetails}
            onPress={() =>
              Linking.openURL(item.website === "N/A" ? "-" : item.website)
            }
          >
            {item.website}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <MapView
          showsUserLocation={true}
          showsMyLocationButton={false}
          ref={mapRef}
          style={isFullScreen ? styles.fullScreenMap : styles.map} // Fullscreen map when toggled
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {places.map((place, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              onPress={() => handleLocationPress(place)}
            />
          ))}
        </MapView>

        <TouchableOpacity
          style={
            isFullScreen
              ? styles.userLocationButtonExpanded
              : styles.userLocationButton
          }
          onPress={goToUserLocation}
        >
          <Ionicons name="locate" size={25} color="#000" />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          {/* Filter Icon */}
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={styles.filterButton}
          >
            <Icon name="funnel-outline" size={22} color="#000" />
          </TouchableOpacity>
          {/* Sort Icon */}
          <TouchableOpacity
            style={[styles.sortButton, showDropdown && styles.activeButton]}
            onPress={toggleDropdown}
          >
            <Icon name="filter-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Sort Options Dropdown Menu */}
        {showDropdown && (
          <View style={styles.dropdownContainer}>
            {["Distance", "Rating"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownOption,
                  hoveredOption === option && styles.hoverStyle,
                ]}
                onPress={() => applySort(option)}
                onPressIn={() => setHoveredOption(option)}
                onPressOut={() => setHoveredOption("")}
              >
                <Text style={styles.sortOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={styles.touchableArea}
              onPress={() => this.searchInput.focus()} // Ensure the input is focused
              activeOpacity={0.7} // Slightly dim the touchable area when pressed
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#999"
                style={styles.searchIcon}
              />
              <TextInput
                ref={(input) => {
                  this.searchInput = input;
                }} // Reference to focus the input
                style={styles.searchInput}
                placeholder="Search Petcare Amenities"
                placeholderTextColor="#999"
                value={keyword}
                onChangeText={setKeyword}
                returnKeyType="search" // Enables search action on the keyboard
                onSubmitEditing={applySearch}
              />
              {keyword.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.clearButton}
                  activeOpacity={0.7} // Slightly dim the clear button when pressed
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        {/* <TextInput
          style={styles.searchBar}
          placeholder="Search Petcare Amenities"
          placeholderTextColor="#CCCCCC"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={applySearch}
        />
        {keyword.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle-outline" size={23} color="gray" />
          </TouchableOpacity>
        )} */}

        {/* Render list of places */}
        <FlatList
          style={styles.placeList}
          data={places}
          renderItem={renderPlace}
          keyExtractor={(item) => item.id}
        />

        {/* Fullscreen Button */}
        <TouchableOpacity
          onPress={toggleFullScreen}
          style={
            isFullScreen ? styles.exitfullScreenButton : styles.fullScreenButton
          }
        >
          <Icon
            name={isFullScreen ? "close-outline" : "expand-outline"}
            size={25}
            color="black"
          />
        </TouchableOpacity>

        {/* Modal to display selected place details */}
        {selectedPlace && (
          <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.placeModalContainer}>
              <View style={styles.placeModalCard}>
                {/* Clinic Image */}
                {selectedPlace.photoBase64 ? (
                  <Image
                    style={styles.placeModalImage}
                    source={{
                      uri: `data:image/jpeg;base64,${selectedPlace.photoBase64}`,
                    }}
                  />
                ) : (
                  <Image
                    style={styles.placeModalImage}
                    source={require("../../assets/images/default-amenity-img.jpg")}
                  />
                )}
                {/* Close Button */}
                <TouchableOpacity
                  style={styles.placeCloseButton}
                  onPress={closeModal}
                >
                  <Text style={styles.placeCloseText}>×</Text>
                </TouchableOpacity>
                <ScrollView contentContainerStyle={styles.modalScrollContent}>
                  {/* Clinic Info */}
                  <View style={styles.placeModalContent}>
                    {/* Clinic Name and Status */}
                    <Text style={styles.placeModalTitle}>
                      {selectedPlace.name}
                    </Text>
                    <View style={styles.placeInfoContainer}>
                      <Text
                        style={[
                          styles.placeStatusText,
                          { color: selectedPlace.openNow ? "green" : "red" },
                        ]}
                      >
                        {selectedPlace.openNow ? "Open" : "Closed"}
                      </Text>
                      {selectedPlace.distance && (
                        <Text style={styles.placeDistance}>
                          {selectedPlace.distance.toFixed(2)} km away
                        </Text>
                      )}
                    </View>
                    {/* Address */}
                    <View style={styles.placeModalRow}>
                      <Icon name="location-outline" size={20} color="gray" />
                      <Text style={styles.placeModalText}>
                        {selectedPlace.vicinity}
                      </Text>
                    </View>
                    {/* Contact Number */}
                    <View style={styles.placeModalRow}>
                      <Icon name="call-outline" size={20} color="gray" />
                      <Text style={styles.placeModalText}>
                        {selectedPlace.phoneNumber}
                      </Text>
                    </View>
                    {/* Website */}
                    <View style={styles.placeModalRow}>
                      <Icon name="earth" size={20} color="gray" />
                      <Text
                        style={styles.placeModalLink}
                        onPress={() => Linking.openURL(selectedPlace.website)}
                      >
                        {selectedPlace.website}
                      </Text>
                    </View>
                    {/* Opening Hours */}
                    <View style={styles.placeModalRow}>
                      <Icon name="time-outline" size={20} color="gray" />
                      <Text style={styles.placeModalText}>Opening Hours</Text>
                    </View>
                    {/* Opening Hours Details */}
                    {selectedPlace.openingHours &&
                    selectedPlace.openingHours.length > 0 ? (
                      <Text style={styles.openingHoursText}>
                        {formatOpeningHours(selectedPlace.openingHours)}
                      </Text>
                    ) : (
                      <Text style={styles.openingHoursText}>
                        No Opening Hours Available
                      </Text>
                    )}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Modal for Filters */}
        <Modal visible={showModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filters</Text>
              {/* Rating Filter */}
              <Text style={styles.filterLabel}>Rating: • at least</Text>
              <View style={styles.filterOptionsContainer}>
                {ratingOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.ratingFilterOption,
                      minRating === option.value ? styles.selectedOption : null,
                    ]}
                    onPress={() => setMinRating(option.value)}
                  >
                    <Text>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Hours Filter Options */}
              <Text style={styles.filterLabel}>Hours:</Text>
              <View style={styles.filterOptionsContainer}>
                <TouchableOpacity
                  onPress={() => setOpenNow("any")}
                  style={[
                    styles.hoursFilterOption,
                    openNow === "any" && styles.selectedOption,
                  ]}
                >
                  <Text>Any</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setOpenNow("open_now")}
                  style={[
                    styles.hoursFilterOption,
                    openNow === "open_now" && styles.selectedOption,
                  ]}
                >
                  <Text>Open Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setOpenNow("24_hours")}
                  style={[
                    styles.hoursFilterOption,
                    openNow === "24_hours" && styles.selectedOption,
                  ]}
                >
                  <Text>Open 24 Hours</Text>
                </TouchableOpacity>
              </View>
              {/* Filter Buttons */}
              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.filterButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyFilterButton}
                  onPress={applyFilters}
                >
                  <Text style={styles.filterButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "40%",
  },
  fullScreenMap: {
    width: "100%",
    height: "100%",
  },
  fullScreenButton: {
    position: "absolute",
    bottom: "62%", // Adjust to be above the GPS location button
    right: 70, // Align it to the right, similar to the GPS button
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 25,
    padding: 10,
    zIndex: 2, // Ensures it appears on top of the GPS button
  },
  exitfullScreenButton: {
    position: "absolute",
    bottom: 30,
    left: "45%",
    backgroundColor: "2D2D2D",
    borderRadius: 30,
    padding: 10,
  },
  searchContainer: {
    position: "absolute",
    width: "75%",
    top: 45,
    right: 20,
    flexDirection: "row",
    zIndex: 10  
  },
  touchableArea: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF", // Background for the search bar
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F5A623",
    flex: 1, // Make it take up available space
    height: 43, // Increase height for better tap area
    paddingHorizontal: 10, // Add horizontal padding for aesthetics
  },
  searchIcon: {
    marginHorizontal: 10, // Space between icon and input
  },
  searchInput: {
    flex: 1, // Take full width of touchable area
    height: 42, // Input height
    backgroundColor: "transparent", // Make input background transparent
    borderWidth: 0, // No border for the input
    paddingVertical: 0, // No vertical padding for alignment
    paddingHorizontal: 5, // Add some horizontal padding for text alignment
  },
  clearButton: {
    padding: 5, // Padding for clear button
    justifyContent: "center", // Center icon
    alignItems: "center", // Center icon
  },
  placeList: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  cardRating: {
    fontSize: 14,
    color: "#FFD700",
  },
  cardDistance: {
    fontSize: 14,
    color: "#777",
    marginLeft: 10,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  cardStatus: {
    fontSize: 14,
    color: "green",
    marginBottom: 4,
  },
  cardDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  cardAmenityDetails: {
    fontSize: 14,
    color: "#777",
    marginLeft: 6,
    flexShrink: 1,
  },
  icon: {
    color: "#F5A623",
    padding: 10,
  },
  placeInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  placeCloseButton: {
    position: "absolute",
    top: 5,
    right: 8,
    padding: 10,
  },
  placeCloseText: {
    fontSize: 25,
    color: "#000",
    fontWeight: "bold",
  },
  placeModalCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 15,
    width: "85%",
    paddingBottom: 10,
    maxHeight: 650,
    overflow: "hidden",
  },
  placeModalImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  placeModalContent: {
    width: "97%",
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  placeModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeDistance: {
    color: "#777",
    marginLeft: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  placeStatusText: {
    fontWeight: "bold",
    marginTop: 6,
    marginBottom: 10,
  },
  placeModalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  placeModalText: {
    color: "#333",
    marginLeft: 10,
    marginRight: 10,
  },
  placeModalLink: {
    color: "#8675E6",
    marginLeft: 10,
    marginRight: 10,
  },
  openingHoursText: {
    color: "#555",
    marginTop: 5,
    marginLeft: 29,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 5,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingRight: 20,
  },
  filterOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  ratingFilterOption: {
    paddingVertical: Platform.OS === "ios" ? 10 : 8, // iOS uses 10, Android uses 8
    paddingHorizontal: Platform.OS === "ios" ? 13 : 10, // iOS uses 13, Android uses 11
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  hoursFilterOption: {
    paddingVertical: Platform.OS === "ios" ? 10 : 8, // iOS uses 10, Android uses 8
    paddingHorizontal: Platform.OS === "ios" ? 16 : 9, // iOS uses 16, Android uses 14
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedOption: {
    backgroundColor: "#ddd",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#333",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  filterButton: {
    padding: 10,
    marginRight: 8,
    backgroundColor: "#FFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  applyFilterButton: {
    paddingTop: Platform.OS === "ios" ? 16 : 14,
    paddingBottom: Platform.OS === "ios" ? 16 : 14,
    width: "45%",
    alignSelf: "center",
    backgroundColor: "#FFA04A",
    borderRadius: 10,
  },
  clearFilterButton: {
    paddingTop: Platform.OS === "ios" ? 16 : 14,
    paddingBottom: Platform.OS === "ios" ? 16 : 14,
    width: "45%",
    alignSelf: "center",
    backgroundColor: "#a3a3a3",
    borderRadius: 10,
  },
  filterButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  sortButton: {
    padding: 10,
    backgroundColor: "#FFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sortOptionText: {
    fontSize: 15,
  },
  dropdownContainer: {
    position: "absolute",
    right: 15,
    top: Platform.OS === "ios" ? 430 : 350,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    // iOS shadow properties
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    // Android shadow properties
    elevation: 10, // Elevation for Android
    zIndex: 999, // Ensure it appears above other content
  },
  dropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  hoverStyle: {
    backgroundColor: "#f0f0f0",
  },
  activeButton: {
    backgroundColor: "#d3d3d3",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  centeredText: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
  },
  userLocationButtonExpanded: {
    position: "absolute",
    bottom: 30, // Adjusted to be near the bottom of the screen
    right: 20, // Positioned to the right side
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  userLocationButton: {
    position: "absolute",
    bottom: "62%",
    right: 20,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
});

export default Nearby;
