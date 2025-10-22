package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.*;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

/**
 * User Service
 * Handles user-related business logic including registration, authentication, and user management
 */
@Service
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Email pattern for Landmark University
    private static final Pattern LANDMARK_EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@lmu\\.edu\\.ng$");

    // Password pattern: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Register a new user
     * Validates email format, checks for duplicates, and hashes password
     *
     * @param email User's email (must be @landmark.edu.ng)
     * @param name User's full name
     * @param password User's password (plain text - will be hashed)
     * @return Newly created User object
     * @throws InvalidEmailFormatException if email is not @landmark.edu.ng
     * @throws DuplicateEmailException if email already exists
     * @throws WeakPasswordException if password doesn't meet requirements
     */
    public User registerUser(String email, String name, String password) {
        log.info("Attempting to register user with email: {}", email);

        // Validate email format
        validateEmailFormat(email);

        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            log.error("Registration failed: Email already exists - {}", email);
            throw new DuplicateEmailException(email);
        }

        // Validate password strength
        validatePasswordStrength(password);

        // Hash password using bcrypt
        String hashedPassword = passwordEncoder.encode(password);
        log.debug("Password hashed successfully for user: {}", email);

        // Create new user entity
        User newUser = User.builder()
                .email(email.toLowerCase().trim())
                .name(name.trim())
                .passwordHash(hashedPassword)
                .role(User.UserRole.BUYER) // Default role
                .isActive(true)
                .isEmailVerified(false) // Requires email verification
                .build();

        // Save user to database
        User savedUser = userRepository.save(newUser);
        log.info("User registered successfully with ID: {} and email: {}", savedUser.getId(), savedUser.getEmail());

        return savedUser;
    }

    /**
     * Authenticate user with email and password
     * Validates credentials and returns user if successful
     *
     * @param email User's email
     * @param password User's password (plain text)
     * @return User object if credentials are valid
     * @throws InvalidCredentialsException if email or password is incorrect
     * @throws AccountNotActiveException if account is deactivated
     */
    public User loginUser(String email, String password) {
        log.info("Login attempt for email: {}", email);

        // Find user by email
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> {
                    log.error("Login failed: User not found - {}", email);
                    return new InvalidCredentialsException();
                });

        // Check if account is active
        if (!user.getIsActive()) {
            log.error("Login failed: Account is deactivated - {}", email);
            throw new AccountNotActiveException();
        }

        // Check if email is verified
        if (!user.getIsEmailVerified()) {
            throw new AccountNotActiveException("Please verify your email before logging in.");
        }

        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            log.error("Login failed: Invalid password for email - {}", email);
            throw new InvalidCredentialsException();
        }

        log.info("User logged in successfully: {}", email);
        return user;
    }

    /**
     * Get user by ID
     *
     * @param id User's ID
     * @return User object
     * @throws UserNotFoundException if user not found
     */
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        log.debug("Fetching user by ID: {}", id);

        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("User not found with ID: {}", id);
                    return new UserNotFoundException(id);
                });
    }

    /**
     * Get user by email
     *
     * @param email User's email
     * @return User object
     * @throws UserNotFoundException if user not found
     */
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        log.debug("Fetching user by email: {}", email);

        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> {
                    log.error("User not found with email: {}", email);
                    return new UserNotFoundException("email", email);
                });
    }

    /**
     * Update user profile
     *
     * @param userId User's ID
     * @param name New name (optional)
     * @param profilePictureUrl New profile picture URL (optional)
     * @return Updated User object
     */
    public User updateUserProfile(Long userId, String name, String profilePictureUrl) {
        log.info("Updating profile for user ID: {}", userId);

        User user = getUserById(userId);

        if (name != null && !name.trim().isEmpty()) {
            user.setName(name.trim());
        }

        if (profilePictureUrl != null && !profilePictureUrl.trim().isEmpty()) {
            user.setProfilePictureUrl(profilePictureUrl.trim());
        }

        User updatedUser = userRepository.save(user);
        log.info("User profile updated successfully for ID: {}", userId);

        return updatedUser;
    }

    /**
     * Update user role
     *
     * @param userId User's ID
     * @param role New role
     * @return Updated User object
     */
    public User updateUserRole(Long userId, User.UserRole role) {
        log.info("Updating role for user ID: {} to {}", userId, role);

        User user = getUserById(userId);
        user.setRole(role);

        User updatedUser = userRepository.save(user);
        log.info("User role updated successfully for ID: {}", userId);

        return updatedUser;
    }

    /**
     * Deactivate user account
     *
     * @param userId User's ID
     */
    public void deactivateUser(Long userId) {
        log.info("Deactivating user account with ID: {}", userId);

        User user = getUserById(userId);
        user.setIsActive(false);
        userRepository.save(user);

        log.info("User account deactivated successfully: {}", userId);
    }

    /**
     * Validate email format for Landmark University
     *
     * @param email Email to validate
     * @throws InvalidEmailFormatException if email is invalid
     */
    private void validateEmailFormat(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new InvalidEmailFormatException("Email cannot be empty");
        }

        if (!LANDMARK_EMAIL_PATTERN.matcher(email.trim()).matches()) {
            log.error("Invalid email format: {}", email);
            throw new InvalidEmailFormatException();
        }
    }

    /**
     * Validate password strength
     *
     * @param password Password to validate
     * @throws WeakPasswordException if password doesn't meet requirements
     */
    private void validatePasswordStrength(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new WeakPasswordException("Password cannot be empty");
        }

        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            log.error("Weak password provided");
            throw new WeakPasswordException();
        }
    }

    /**
     * Check if email exists
     *
     * @param email Email to check
     * @return true if email exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email.toLowerCase().trim());
    }

    /**
     * Verify user email
     *
     * @param userId User's ID
     */
    public void verifyUserEmail(Long userId) {
        log.info("Verifying email for user ID: {}", userId);

        User user = getUserById(userId);
        user.setIsEmailVerified(true);
        userRepository.save(user);

        log.info("Email verified successfully for user ID: {}", userId);
    }
}
