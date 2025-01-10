package com.sc2006.petcare.services;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.storage.Acl.User;
import com.sc2006.petcare.DTO.AdoptionDetailsDTO;
import com.sc2006.petcare.models.AdoptionModel;
import com.sc2006.petcare.models.UserModel;
import com.sc2006.petcare.repositories.AdoptionRepository;
import com.sc2006.petcare.repositories.UserRepository;

@Service
public class AdoptionService {
    @Autowired
    private AdoptionRepository adoptionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FirebaseService firebaseService;

    public String addAdoption(AdoptionDetailsDTO adp) {
        List<String> imagesList = new ArrayList<String>();
        AdoptionModel petModel = new AdoptionModel();
        petModel.setPetName(adp.getPetName());
        petModel.setSex(adp.getSex());
        petModel.setBreed(adp.getBreed());
        petModel.setAge(adp.getAge());
        petModel.setType(adp.getType());
        petModel.setCoatColor(adp.getCoatColor());
        petModel.setDescription(adp.getDescription());
        // Get user doc refer
        DocumentReference userRef = userRepository.getUserDocReferenceByUserId(adp.getOwnerId());
        petModel.setOwner(userRef);
         // Get Owner details
         UserModel user = userRepository.getUserById(adp.getOwnerId());

         petModel.setAdptName(user.getUserName());
         petModel.setAdptEmail(user.getEmail());
         petModel.setAdptNumber(Integer.toString(user.getPhoneNumber()));

        for (MultipartFile image : adp.getImages()) {
            // Process each image, like saving it to Firebase or another storage
            String imageURL = "adoption/" + image.getOriginalFilename();
            imagesList.add(imageURL);
            firebaseService.upload(image, imageURL);
        }
        petModel.setImagesList(imagesList);

        try {

            String res = adoptionRepository.addAdoption(petModel);
            return res;

        } catch (Exception e) {
            // Handle other unexpected exceptions
            throw new RuntimeException("Failed to add pet due to an unexpected error", e);
        }
        // petModel.setPetImageUrl(imageURL);
        /*
         * petModel.setPetName("Candie");
         * petModel.setSex("Male");
         * petModel.setBreed("Golden Retriever");
         * petModel.setAge("3 years 2 month");
         * petModel.setType("Dog");
         * petModel.setDescription("Hello this is ....");
         * petModel.setPetImageUrl("////");
         * DocumentReference userRef =
         * userRepository.getUserDocReferenceByUserId("YBHenmlgklzvRYqQCWOc");
         * petModel.setOwner(userRef);
         * petModel.setAdptName("SPCA Adoption Center");;
         * petModel.setAdptEmail("SPCA@gmail.com");;
         * petModel.setAdptNumber("+65 88888888");;
         */
    }

    public String editAdoption(String petId, AdoptionDetailsDTO adp) {
        List<String> imagesList = new ArrayList<String>();
        AdoptionModel petModel = new AdoptionModel();
        petModel.setPetName(adp.getPetName());
        petModel.setSex(adp.getSex());
        petModel.setBreed(adp.getBreed());
        petModel.setAge(adp.getAge());
        petModel.setType(adp.getType());
        petModel.setCoatColor(adp.getCoatColor());
        petModel.setDescription(adp.getDescription());
        DocumentReference userRef = userRepository.getUserDocReferenceByUserId(adp.getOwnerId());
        // DocumentReference userRef =
        // userRepository.getUserDocReferenceByUserId(adp.getOwner().toString());
        petModel.setOwner(userRef);
        // System.out.println(adp.getOwnerId());

        // Get Owner details
        UserModel user = userRepository.getUserById(adp.getOwnerId());

        petModel.setAdptName(user.getUserName());
        petModel.setAdptEmail(user.getEmail());
        petModel.setAdptNumber(Integer.toString(user.getPhoneNumber()));

        for (MultipartFile image : adp.getImages()) {
            // Process each image, like saving it to Firebase or another storage
            String input = image.getOriginalFilename();
            int underscoreIndex = input.indexOf('_');
            String result = underscoreIndex != -1 ? input.substring(0, underscoreIndex) : input;
    
            
            String imageURL = "adoption/" + result;
            imagesList.add(imageURL);
            firebaseService.upload(image, imageURL);
        }
        petModel.setImagesList(imagesList);

        try {

            String res = adoptionRepository.editAdoption(petId, petModel);
            return res;

        } catch (Exception e) {
            // Handle other unexpected exceptions
            throw new RuntimeException("Failed to add pet due to an unexpected error", e);
        }

    }

    public AdoptionModel getIndividualPet(String petId) {
        AdoptionModel pet = new AdoptionModel();
        AdoptionModel petDetailsDTO = new AdoptionModel();

        try {
            List<String> imgList = new ArrayList<String>();

            pet = adoptionRepository.getIndividualPet(petId);
            petDetailsDTO.setId(pet.getId());
            // System.out.print(pet.getId()+'\n');
            // System.out.print(pet.getPetName());
            petDetailsDTO.setPetName(pet.getPetName());
            petDetailsDTO.setSex(pet.getSex());
            petDetailsDTO.setAge(pet.getAge());
            petDetailsDTO.setType(pet.getType());
            petDetailsDTO.setBreed(pet.getBreed());
            petDetailsDTO.setDescription(pet.getDescription());
            petDetailsDTO.setCoatColor(pet.getCoatColor());

            for (String image : pet.getImagesList()) {
                imgList.add(firebaseService.getSignedUrlFromFileName(image));
            }
            petDetailsDTO.setImagesList(imgList);
            // System.out.print(imgList);
            // DocumentReference userRef =
            // userRepository.getUserDocReferenceByUserId(pet.getOwner().toString());
            // petDetailsDTO.setOwner(userRef);
            petDetailsDTO.setAdptEmail(pet.getAdptEmail());
            petDetailsDTO.setAdptNumber(pet.getAdptNumber());
            petDetailsDTO.setAdptName(pet.getAdptName());
            System.out.print(pet.getAdptName());

        } catch (Exception e) {
            System.err.println("Error retrieving pets: " + e.getMessage());
            e.printStackTrace();
        }
        return petDetailsDTO;
    }

