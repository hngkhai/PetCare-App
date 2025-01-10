package com.sc2006.petcare.repositories;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.sc2006.petcare.models.LocationModel;

@Repository
public class LocationRepository {
    private final Firestore dbFireStore;
    private final CollectionReference locationCollection;

    @Autowired
    public LocationRepository(Firestore dbFireStore) {
        this.dbFireStore = dbFireStore;
        this.locationCollection = dbFireStore.collection("Location");
    }

    public String save(LocationModel locationModel) {
        DocumentReference locationRef = dbFireStore.collection("Location").document();
        try {
            ApiFuture<WriteResult> future = locationRef.set(locationModel);
            future.get(); // Throws an exception if the operation fails
            System.out.println("save in location repo");
            return locationRef.getId(); // return the generated id of the added location
        } catch (Exception e) {
            return "Error adding location: " + e.getMessage();
        }
    }

    public String saveOrUpdateLocation(LocationModel locationModel) {
        try {
            // Create a query to check if a location with the same latitude and longitude already exists
            ApiFuture<QuerySnapshot> future = dbFireStore.collection("Location")
                .whereEqualTo("locationLatitude", locationModel.getLocationLatitude())
                .whereEqualTo("locationLongitude", locationModel.getLocationLongitude())
                .get();
    
            QuerySnapshot querySnapshot = future.get();
    
            if (!querySnapshot.isEmpty()) {
                // If a location with the same coordinates exists, update it
                DocumentReference existingLocationRef = querySnapshot.getDocuments().get(0).getReference();
                ApiFuture<WriteResult> updateFuture = existingLocationRef.set(locationModel);
                updateFuture.get(); // Wait for the update operation to complete
                System.out.println("Location updated with ID: " + existingLocationRef.getId());
                return existingLocationRef.getId(); // Return the existing document ID
            } else {
                // If no existing location, create a new location
                DocumentReference newLocationRef = dbFireStore.collection("Location").document();
                ApiFuture<WriteResult> saveFuture = newLocationRef.set(locationModel);
                saveFuture.get(); // Wait for the save operation to complete
                System.out.println("New location saved with ID: " + newLocationRef.getId());
                return newLocationRef.getId(); // Return the new document ID
            }
        } catch (Exception e) {
            return "Error saving or updating location: " + e.getMessage();
        }
    }
    

    public LocationModel getLocationById(String locationId) throws Exception {
        // Create a query against the collection where 'locationId' matches the parameter
        ApiFuture<QuerySnapshot> future = locationCollection.whereEqualTo("locationId", locationId).get();
        
        // Get query results
        QuerySnapshot querySnapshot = future.get();
        
        // Get the first document that matches the query
        QueryDocumentSnapshot document = querySnapshot.getDocuments().get(0);
        LocationModel location = document.toObject(LocationModel.class);

        return location;
    }

    public DocumentReference getLocationDocReferenceByLocationId(String locationId) {
        DocumentReference locationRef = dbFireStore.collection("Location").document(locationId);
        return locationRef;
    }
}
