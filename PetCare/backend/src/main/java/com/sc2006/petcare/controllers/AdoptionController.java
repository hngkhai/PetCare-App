package com.sc2006.petcare.controllers;


import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import com.sc2006.petcare.DTO.AdoptionDetailsDTO;
import com.sc2006.petcare.models.AdoptionModel;
import com.sc2006.petcare.services.AdoptionService;

@CrossOrigin(origins = "http://localhost:8081")
@RestController
@RequestMapping(value = "api/adoption")
public class AdoptionController {

    @Autowired
    AdoptionService adoptionService;


    @PostMapping(value = "/addAdoption", consumes =MediaType.MULTIPART_FORM_DATA_VALUE)
    public String addPet(@ModelAttribute AdoptionDetailsDTO request) {
    
     for(MultipartFile image : request.getImages()) {
        // Process each image, like saving it to Firebase or another storage
        System.out.print(image);
    }
        //System.out.println(request.getOwnerId());
        return adoptionService.addAdoption(request);
        //return "Done";
    }


    
    @PutMapping(value = "/editAdoption/{petId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public String editPet(@PathVariable(value = "petId") String petId,@ModelAttribute AdoptionDetailsDTO  adp) {
        System.out.println("Editing");
        List<MultipartFile> images = adp.getImages();

        if (images != null) {
            for (MultipartFile image : images) {
                // Process each image, like saving it to Firebase or another storage
                System.out.print(image.getOriginalFilename()); // Get the filename for logging
                // Save image logic here...
            }
        } else {
            System.out.println("No images to process.");
        }
        return adoptionService.editAdoption(petId,adp);
    }

   
    @RequestMapping(value = "/getAllAdoption", method = RequestMethod.GET, produces = "application/json")
    public List<AdoptionModel> getAllPets() {
        System.out.print("Out");
        return adoptionService.getAllAdoption();
    }

    @RequestMapping(value = "/getAdoptionByAdp/{userId}", method = RequestMethod.GET, produces = "application/json")
    public List<AdoptionModel> getAdoptionByAdp(@PathVariable(value = "userId") String userId) {
        System.out.print("By Adoption");
        return adoptionService.getAdoptionByAdp(userId);
    }

     
    @RequestMapping(value = "/getIndAdoption/{petId}", method = RequestMethod.GET, produces = "application/json")
    public AdoptionModel getIndividualPet(@PathVariable(value = "petId") String petId) {
        return adoptionService.getIndividualPet(petId);
    }


    @RequestMapping(value = "/deleteAdoption/{petId}", method = RequestMethod.DELETE, produces = "application/json")
    public String deletePet(@PathVariable(value = "petId") String petId) {
        System.out.println(petId);
        return adoptionService.deleteAdoption(petId);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<String> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body("File size exceeds the allowable limit!");
    }
}