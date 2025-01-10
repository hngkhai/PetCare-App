package com.sc2006.petcare.repositories;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.sc2006.petcare.models.PetModel;

import java.util.HashMap;
import java.util.Map;

@Repository
public class PetRepository {

    private final Firestore dbFireStore;
    private final CollectionReference petCollection;

    @Autowired
    public PetRepository(Firestore dbFireStore) {
        this.dbFireStore = dbFireStore;
        this.petCollection = dbFireStore.collection("Pet");
    }

    public DocumentReference getPetDocReferenceByPetId(String petId) {
        return petCollection.document(petId);
    }

    public List<PetModel> getPetsByUserId(String userId) throws ExecutionException, InterruptedException {
        // Get the DocumentReference for the owner
        DocumentReference ownerRef = dbFireStore.collection("User").document(userId);
        // Query Pet collection where the owner field matches the ownerRef
        ApiFuture<QuerySnapshot> future = petCollection.whereEqualTo("owner", ownerRef).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        List<PetModel> petList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            PetModel pet = document.toObject(PetModel.class);
            petList.add(pet);
        }
        return petList;
    }

    public String addPet(PetModel petModel) {
        DocumentReference petRef = dbFireStore.collection("Pet").document();
        try {
            ApiFuture<WriteResult> future = petRef.set(petModel);
            future.get(); // Throws an exception if the operation fails
            return "Added successfully";
        } catch (Exception e) {
            return "Error adding pet: " + e.getMessage();
        }
    }

    public String updatePet(PetModel petModel) {
        // Convert PetModel to a Map and remove null fields
        Map<String, Object> updateFields = new HashMap<>();
        updateFields.put("petName", petModel.getPetName());
        updateFields.put("sex", petModel.getSex());
        updateFields.put("breed", petModel.getBreed());
        updateFields.put("dateOfBirth", petModel.getDateOfBirth());
        updateFields.put("weight", petModel.getWeight());
        updateFields.put("medicCondition", petModel.getMedicCondition());
        updateFields.put("markings", petModel.getMarkings());
        updateFields.put("coatColor", petModel.getCoatColor());
        updateFields.put("owner", petModel.getOwner());
        updateFields.put("petImageUrl", petModel.getPetImageUrl());

        // Get Firestore document reference and update fields
        DocumentReference docRef = dbFireStore.collection("Pet").document(petModel.getId());
        try {
            docRef.update(updateFields).get();
            return "Pet updated successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to update pet", e);
        }
    }

    public String deletePet(String petId) {
        try {
            dbFireStore.collection("Pet").document(petId).delete();
            return "Deleted successfully";
        } catch (Exception e) {
            return "Error deleting pet" + e.getMessage();
        }
    }
}