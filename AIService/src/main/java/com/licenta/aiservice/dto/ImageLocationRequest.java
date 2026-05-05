package com.licenta.aiservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ImageLocationRequest {

    @NotBlank(message = "imageBase64 nu poate fi gol.")
    private String imageBase64;

    @NotBlank(message = "mimeType nu poate fi gol.")
    private String mimeType;
}
