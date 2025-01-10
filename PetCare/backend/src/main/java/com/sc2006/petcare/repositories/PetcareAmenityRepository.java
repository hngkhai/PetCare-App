package com.sc2006.petcare.repositories;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.sc2006.petcare.DTO.PlaceOpeningHoursDTO;
import com.sc2006.petcare.models.PetcareAmenityModel;

@Repository
public class PetcareAmenityRepository {
    private final Firestore dbFireStore;
    private final CollectionReference petcareAmenityCollection;

    @Autowired
    public PetcareAmenityRepository(Firestore dbFireStore) {
        this.dbFireStore = dbFireStore;
        this.petcareAmenityCollection = dbFireStore.collection("PetcareAmenity");
    }

    public String save(PetcareAmenityModel petcareAmenityModel) {
        DocumentReference petcareAmenityRef = dbFireStore.collection("PetcareAmenity").document();
        try {
            ApiFuture<WriteResult> future = petcareAmenityRef.set(petcareAmenityModel);
            future.get();
            return "Added successfully";
        } catch (Exception e) {
            return "Error adding petcare amenity: " + e.getMessage();
        }
    }

    public List<PetcareAmenityModel> getNearbyAmenities() throws Exception {
        ApiFuture<QuerySnapshot> future = petcareAmenityCollection.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        List<PetcareAmenityModel> petAmenityList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            PetcareAmenityModel petcareAmenity = document.toObject(PetcareAmenityModel.class);
            petAmenityList.add(petcareAmenity);
        }
        return petAmenityList;
    }

    public String saveOrUpdatePlaceDetails(PetcareAmenityModel petcareAmenityModel) {
        try {
            // Fetch document with the same placeId
            DocumentReference petcareAmenityRef = dbFireStore.collection("PetcareAmenity")
                    .document(petcareAmenityModel.getAmenityId());
            ApiFuture<DocumentSnapshot> future = petcareAmenityRef.get();
            DocumentSnapshot document = future.get();
            // If document exists, update "openNow" and "timestamp"
            if (document.exists()) {
                ApiFuture<WriteResult> updateFuture = petcareAmenityRef.update(
                        "openNow", petcareAmenityModel.isOpenNow(),
                        "timestamp", new Date());
                updateFuture.get();
                System.out.println("Place updated successfully.");
                // Else add the new place to Firestore
            } else {
                ApiFuture<WriteResult> setFuture = petcareAmenityRef.set(petcareAmenityModel);
                setFuture.get();
                System.out.println("New place added successfully.");
            }
        } catch (Exception e) {
            System.err.println("An unexpected error occurred: " + e.getMessage());
            return "Error: " + e.getMessage();
        }
        return "Operation completed successfully";
    }

    public void deleteOldPlaces(long timeThreshold) {
        try {
            // Time threshold in milliseconds, e.g., 24 hours = 24 * 60 * 60 * 1000
            long currentTime = System.currentTimeMillis();
            long validTimeRange = currentTime - timeThreshold;
            // Query Firestore to find places older than the time threshold
            ApiFuture<QuerySnapshot> future = dbFireStore.collection("PetcareAmenity")
                    .whereLessThan("timestamp", validTimeRange) // Find places older than the threshold
                    .get();
            QuerySnapshot querySnapshot = future.get();
            for (DocumentSnapshot document : querySnapshot.getDocuments()) {
                ApiFuture<WriteResult> writeResult = document.getReference().delete();
                writeResult.get();
                System.out.println("Old place deleted successfully: " + document.getId());
            }
        } catch (Exception e) {
            System.err.println("Error deleting old places: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // filter locations by passing in the filtering options and amenityIds
    public List<String> filterLocations(List<String> placeIds, Double minRating, String openNow) throws Exception {
        List<String> locationIds = new ArrayList<>();
        if (placeIds == null || placeIds.isEmpty()) {
            throw new IllegalArgumentException("Place IDs list cannot be null or empty.");
        }
        // Firestore allows a maximum of 10 items in whereIn, so we batch the requests if placeIds has more than 10 items.
        int batchSize = 10;
        List<ApiFuture<QuerySnapshot>> querySnapshots = new ArrayList<>();
    
        // Split placeIds into batches of 10 if necessary
        for (int i = 0; i < placeIds.size(); i += batchSize) {
            List<String> batchIds = placeIds.subList(i, Math.min(placeIds.size(), i + batchSize));
            Query query = petcareAmenityCollection.whereIn("amenityId", batchIds);
            if (minRating != null) {
                query = query.whereGreaterThanOrEqualTo("rating", minRating);
            }
            if (openNow != null && (openNow.equals("open_now") || openNow.equals("24_hours"))) {
                query = query.whereEqualTo("open_now", true);
            }
            querySnapshots.add(query.get());
        }
    
        // Process all query results
        for (ApiFuture<QuerySnapshot> future : querySnapshots) {
            for (QueryDocumentSnapshot document : future.get().getDocuments()) {    
                // Convert document to PetcareAmenityModel
                PetcareAmenityModel petcareAmenity = document.toObject(PetcareAmenityModel.class);
                // Handle open 24-hours logic manually
                if (openNow != null && openNow.equals("24_hours")) {
                    boolean is24Hours = checkIfOpen24Hours(petcareAmenity.getOpeningHours());
                    if (is24Hours) {
                        locationIds.add(petcareAmenity.getAmenityId());
                    }
                } else {
                    // If not filtering by 24-hours, just add the location ID
                    locationIds.add(petcareAmenity.getAmenityId());
                }
            }
        }
        System.out.println(locationIds);
        return locationIds; 
    }
    

    // Helper method to check if the opening hours indicate 24 hours
    private boolean checkIfOpen24Hours(List<PlaceOpeningHoursDTO> openingHours) {
        // Loop through each day's opening hours and check if it spans the full day
        // (e.g., open at "00:00" and close at "23:59")
        for (PlaceOpeningHoursDTO hours : openingHours) {
            if (hours.getOpen() != null && hours.getClose() != null) {
                String openTime = hours.getOpen().getTime();
                String closeTime = hours.getClose().getTime();
                if (openTime.equals("0000") && closeTime.equals("2359")) {
                    return true; // This location is open 24 hours
                }
            }
        }
        return false;
    }
}