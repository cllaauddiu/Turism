package com.licenta.user.dto;

import com.licenta.user.entity.Role;

public class UserDTO {
    private Long id;
    private String username;
    private Role role;

    public UserDTO() {}

    public UserDTO(Long id, String username, Role role) {
        this.id = id;
        this.username = username;
        this.role = role;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String username;
        private Role role;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder role(Role role) { this.role = role; return this; }
        public UserDTO build() { return new UserDTO(id, username, role); }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
