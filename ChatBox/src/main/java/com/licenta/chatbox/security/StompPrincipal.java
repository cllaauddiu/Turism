package com.licenta.chatbox.security;

import java.security.Principal;

public class StompPrincipal implements Principal {

    private final String username;
    private final String role;

    public StompPrincipal(String username, String role) {
        this.username = username;
        this.role = role;
    }

    @Override
    public String getName() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role);
    }
}
