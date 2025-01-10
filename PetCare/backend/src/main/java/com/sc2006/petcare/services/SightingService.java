package com.sc2006.petcare.services;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.GeoPoint;
import com.sc2006.petcare.DTO.SightingDTO;
import com.sc2006.petcare.DTO.SightingInputDTO;
import com.sc2006.petcare.models.SightingModel;
import com.sc2006.petcare.models.UserModel;
import com.sc2006.petcare.repositories.MissingPetRepository;
import com.sc2006.petcare.repositories.SightingRepository;
import com.sc2006.petcare.repositories.UserRepository;

@Service
public class SightingService {
    @Autowired
    private final SightingRepository sightingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MissingPetRepository missingRepository;

    @Autowired
    private FirebaseService firebaseService;

    public SightingService(SightingRepository sightingRepository) {
        this.sightingRepository = sightingRepository;
    }

    public List<SightingDTO> getAllSightings() {
        List<SightingDTO> sightingDetailsDTOs = new ArrayList<>();
        List<SightingModel> sightingList = new ArrayList<>();
        UserModel reporterContact;
        try {
            sightingList = sightingRepository.getAllSightings();
            if (sightingList.isEmpty()) {
                System.out.println("No sightings found in Firestore.");
            }
            for (SightingModel sighting : sightingList) {
                SightingDTO sightingDetailsDTO = new SightingDTO();

                sightingDetailsDTO.setSightingId(sighting.getId());
                sightingDetailsDTO.setSightingDescription(sighting.getSightingDescription());
                sightingDetailsDTO.setSightingImage(sighting.getSightingImage());

                // Convert timestamp to date object
                Timestamp sightingTimestamp = sighting.getSightingDateTime();
                Date sightingTime = sightingTimestamp != null ? sightingTimestamp.toDate() : null;
                sightingDetailsDTO.setSightingDateTime(sightingTime);

                // Set GeoPoint for the location
                GeoPoint location = sighting.getSightingLocation();
                if (location != null) {
                    sightingDetailsDTO.setSightingLocation(location);
                }

                System.out.println("herew");
                System.out.println(sighting);

                try {
                    // Fetch the document snapshot from the reference
                    ApiFuture<DocumentSnapshot> future = sighting.getReporterContact().get();
                    DocumentSnapshot document = future.get();
                    if (document.exists()) {
                        // Convert the document snapshot to a UserModel object
                        reporterContact = document.toObject(UserModel.class);
                    } else {
                        System.out.println("Reporter document does not exist.");
                        return null;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    return null;
                }
                sightingDetailsDTO.setReporterContact(reporterContact);
                sightingDetailsDTOs.add(sightingDetailsDTO);
            }
        } catch (Exception e) {
            System.err.println("Error retrieving sightings: " + e.getMessage());
            e.printStackTrace();
        }
        return sightingDetailsDTOs;
    }

    public String addSighting(SightingInputDTO sightingInputDTO) {
        SightingModel sightingModel = new SightingModel();
        sightingModel.setSightingDescription(sightingInputDTO.getSightingDescription());

        // Convert latitude and longitude to GeoPoint
        GeoPoint geoPoint = new GeoPoint(sightingInputDTO.getLatitude(), sightingInputDTO.getLongitude());
        sightingModel.setSightingLocation(geoPoint);

        // Convert date string to Date object
        Date sightingDateTime = sightingInputDTO.getSightingDateTime();

        // Convert Date to Firestore Timestamp
        Timestamp timestamp = Timestamp.of(sightingDateTime);
        sightingModel.setSightingDateTime(timestamp);

        // Get user document reference from Firestore
        DocumentReference userRef = userRepository.getUserDocReferenceByUserId(sightingInputDTO.getReporterId());
        sightingModel.setReporterContact(userRef);

        DocumentReference petRef = missingRepository.getMissingDocReferenceByMissingId(sightingInputDTO.getMissingId());
        sightingModel.setMissingPet(petRef);

        // upload image to firebase storage
        String imageURL = "missing_pet_sighting/" + sightingInputDTO.getSightingImage().getOriginalFilename();
        sightingModel.setSightingImage(imageURL);
        try {
            String newSightingId = sightingRepository.addSighting(sightingModel);
            firebaseService.upload(sightingInputDTO.getSightingImage(), imageURL);
            DocumentReference sightingRef = sightingRepository.getSightingDocReferenceBySightingId(newSightingId);

            String res = missingRepository.updateMissingPetSightingList(sightingInputDTO.getMissingId(), sightingRef);

            return res;
        } catch (Exception e) {
            // Handle other unexpected exceptions
            throw new RuntimeException("Failed to add sighting due to an unexpected error", e);
        }

        // Add sighting to Firestore
        // return sightingRepository.addSighting(sightingModel);
    }

}
