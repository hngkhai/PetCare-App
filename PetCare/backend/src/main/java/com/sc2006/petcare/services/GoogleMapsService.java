package com.sc2006.petcare.services;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.cloud.firestore.DocumentReference;
import com.sc2006.petcare.DTO.DayTimeDTO;
import com.sc2006.petcare.DTO.PlaceDetailsDTO;
import com.sc2006.petcare.DTO.PlaceOpeningHoursDTO;
import com.sc2006.petcare.models.LocationModel;
import com.sc2006.petcare.models.PetcareAmenityModel;
import com.sc2006.petcare.repositories.LocationRepository;
import com.sc2006.petcare.repositories.PetcareAmenityRepository;

@Service
public class GoogleMapsService {
    @Value("${google.maps.api.key}")
    private String apiKey;

    @Autowired
    private PetcareAmenityRepository petcareAmenityRepository;

    @Autowired
    private LocationRepository locationRepository;

    public List<PlaceDetailsDTO> searchNearbyPetCare(double latitude, double longitude, int radius,
            List<String> keywords) throws Exception {
        List<PlaceDetailsDTO> placeDTOList = new ArrayList<>();
        long twentyFourHoursInMillis = 24 * 60 * 60 * 1000; // 24 hours
        deleteOldPlaces(twentyFourHoursInMillis);

        for (String keyword : keywords) {
            String urlString = String.format(
                    "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=%f,%f&radius=%d&keyword=%s&key=%s",
                    latitude, longitude, radius, keyword, apiKey);
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            String inputLine;
            StringBuilder response = new StringBuilder();
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();
            conn.disconnect();

            JSONObject jsonResponse = new JSONObject(response.toString());
            JSONArray places = jsonResponse.getJSONArray("results");

            // for (int i = 0; i < places.length(); i++) {
            // Limit to the first 10 results
            for (int i = 0; i < Math.min(places.length(), 10); i++) {
                JSONObject place = places.getJSONObject(i);
                List<PlaceOpeningHoursDTO> openingPeriods = new ArrayList<>();

                // Access fields expected to always exist directly
                String placeId = place.getString("place_id");
                String name = place.getString("name");

                // Access optional fields with fallback defaults
                double rating = place.optDouble("rating", 0.0);
                String vicinity = place.optString("vicinity");
                double lat = place.optJSONObject("geometry").getJSONObject("location").getDouble("lat");
                double lng = place.optJSONObject("geometry").getJSONObject("location").getDouble("lng");

                // Fetch photo reference and convert to Base64
                String base64Photo = null;
                if (place.has("photos")) {
                    JSONArray photos = place.getJSONArray("photos");
                    String photoReference = photos.getJSONObject(0).getString("photo_reference");
                    base64Photo = fetchPhotoAsBase64(photoReference);
                }

                // Make a request to Place Details for each place
                String placeDetailsUrl = String.format(
                        "https://maps.googleapis.com/maps/api/place/details/json?place_id=%s&fields=formatted_phone_number,website,opening_hours&key=%s",
                        placeId, apiKey);
                URL detailsUrl = new URL(placeDetailsUrl);
                HttpURLConnection detailsConn = (HttpURLConnection) detailsUrl.openConnection();
                detailsConn.setRequestMethod("GET");
                BufferedReader detailsIn = new BufferedReader(new InputStreamReader(detailsConn.getInputStream()));
                StringBuilder detailsResponse = new StringBuilder();
                String detailsLine;
                while ((detailsLine = detailsIn.readLine()) != null) {
                    detailsResponse.append(detailsLine);
                }
                detailsIn.close();
                detailsConn.disconnect();

                JSONObject detailsJson = new JSONObject(detailsResponse.toString());
                JSONObject placeDetails = detailsJson.getJSONObject("result");

                JSONObject openingHours = placeDetails.optJSONObject("opening_hours");
                JSONArray periods = new JSONArray();
                boolean openNow = false;
                if (openingHours != null) {
                    openNow = openingHours.optBoolean("open_now", false);
                    periods = openingHours.optJSONArray("periods");
                    openingPeriods = parseOpeningHours(periods);
                } else {
                    openingPeriods.add(new PlaceOpeningHoursDTO(new DayTimeDTO(-1, "N/A"), null));
                }
                String phoneNumber = placeDetails.optString("formatted_phone_number", "N/A");
                String website = placeDetails.optString("website", "N/A");

                PlaceDetailsDTO placeDetailsDTO = new PlaceDetailsDTO(placeId, name, rating, base64Photo, openNow,
                        vicinity, lat, lng, phoneNumber, website, openingPeriods);
                placeDTOList.add(placeDetailsDTO);
            }
        }
        // Remove duplicate entries by placeId
        List<PlaceDetailsDTO> uniquePlaceDTOs = removeDuplicateLocations(placeDTOList);

        // Save unique places asynchronously
        for (PlaceDetailsDTO placeDetailsDTO : uniquePlaceDTOs) {
            CompletableFuture.runAsync(() -> savePlaceDTO(placeDetailsDTO));
        }

        return uniquePlaceDTOs;

    }

