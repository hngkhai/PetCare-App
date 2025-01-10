package com.sc2006.petcare.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.sc2006.petcare.DTO.MissingPetDTO;
import com.sc2006.petcare.DTO.MissingPetInputDTO;
import com.sc2006.petcare.services.MissingPetService;

@CrossOrigin(origins = "http://10.91.144.154:8080")
@RestController
@RequestMapping(value = "api/missing")
public class MissingPetController {
    @Autowired
    MissingPetService missingPetService;

    // change to get all ACTIVE pets DONE
    @RequestMapping(value = "/getAllMissingPets", method = RequestMethod.GET, produces = "application/json")
    public List<MissingPetDTO> getAllMissingPets() {
        return missingPetService.getAllMissingPets();
    }

    // get selected missing pet
    @RequestMapping(value = "/getMissingById/{missingId}", method = RequestMethod.GET, produces = "application/json")
    public MissingPetDTO getMissingById(@PathVariable(value = "missingId") String missingId) {
        return missingPetService.getMissingById(missingId);
    }

    @PostMapping(value = "/addMissing", consumes = { "multipart/form-data" })
    public ResponseEntity<String> addMissing(@ModelAttribute MissingPetInputDTO missingDTO) {
        return missingPetService.addMissing(missingDTO);
    }

    // mark as found aka edit
    @RequestMapping(value = "/markFound/{missingId}", method = RequestMethod.PUT)
    public String markFound(@PathVariable String missingId,
            @ModelAttribute MissingPetInputDTO missingPetInputDTO) {
        return missingPetService.markFound(missingPetInputDTO, missingId);
    }
}
