package com.licenta.user.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateUserRequest {

    @NotBlank(message = "Username is required")
    private String username;

    private String password; // optional — if blank, keep old password

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
