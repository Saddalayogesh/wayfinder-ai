package com.tripplanner.user;

/**
 * Application roles. Plain {@code USER} accounts are created by
 * {@code POST /api/auth/register}; {@code ADMIN} is reserved for future
 * bootstrapping / elevated access.
 */
public enum Role {
    USER,
    ADMIN
}
