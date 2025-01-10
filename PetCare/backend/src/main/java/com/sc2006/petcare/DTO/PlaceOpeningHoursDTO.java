package com.sc2006.petcare.DTO;

import lombok.Data;

@Data
public class PlaceOpeningHoursDTO {
    private DayTimeDTO open;
    private DayTimeDTO close;
    
    // No-argument constructor for Firestore
    public PlaceOpeningHoursDTO() {
    }

    public PlaceOpeningHoursDTO(DayTimeDTO open, DayTimeDTO close) {
        this.open = open;
        this.close = close;
    }
}
