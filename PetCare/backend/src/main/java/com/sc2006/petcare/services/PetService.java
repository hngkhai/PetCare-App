package com.sc2006.petcare.services;

import com.sc2006.petcare.repositories.PetRepository;
import com.sc2006.petcare.repositories.UserRepository;
import com.sc2006.petcare.models.PetModel;
import com.sc2006.petcare.models.UserModel;
import com.sc2006.petcare.DTO.PetDetailsDTO;
import com.sc2006.petcare.DTO.PetDetailsInputDTO;
import com.sc2006.petcare.DTO.PetDetailsUpdateDTO;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.cloud.Timestamp;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class PetService {
    @Autowired
    private final PetRepository petRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FirebaseService firebaseService;

    public PetService(PetRepository petRepository) {
        this.petRepository = petRepository;
    }

    public List<PetDetailsDTO> getPetsByUserId(String userId) {
        List<PetDetailsDTO> petDetailsDTOs = new ArrayList<>();
        List<PetModel> petList = new ArrayList<>();
        UserModel owner;
        try {
            petList = petRepository.getPetsByUserId(userId);
            for (PetModel pet : petList) {
                PetDetailsDTO petDetailsDTO = new PetDetailsDTO();
                petDetailsDTO.setId(pet.getId());
                petDetailsDTO.setPetName(pet.getPetName());
                petDetailsDTO.setSex(pet.getSex());
                petDetailsDTO.setBreed(pet.getBreed());
                petDetailsDTO.setWeight(pet.getWeight());
                // Convert timestamp to date object
                Timestamp dateOfBirth = pet.getDateOfBirth();
                Date dob = dateOfBirth != null ? dateOfBirth.toDate() : null;
                petDetailsDTO.setDateOfBirth(dob);
                petDetailsDTO.setMedicCondition(pet.getMedicCondition());
                petDetailsDTO.setMarkings(pet.getMarkings());
                petDetailsDTO.setCoatColor(pet.getCoatColor());
                petDetailsDTO.setPetImage(firebaseService.getSignedUrlFromFileName(pet.getPetImageUrl()));
                petDetailsDTO.setPetImageUrl(pet.getPetImageUrl());
                try {
                    ApiFuture<DocumentSnapshot> future = pet.getOwner().get();
                    DocumentSnapshot document = future.get();
                    if (document.exists()) {
                        owner = document.toObject(UserModel.class);
                    } else {
                        System.out.println("Owner document does not exist.");
                        return null;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    return null;
                }
                petDetailsDTO.setOwnerId(userId);
                petDetailsDTOs.add(petDetailsDTO);
            }
        } catch (Exception e) {
            System.err.println("Error retrieving pets: " + e.getMessage());
            e.printStackTrace();
        }
        return petDetailsDTOs;
    }

    public String addPet(PetDetailsInputDTO petDetailsInputDTO) {
        PetModel petModel = new PetModel();
        petModel.setPetName(petDetailsInputDTO.getPetName());
        petModel.setSex(petDetailsInputDTO.getSex());
        petModel.setBreed(petDetailsInputDTO.getBreed());
        petModel.setWeight(petDetailsInputDTO.getWeight());
        // Convert date object to timestamp
        Timestamp timestamp = Timestamp.of(petDetailsInputDTO.getDateOfBirth());
        petModel.setDateOfBirth(timestamp);
        petModel.setMedicCondition(petDetailsInputDTO.getMedicCondition());
        petModel.setMarkings(petDetailsInputDTO.getMarkings());
        petModel.setCoatColor(petDetailsInputDTO.getCoatColor());
        // Get user doc reference
        DocumentReference userRef = userRepository.getUserDocReferenceByUserId(petDetailsInputDTO.getOwnerId());
        petModel.setOwner(userRef);
        // upload image to firebase storage
        String imageURL = "pets/" + petDetailsInputDTO.getPetImage().getOriginalFilename();
        petModel.setPetImageUrl(imageURL);

        try {
            String res = petRepository.addPet(petModel);
            firebaseService.upload(petDetailsInputDTO.getPetImage(), imageURL);
            return res;
        } catch (Exception e) {
            // Handle other unexpected exceptions
            throw new RuntimeException("Failed to add pet due to an unexpected error", e);
        }
    }

    public String updatePet(PetDetailsUpdateDTO petDetailsUpdateDTO) {
        PetModel petModel = new PetModel();
        petModel.setId(petDetailsUpdateDTO.getPetId());
        petModel.setPetName(petDetailsUpdateDTO.getPetName());
        petModel.setSex(petDetailsUpdateDTO.getSex());
        petModel.setBreed(petDetailsUpdateDTO.getBreed());
        petModel.setWeight(petDetailsUpdateDTO.getWeight());
        if (petDetailsUpdateDTO.getDateOfBirth() != null) {
            Timestamp timestamp = Timestamp.of(petDetailsUpdateDTO.getDateOfBirth());
            petModel.setDateOfBirth(timestamp);
        }
        petModel.setMedicCondition(petDetailsUpdateDTO.getMedicCondition());
        petModel.setMarkings(petDetailsUpdateDTO.getMarkings());
        petModel.setCoatColor(petDetailsUpdateDTO.getCoatColor());
        DocumentReference userRef = userRepository.getUserDocReferenceByUserId(petDetailsUpdateDTO.getOwnerId());
        petModel.setOwner(userRef);
        petModel.setPetImageUrl(petDetailsUpdateDTO.getPetImageUrl());
        return petRepository.updatePet(petModel);
    }

    public String deletePet(String petId) {
        return petRepository.deletePet(petId);
    }
}
