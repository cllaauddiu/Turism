package com.licenta.user.dto;

import com.licenta.user.entity.Role;
import jakarta.validation.constraints.NotNull;

public class ChangeRoleRequest {

    @NotNull(message = "Role is required")
    private Role role;

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}

