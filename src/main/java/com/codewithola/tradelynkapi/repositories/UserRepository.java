package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email address
     * Used for authentication and user lookup
     * @param email User's email address
     * @return Optional containing User if found, empty otherwise
     */
    Optional<User> findByEmail(String email);

    /**
     * ✅ NEW: Find user by username
     * Used for public storefront lookup
     * @param username User's unique username
     * @return Optional containing User if found, empty otherwise
     */
    Optional<User> findByUsername(String username);

    /**
     * Check if a user exists with the given email
     * Used to prevent duplicate registrations
     * @param email Email address to check
     * @return true if user exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * ✅ NEW: Check if username is already taken
     * Used during seller activation to prevent duplicate usernames
     * @param username Username to check
     * @return true if username exists, false otherwise
     */
    boolean existsByUsername(String username);

    /**
     * Find active user by email
     * Only returns users with isActive = true
     * @param email User's email address
     * @return Optional containing active User if found
     */
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.isActive = true")
    Optional<User> findActiveUserByEmail(String email);

    /**
     * Count total number of registered users
     * @return Total user count
     */
    @Query("SELECT COUNT(u) FROM User u")
    long countTotalUsers();
}