    public void deleteOldPlaces(long timeThreshold) {
        petcareAmenityRepository.deleteOldPlaces(timeThreshold);
    }

    public String saveOrUpdatePlaceDTO(PetcareAmenityModel petcareAmenityModel) {
        try {
            return petcareAmenityRepository.saveOrUpdatePlaceDetails(petcareAmenityModel);
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error saving or updating place details: " + e.getMessage());
            e.printStackTrace();
            // Return an error message
            return "Error saving or updating place details: " + e.getMessage();
        }
    }

    public String savePlaceDTO(PlaceDetailsDTO placeDetailsDTO) {
        try {
            // Map PlaceDetailsDTO to Location
            LocationModel locationModel = new LocationModel();
            locationModel.setLocationLatitude(placeDetailsDTO.getLatitude());
            locationModel.setLocationLongitude(placeDetailsDTO.getLongitude());
            locationModel.setLocationAddress(placeDetailsDTO.getVicinity());

            // Save Location and get the saved instance ID
            String locationId = locationRepository.saveOrUpdateLocation(locationModel);

            // Map PlaceDetailsDTO to PetcareAmenity
            PetcareAmenityModel petcareAmenityModel = new PetcareAmenityModel();
            petcareAmenityModel.setAmenityId(placeDetailsDTO.getId());
            petcareAmenityModel.setAmenityName(placeDetailsDTO.getName());
            petcareAmenityModel.setOpenNow(placeDetailsDTO.isOpenNow());
            petcareAmenityModel.setOpeningHours(placeDetailsDTO.getOpeningHours());
            petcareAmenityModel.setContactNumber(placeDetailsDTO.getPhoneNumber());
            petcareAmenityModel.setWebsiteURL(placeDetailsDTO.getWebsite());
            petcareAmenityModel.setRating(placeDetailsDTO.getRating());
            DocumentReference locationRef = locationRepository.getLocationDocReferenceByLocationId(locationId);
            petcareAmenityModel.setLocation(locationRef);
            petcareAmenityModel.setPhoto(placeDetailsDTO.getPhotoBase64());
            petcareAmenityModel.setTimestamp(new Date());

            // Save PetcareAmenity
            petcareAmenityRepository.saveOrUpdatePlaceDetails(petcareAmenityModel);

            return "Success";
        } catch (Exception e) {
            // Handle any exceptions
            System.err.println("Error saving place details: " + e.getMessage());
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }

    public List<PlaceOpeningHoursDTO> parseOpeningHours(JSONArray periods) {
        List<PlaceOpeningHoursDTO> openingPeriods = new ArrayList<>();

        if (periods != null) {
            for (int i = 0; i < periods.length(); i++) {
                JSONObject period = periods.getJSONObject(i);

                // Extract opening time details
                JSONObject openTime = period.optJSONObject("open");
                DayTimeDTO open = null;
                if (openTime != null) {
                    int openDay = openTime.optInt("day", -1);
                    String openTimeStr = openTime.optString("time", null);
                    open = new DayTimeDTO(openDay, openTimeStr);
                }

                // Extract closing time details
                JSONObject closeTime = period.optJSONObject("close");
                DayTimeDTO close = null;
                if (closeTime != null) {
                    int closeDay = closeTime.optInt("day", -1);
                    String closeTimeStr = closeTime.optString("time", null);
                    close = new DayTimeDTO(closeDay, closeTimeStr);
                }

                // Add to the list of opening hours
                openingPeriods.add(new PlaceOpeningHoursDTO(open, close));
            }
        } else {
            openingPeriods.add(new PlaceOpeningHoursDTO(new DayTimeDTO(-1, "N/A"), null));
        }
        return openingPeriods;
    }

    /* Filter By Rating, OpenNow or Both */
    public List<String> filterLocations(List<String> placeIds, Double minRating, String openNow) throws Exception {
        // Retrieve the sorted list of PetcareAmenityModel objects
        List<String> filteredLocations = petcareAmenityRepository.filterLocations(placeIds, minRating, openNow);
        return filteredLocations;
    }

    public List<PlaceDetailsDTO> searchLocationByKeyword(double latitude, double longitude, int radius, String keyword, List<String> types) throws Exception {
        List<PlaceDetailsDTO> petcareAmenityList = new ArrayList<>();

        long twentyFourHoursInMillis = 24 * 60 * 60 * 1000; // 24 hours
        deleteOldPlaces(twentyFourHoursInMillis);
        for (String type : types) {
            String urlString = String.format(
                    "https://maps.googleapis.com/maps/api/place/textsearch/json?query=%s&location=%f,%f&radius=%d&key=%s&type=%s",
                    keyword, latitude, longitude, radius, apiKey, type);

            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder response = new StringBuilder();
            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();
            conn.disconnect();

            JSONObject jsonResponse = new JSONObject(response.toString());
            JSONArray places = jsonResponse.getJSONArray("results");

            for (int i = 0; i < Math.min(places.length(), 10); i++) {
                JSONObject place = places.getJSONObject(i);
                List<PlaceOpeningHoursDTO> openingPeriods = new ArrayList<>();

                // Access fields expected to always exist directly
                String placeId = place.getString("place_id");
                String name = place.getString("name");
                // Access optional fields with fallback defaults
                Double rating = place.optDouble("rating", 0.0);
                String vicinity = place.optString("formatted_address");
                double lat = place.optJSONObject("geometry").getJSONObject("location").getDouble("lat");
                double lng = place.optJSONObject("geometry").getJSONObject("location").getDouble("lng");

                // Fetch photo reference and convert to Base64
                String base64Photo = null;
                if (place.has("photos")) {
                    JSONArray photos = place.getJSONArray("photos");
                    String photoReference = photos.getJSONObject(0).getString("photo_reference");
                    base64Photo = fetchPhotoAsBase64(photoReference);
                }

                // Make a request to Place Details for each place
                String placeDetailsUrl = String.format(
                        "https://maps.googleapis.com/maps/api/place/details/json?place_id=%s&fields=formatted_phone_number,website,opening_hours&key=%s",
                        placeId, apiKey);
                URL detailsUrl = new URL(placeDetailsUrl);
                HttpURLConnection detailsConn = (HttpURLConnection) detailsUrl.openConnection();
                detailsConn.setRequestMethod("GET");
                BufferedReader detailsIn = new BufferedReader(new InputStreamReader(detailsConn.getInputStream()));
                StringBuilder detailsResponse = new StringBuilder();
                String detailsLine;
                while ((detailsLine = detailsIn.readLine()) != null) {
                    detailsResponse.append(detailsLine);
                }
                detailsIn.close();
                detailsConn.disconnect();

                JSONObject detailsJson = new JSONObject(detailsResponse.toString());
                JSONObject placeDetails = detailsJson.getJSONObject("result");

                JSONObject openingHours = placeDetails.optJSONObject("opening_hours");
                JSONArray periods = new JSONArray();
                boolean openNow = false;
                if (openingHours != null) {
                    openNow = openingHours.optBoolean("open_now", false);
                    periods = openingHours.optJSONArray("periods");
                    openingPeriods = parseOpeningHours(periods);
                } else {
                    openingPeriods.add(new PlaceOpeningHoursDTO(new DayTimeDTO(-1, "N/A"), null));
                }
                String phoneNumber = placeDetails.optString("formatted_phone_number", "N/A");
                String website = placeDetails.optString("website", "N/A");

                PlaceDetailsDTO placeDetailsDTO = new PlaceDetailsDTO(placeId, name, rating, base64Photo, openNow,
                        vicinity,
                        lat, lng, phoneNumber, website, openingPeriods);

                // Save the result asynchronously
                // CompletableFuture.runAsync(() -> savePlaceDTO(placeDetailsDTO));
                petcareAmenityList.add(placeDetailsDTO);
            }
        }
        // Remove duplicate entries by placeId
        List<PlaceDetailsDTO> uniquePlaceDTOs = removeDuplicateLocations(petcareAmenityList);
        // Save unique places asynchronously
        for (PlaceDetailsDTO placeDetailsDTO : uniquePlaceDTOs) {
            CompletableFuture.runAsync(() -> savePlaceDTO(placeDetailsDTO));
        }
        return uniquePlaceDTOs;
    }

    public List<PlaceDetailsDTO> removeDuplicateLocations(List<PlaceDetailsDTO> placeDTOList) {
        Set<String> uniquePlaceIds = new HashSet<>();
        List<PlaceDetailsDTO> uniquePlaces = new ArrayList<>();

        for (PlaceDetailsDTO place : placeDTOList) {
            // If place is added successfully, it is unique
            if (uniquePlaceIds.add(place.getId())) {
                uniquePlaces.add(place);
            }
        }
        return uniquePlaces;
    }

    private String fetchPhotoAsBase64(String photoReference) throws Exception {
        String photoUrl = String.format(
                "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=%s&key=%s",
                photoReference, apiKey);
        String imageString = "";
        URL url = new URL(photoUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (BufferedInputStream in = new BufferedInputStream(conn.getInputStream())) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = in.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        }
        conn.disconnect();

        byte[] imageBytes = outputStream.toByteArray();
        imageString = Base64.getEncoder().encodeToString(imageBytes);
        return imageString;
    }
}