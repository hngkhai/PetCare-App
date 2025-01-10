package com.sc2006.petcare.services;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.GeoPoint;
import com.sc2006.petcare.DTO.MissingPetDTO;
import com.sc2006.petcare.DTO.MissingPetInputDTO;
import com.sc2006.petcare.models.MissingPetModel;
import com.sc2006.petcare.models.PetModel;
import com.sc2006.petcare.models.SightingModel;
import com.sc2006.petcare.models.UserModel;
import com.sc2006.petcare.repositories.MissingPetRepository;
import com.sc2006.petcare.repositories.PetRepository;
import com.sc2006.petcare.repositories.SightingRepository;
import com.sc2006.petcare.repositories.UserRepository;

@Service
public class MissingPetService {
    @Autowired
    private final MissingPetRepository missingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private SightingRepository sightingRepository;

    @Autowired
    private FirebaseService firebaseService;

    public MissingPetService(MissingPetRepository missingRepository) {
        this.missingRepository = missingRepository;
    }

    public List<MissingPetDTO> getAllMissingPets() {
        List<MissingPetDTO> sightingDetailsDTOs = new ArrayList<>();
        List<MissingPetModel> missingList = new ArrayList<>();
        UserModel ownerContact;
        PetModel petDetails;

        try {
            missingList = missingRepository.getAllMissingPets();
            if (missingList.isEmpty()) {
                System.out.println("No missing pets found in Firestore.");
            }
            for (MissingPetModel missing : missingList) {
                if (missing.isActive()) {

                    MissingPetDTO missingDetailsDTO = new MissingPetDTO();

                    missingDetailsDTO.setId(missing.getId());
                    missingDetailsDTO.setLastSeenDescription(missing.getLastSeenDescription());
                    missingDetailsDTO.setActive(missing.isActive());

                    // Convert timestamp to date object
                    Timestamp sightingTimestamp = missing.getLastSeenDateTime();
                    Date sightingTime = sightingTimestamp != null ? sightingTimestamp.toDate() : null;
                    missingDetailsDTO.setLastSeenDateTime(sightingTime);

                    // Set GeoPoint for the location
                    GeoPoint location = missing.getLastSeenLocation();
                    if (location != null) {
                        missingDetailsDTO.setLastSeenLocation(location);
                    }

                    // Convert timestamp to date object
                    Timestamp publishedTimestamp = missing.getPublishedTime();
                    Date publishedTime = publishedTimestamp != null ? publishedTimestamp.toDate() : null;
                    missingDetailsDTO.setPublishedTime(publishedTime);

                    try {
                        // Fetch the document snapshot from the reference
                        ApiFuture<DocumentSnapshot> future = missing.getMissingPet().get();
                        DocumentSnapshot document = future.get();
                        if (document.exists()) {
                            // Convert the document snapshot to a UserModel object
                            petDetails = document.toObject(PetModel.class);
                            if (petDetails != null) {
                                String petImageUrl = petDetails.getPetImageUrl();
                                if (petImageUrl != null && !petImageUrl.isEmpty()) {
                                    String petImage = firebaseService.getSignedUrlFromFileName(petImageUrl);
                                    petDetails.setPetImageUrl(petImage);
                                }
                            }
                        } else {
                            System.out.println("Pet document does not exist.");
                            return null;
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        return null;
                    }
                    missingDetailsDTO.setMissingPet(petDetails);

                    try {
                        // Fetch the document snapshot from the reference
                        ApiFuture<DocumentSnapshot> future = missing.getOwner().get();
                        DocumentSnapshot document = future.get();
                        if (document.exists()) {
                            // Convert the document snapshot to a UserModel object
                            ownerContact = document.toObject(UserModel.class);
                        } else {
                            System.out.println("User document does not exist.");
                            return null;
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        return null;
                    }
                    missingDetailsDTO.setOwner(ownerContact);

                    // Fetch the sightings
                    List<SightingModel> sightings = new ArrayList<>();
                    for (DocumentReference sightingRef : missing.getSightingList()) {
                        try {
                            ApiFuture<DocumentSnapshot> future = sightingRef.get();
                            DocumentSnapshot document = future.get();
                            if (document.exists()) {
                                SightingModel sighting = document.toObject(SightingModel.class);
                                sightings.add(sighting);
                            } else {
                                System.out
                                        .println("Sighting document does not exist for reference: "
                                                + sightingRef.getId());
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                    missingDetailsDTO.setSightingList(sightings);

                    sightingDetailsDTOs.add(missingDetailsDTO);
                }
            }
        } catch (Exception e) {
            System.err.println("Error retrieving sightings: " + e.getMessage());
            e.printStackTrace();
        }
        return sightingDetailsDTOs;
    }

    public MissingPetDTO getMissingById(String missingId) {
        List<MissingPetDTO> sightingDetailsDTOs = new ArrayList<>();

        MissingPetDTO missingDetailsDTO = new MissingPetDTO();
        UserModel ownerContact;
        PetModel petDetails;

        try {
            // Fetch the article using the provided missingId
            MissingPetModel missing = missingRepository.getMissingById(missingId);

            if (missing == null) {
                System.out.println("No missing pet found with ID: " + missingId);
                return missingDetailsDTO; // Return empty DTO instead of null
            }

            missingDetailsDTO.setId(missing.getId());
            missingDetailsDTO.setLastSeenDescription(missing.getLastSeenDescription());
            missingDetailsDTO.setActive(missing.isActive());

            missingDetailsDTO.setLastSeenImage(firebaseService.getSignedUrlFromFileName(missing.getLastSeenImage()));

            // Convert timestamp to date object
            Timestamp sightingTimestamp = missing.getLastSeenDateTime();
            Date sightingTime = sightingTimestamp != null ? sightingTimestamp.toDate() : null;
            missingDetailsDTO.setLastSeenDateTime(sightingTime);

            // Set GeoPoint for the location
            GeoPoint location = missing.getLastSeenLocation();
            if (location != null) {
                missingDetailsDTO.setLastSeenLocation(location);
            }

            // Convert timestamp to date object
            Timestamp publishedTimestamp = missing.getPublishedTime();
            Date publishedTime = publishedTimestamp != null ? publishedTimestamp.toDate() : null;
            missingDetailsDTO.setPublishedTime(publishedTime);

            try {
                // Fetch the document snapshot from the reference
                ApiFuture<DocumentSnapshot> future = missing.getMissingPet().get();
                DocumentSnapshot document = future.get();
                if (document.exists()) {
                    // Convert the document snapshot to a PetModel object
                    petDetails = document.toObject(PetModel.class);
                    if (petDetails != null) {
                        String petImageUrl = petDetails.getPetImageUrl();
                        if (petImageUrl != null && !petImageUrl.isEmpty()) {
                            String petImage = firebaseService.getSignedUrlFromFileName(petImageUrl);
                            petDetails.setPetImageUrl(petImage);
                        }
                    }
                } else {
                    System.out.println("Pet document does not exist.");
                    return null;
                }
            } catch (Exception e) {
                e.printStackTrace();
                return null;
            }
            missingDetailsDTO.setMissingPet(petDetails);

            try {
                // Fetch the document snapshot from the reference
                ApiFuture<DocumentSnapshot> future = missing.getOwner().get();
                DocumentSnapshot document = future.get();
                if (document.exists()) {
                    // Convert the document snapshot to a UserModel object
                    ownerContact = document.toObject(UserModel.class);
                    if (ownerContact != null) {
                        String ownerImageUrl = ownerContact.getProfilePicUrl();
                        if (ownerImageUrl != null && !ownerImageUrl.isEmpty()) {
                            String ownerImage = firebaseService.getSignedUrlFromFileName(ownerImageUrl);
                            ownerContact.setProfilePicUrl(ownerImage);
                        }
                    }
                } else {
                    System.out.println("User document does not exist.");
                    return null;
                }
            } catch (Exception e) {
                e.printStackTrace();
                return null;
            }
            missingDetailsDTO.setOwner(ownerContact);

            // Fetch the sightings
            List<SightingModel> sightings = new ArrayList<>();
            for (DocumentReference sightingRef : missing.getSightingList()) {
                try {
                    ApiFuture<DocumentSnapshot> future = sightingRef.get();
                    DocumentSnapshot document = future.get();
                    if (document.exists()) {
                        SightingModel sighting = document.toObject(SightingModel.class);

                        if (sighting.getSightingImage() != null) {
                            String image = firebaseService.getSignedUrlFromFileName(sighting.getSightingImage());
                            sighting.setSightingImage(image);
                        }

                        sightings.add(sighting);
                    } else {
                        System.out
                                .println("Sighting document does not exist for reference: "
                                        + sightingRef.getId());
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            missingDetailsDTO.setSightingList(sightings);

            sightingDetailsDTOs.add(missingDetailsDTO);

        } catch (Exception e) {
            System.err.println("Error retrieving sightings: " + e.getMessage());
            e.printStackTrace();
        }
        return missingDetailsDTO;
    }

    public ResponseEntity<String> addMissing(MissingPetInputDTO missingDTO) {
        boolean exists = missingRepository.existsActiveMissingPet(missingDTO.getPetId());
        if (exists) {
            System.out.println("A missing pet with this ID is already active.");
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("A missing pet with this ID is already active.");
        }

        List<DocumentReference> sightingRefs = new ArrayList<>();

        MissingPetModel missingModel = new MissingPetModel();
        missingModel.setActive(missingDTO.isActive());
        missingModel.setLastSeenDescription(missingDTO.getLastSeenDescription());

        // Convert date object to times
        Timestamp pTimestamp = Timestamp.of(missingDTO.getPublishedTime());
        missingModel.setPublishedTime(pTimestamp);

        Timestamp seenTimestamp = Timestamp.of(missingDTO.getLastSeenDateTime());
        missingModel.setLastSeenDateTime(seenTimestamp);

        // Set GeoPoint for the location
        GeoPoint geoPoint = new GeoPoint(missingDTO.getLatitude(), missingDTO.getLongitude());
        missingModel.setLastSeenLocation(geoPoint);

        // upload image to firebase storage
        String imageURL = "missing_pet_first_sighting/" + missingDTO.getLastSeenImage().getOriginalFilename();
        missingModel.setLastSeenImage(imageURL);
        try {
            firebaseService.upload(missingDTO.getLastSeenImage(), imageURL);
        } catch (Exception e) {
            // Handle other unexpected exceptions
            throw new RuntimeException("Failed to add article due to an unexpected error", e);
        }

        // Get user doc refer
        DocumentReference userRef = userRepository.getUserDocReferenceByUserId(missingDTO.getOwnerId());
        missingModel.setOwner(userRef);

        DocumentReference petRef = petRepository.getPetDocReferenceByPetId(missingDTO.getPetId());
        missingModel.setMissingPet(petRef);

        // Iterate through the list of sighting IDs from the DTO
        // for (String sightingId : missingDTO.getSightingId()) {
        // // Get a reference to the sighting document using its ID
        // DocumentReference sightingRef =
        // sightingRepository.getSightingDocReferenceBySightingId(sightingId);
        // sightingRefs.add(sightingRef); // Add the sighting reference to the list
        // }

        missingModel.setSightingList(sightingRefs);

        try {
            String result = missingRepository.addMissingPet(missingModel);
            System.out.println("Result from repository: " + result);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to add missing pet: " + e.getMessage());
        }

    }

    public String markFound(MissingPetInputDTO missingDTO, String missingId) {
        MissingPetModel existingPet;

        try {
            existingPet = missingRepository.getMissingById(missingId);
        } catch (ExecutionException | InterruptedException e) {
            return "Error retrieving missing pet: " + e.getMessage();
        }

        if (existingPet == null) {
            return "Missing Pet not found.";
        }
        existingPet.setActive(false);
        try {
            String res = missingRepository.markFound(existingPet, missingId);
            return res;
        } catch (Exception e) {
            throw new RuntimeException("Failed to mark missing pet as found due to an unexpected error", e);
        }
    }
}
