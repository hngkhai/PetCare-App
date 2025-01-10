package com.sc2006.petcare.repositories;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.sc2006.petcare.models.SightingModel;

@Repository
public class SightingRepository {
    private final Firestore dbFireStore;
    private final CollectionReference sightingCollection;

    @Autowired
    public SightingRepository(Firestore dbFireStore) {
        this.dbFireStore = dbFireStore;
        this.sightingCollection = dbFireStore.collection("MissingPetSighting");
    }

    public DocumentReference getSightingDocReferenceBySightingId(String sightingId) {
        return sightingCollection.document(sightingId);
    }

    public List<SightingModel> getAllSightings() throws Exception {
        ApiFuture<QuerySnapshot> future = sightingCollection.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        List<SightingModel> sightingList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            SightingModel sighting = document.toObject(SightingModel.class);
            sightingList.add(sighting);
        }
        return sightingList;
    }

    public String addSighting(SightingModel sightingModel) {
        DocumentReference sightingRef = dbFireStore.collection("MissingPetSighting").document();
        try {
            ApiFuture<WriteResult> future = sightingRef.set(sightingModel);
            future.get(); // Throws an exception if the operation fails
            return sightingRef.getId();
        } catch (Exception e) {
            return "Error adding sighting: " + e.getMessage();
        }
    }

}
