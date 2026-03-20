package com.licenta.user.dto;

public class AuthResponse {
    private String token;
    private String username;
    private String role;

    public AuthResponse() {}

    public AuthResponse(String token, String username, String role) {
        this.token = token;
        this.username = username;
        this.role = role;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String token;
        private String username;
        private String role;

        public Builder token(String token) { this.token = token; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public AuthResponse build() { return new AuthResponse(token, username, role); }
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
