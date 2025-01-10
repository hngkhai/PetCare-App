package com.sc2006.petcare.repositories;

import com.sc2006.petcare.models.MissingPetModel;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class MissingPetRepository {
    private final Firestore dbFireStore;
    private final CollectionReference missingCollection;

    @Autowired
    public MissingPetRepository(Firestore dbFireStore) {
        this.dbFireStore = dbFireStore;
        this.missingCollection = dbFireStore.collection("MissingPet");
    }

    public boolean existsActiveMissingPet(String petId) {
        DocumentReference petReference = dbFireStore.collection("Pet").document(petId);

        Query query = dbFireStore.collection("MissingPet")
                .whereEqualTo("missingPet", petReference)
                .whereEqualTo("active", true); // Check if active

        try {
            // Execute the query and get the snapshot
            QuerySnapshot querySnapshot = query.get().get();
            // Check if any documents were found
            List<QueryDocumentSnapshot> documents = querySnapshot.getDocuments();
            return !documents.isEmpty(); // Returns true if at least one active missing pet is found
        } catch (Exception e) {
            e.printStackTrace();
            return false; // Handle exceptions as needed
        }
    }

    public DocumentReference getMissingDocReferenceByMissingId(String missingId) {
        return missingCollection.document(missingId);
    }

    // Method to update the MissingPet sightingList array
    public String updateMissingPetSightingList(String missingId, DocumentReference sightingRef) {
        // Get the MissingPet document reference by petId
        DocumentReference missingPetRef = getMissingDocReferenceByMissingId(missingId);

        // Use Firestore arrayUnion to add sightingRef to sightingList array in
        // MissingPet document
        ApiFuture<WriteResult> future = missingPetRef.update("sightingList", FieldValue.arrayUnion(sightingRef));

        // Wait for the update to complete
        try {
            WriteResult result = future.get();
            return "MissingPet updated : " + missingId;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update MissingPet sightingList", e);
        }
    }

    public List<MissingPetModel> getAllMissingPets() throws Exception {
        ApiFuture<QuerySnapshot> future = missingCollection.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        List<MissingPetModel> missingList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            MissingPetModel sighting = document.toObject(MissingPetModel.class);
            missingList.add(sighting);
        }
        return missingList;
    }

    public MissingPetModel getMissingById(String missingId) throws ExecutionException, InterruptedException {
        DocumentReference missingRef = dbFireStore.collection("MissingPet").document(missingId);

        // Fetch the document snapshot
        ApiFuture<DocumentSnapshot> future = missingRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return document.toObject(MissingPetModel.class);
        } else {
            System.out.println("Missing Pet with ID " + missingId + " does not exist.");
            return null;
        }
    }

    public String addMissingPet(MissingPetModel missingPetModel) {
        DocumentReference missingRef = dbFireStore.collection("MissingPet").document();
        try {
            ApiFuture<WriteResult> future = missingRef.set(missingPetModel);
            future.get();
            return missingRef.getId();
        } catch (Exception e) {
            return "Error adding missing pet: " + e.getMessage();
        }
    }

    public String markFound(MissingPetModel missingModel, String missingId) {
        DocumentReference missingRef = dbFireStore.collection("MissingPet").document(missingId);
        try {
            ApiFuture<WriteResult> future = missingRef.set(missingModel);
            future.get(); // Throws an exception if the operation fails
            return missingRef.getId() + " marked as found!";
        } catch (Exception e) {
            return "Error editing missing pet: " + e.getMessage();
        }
    }
}
