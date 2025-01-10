package com.sc2006.petcare.DTO;

import lombok.Data;

@Data
public class DayTimeDTO {
    private int day;
    private String time;

    public DayTimeDTO() {
    }
    
    public DayTimeDTO(int day, String time) {
        this.day = day;
        this.time = time;
    }
}
