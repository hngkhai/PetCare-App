package com.sc2006.petcare.repositories;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.sc2006.petcare.models.AdoptionModel;


@Repository
public class AdoptionRepository {
    private final Firestore dbFireStore;
    private final CollectionReference petCollection;
    

    
    @Autowired
    public AdoptionRepository(Firestore dbFireStore) {
        this.dbFireStore = dbFireStore;
        this.petCollection = dbFireStore.collection("Adoption");
        System.out.println("Connecting to Database....");
    }

    public String addAdoption(AdoptionModel adoptionModel) {
        System.out.println("in");
        DocumentReference petRef = dbFireStore.collection("Adoption").document();
        //adoptionModel.setId(petRef.getId());
        /* 
        System.out.println(adoptionModel.getImagesList());
        Map<String, Object> petData = new HashMap<>();
        petData.put("petName",adoptionModel.getPetName());
        petData.put("sex",adoptionModel.getSex());
        petData.put("age", adoptionModel.getAge());
        petData.put("type", adoptionModel.getType());
        petData.put("breed", adoptionModel.getBreed());
        petData.put("coatColor", adoptionModel.getCoatColor());      
        petData.put("description", adoptionModel.getDescription());
        petData.put("images", adoptionModel.getImagesList());
        petData.put("owner",adoptionModel.getOwner());
        petData.put("adptName", adoptionModel.getAdptName());
        petData.put("adptNumber", adoptionModel.getAdptNumber());
        petData.put("adptEmail", adoptionModel.getAdptEmail());
        */
        
        try {
            ApiFuture<WriteResult> future = petRef.set(adoptionModel);
             // Throws an exception if the operation fails
            System.out.print(future.get());
            return "Added successfully";
        } catch (Exception e) {
            return "Error adding pet: " + e.getMessage();
        }
    }

    public String editAdoption(String petId,AdoptionModel adoptionModel) {
        DocumentReference petRef = dbFireStore.collection("Adoption").document(petId);
        //adoptionModel.setId(petRef.getId());
        try {
            ApiFuture<WriteResult> future = petRef.set(adoptionModel);
            future.get(); // Throws an exception if the operation fails
            return "Edited successfully";
        } catch (Exception e) {
            return "Error editing pet: " + e.getMessage();
        }
    }

    public AdoptionModel getIndividualPet(String petId)throws Exception{
        DocumentReference petRef = dbFireStore.collection("Adoption").document(petId);
        ApiFuture<DocumentSnapshot> future = petRef.get();
        DocumentSnapshot documents = future.get();

        AdoptionModel adp = new AdoptionModel();
        try {
            adp = documents.toObject(AdoptionModel.class);
            System.out.printf( "Retrieve %s successfully",petId);
        } catch (Exception e) {
            System.out.print("Error retrieving pet: " + e.getMessage());
        }
        return adp;
    }

    public List<AdoptionModel> getAllAdoption() throws Exception {
        ApiFuture<QuerySnapshot> future = petCollection.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        List<AdoptionModel> adoptionList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            AdoptionModel pet = document.toObject(AdoptionModel.class);
            pet.setId(document.getId());
            adoptionList.add(pet);
        }
        return adoptionList;
    }

     public List<AdoptionModel> getAdoptionByAdp(String userId) throws ExecutionException, InterruptedException {
        // Get the DocumentReference for the owner
        DocumentReference ownerRef = dbFireStore.collection("User").document(userId);
        // Query Pet collection where the owner field matches the ownerRef
        ApiFuture<QuerySnapshot> future = petCollection.whereEqualTo("owner", ownerRef).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<AdoptionModel> adpList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            AdoptionModel pet = document.toObject(AdoptionModel.class);
            adpList.add(pet);
        }
        //System.out.print(adpList.size());
        return adpList;
    }

    public String deletePet(String petId) {
        try {
            dbFireStore.collection("Adoption").document(petId).delete();
            return "Deleted successfully";
        } catch (Exception e) {
            return "Error deleting pet" + e.getMessage();
        }
    }

}