    public List<AdoptionModel> getAllAdoption() {
        List<AdoptionModel> petDetailsDTOs = new ArrayList<>();
        List<AdoptionModel> petList = new ArrayList<>();
        // UserModel owner;
        try {
            petList = adoptionRepository.getAllAdoption();
            for (AdoptionModel pet : petList) {
                List<String> imgList = new ArrayList<String>();
                AdoptionModel petDetailsDTO = new AdoptionModel();
                petDetailsDTO.setId(pet.getId());
                // System.out.print(pet.getId()+'\n');
                // System.out.print(pet.getPetName());
                petDetailsDTO.setPetName(pet.getPetName());
                petDetailsDTO.setSex(pet.getSex());
                petDetailsDTO.setAge(pet.getAge());
                petDetailsDTO.setType(pet.getType());
                petDetailsDTO.setBreed(pet.getBreed());
                petDetailsDTO.setDescription(pet.getDescription());
                petDetailsDTO.setCoatColor(pet.getCoatColor());

                for (String image : pet.getImagesList()) {
                    imgList.add(firebaseService.getSignedUrlFromFileName(image));
                }
                petDetailsDTO.setImagesList(imgList);
                // System.out.print(imgList);
                DocumentReference userRef = userRepository.getUserDocReferenceByUserId(pet.getOwner().toString());
                //System.out.println(pet.getOwner().toString());

                /*Get User Personal Image */
                String path = pet.getOwner().toString();
                String value = path.substring(path.lastIndexOf("/") + 1);
                String result = value.substring(0, value.length() - 1); // "YBHenmlgklzvRYqQCO"

                //System.out.println(value);   
                UserModel user = userRepository.getUserById(result);
                petDetailsDTO.setPetImageUrl(firebaseService.getSignedUrlFromFileName(user.getProfilePicUrl()));
                petDetailsDTO.setAdptEmail(pet.getAdptEmail());
                petDetailsDTO.setAdptNumber(pet.getAdptNumber());
                petDetailsDTO.setAdptName(pet.getAdptName());
                System.out.print(pet.getAdptName());
                petDetailsDTOs.add(petDetailsDTO);

            }
        } catch (Exception e) {
            System.err.println("Error retrieving pets: " + e.getMessage());
            e.printStackTrace();
        }

        return petDetailsDTOs;
    }

    public List<AdoptionModel> getAdoptionByAdp(String userId) {
        List<AdoptionModel> petDetailsDTOs = new ArrayList<>();
        List<AdoptionModel> petList = new ArrayList<>();
        // UserModel owner;
        try {
            petList = adoptionRepository.getAdoptionByAdp(userId);
            for (AdoptionModel pet : petList) {
                List<String> imgList = new ArrayList<String>();
                AdoptionModel petDetailsDTO = new AdoptionModel();
                petDetailsDTO.setId(pet.getId());
                // System.out.print(pet.getId()+'\n');
                // System.out.print(pet.getPetName());
                petDetailsDTO.setPetName(pet.getPetName());
                petDetailsDTO.setSex(pet.getSex());
                petDetailsDTO.setAge(pet.getAge());
                petDetailsDTO.setType(pet.getType());
                petDetailsDTO.setBreed(pet.getBreed());
                petDetailsDTO.setDescription(pet.getDescription());
                petDetailsDTO.setCoatColor(pet.getCoatColor());

                for (String image : pet.getImagesList()) {
                    imgList.add(firebaseService.getSignedUrlFromFileName(image));
                }
                petDetailsDTO.setImagesList(imgList);
                // System.out.print(imgList);
                   /*Get User Personal Image */
                String path = pet.getOwner().toString();
                String value = path.substring(path.lastIndexOf("/") + 1);
                String result = value.substring(0, value.length() - 1); // "YBHenmlgklzvRYqQCO"

                //System.out.println(value);   
                UserModel user = userRepository.getUserById(result);
                petDetailsDTO.setPetImageUrl(firebaseService.getSignedUrlFromFileName(user.getProfilePicUrl()));
                petDetailsDTO.setAdptEmail(pet.getAdptEmail());
                petDetailsDTO.setAdptNumber(pet.getAdptNumber());
                petDetailsDTO.setAdptName(pet.getAdptName());
                System.out.print(pet.getAdptName());
                petDetailsDTOs.add(petDetailsDTO);

            }
        } catch (Exception e) {
            System.err.println("Error retrieving pets: " + e.getMessage());
            e.printStackTrace();
        }

        return petDetailsDTOs;
    }

    public String deleteAdoption(String petId) {
        return adoptionRepository.deletePet(petId);
    }
}
