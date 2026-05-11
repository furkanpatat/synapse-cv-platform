package com.cvplatform.user;

public enum Role {
    USER,
    COMPANY,
    ADMIN;

    public String asAuthority() {
        return "ROLE_" + name();
    }
}
