package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.dtos.requests.UpdateProfileRequest;
import com.codewithola.tradelynkapi.dtos.requests.UpdateRoleRequest;
import com.codewithola.tradelynkapi.dtos.response.ApiResponse;
import com.codewithola.tradelynkapi.dtos.response.UserProfileResponse;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.security.jwt.JwtTokenProvider;
import com.codewithola.tradelynkapi.services.UserService;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * User Controller
 * Handles user profile management and user-related operations
 * Base URL: /api/v1/users
 * Requires authentication for all endpoints
 */
@RestController
@RequestMapping("/users")
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @Autowired
    public UserController(UserService userService, JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Get current user profile
     * GET /api/v1/users/profile
     * Requires: JWT token in Authorization header
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "User profile retrieved successfully",
     *   "data": {
     *     "id": 1,
     *     "email": "student@landmark.edu.ng",
     *     "name": "John Doe",
     *     "role": "BUYER",
     *     "profilePictureUrl": null,
     *     "isActive": true,
     *     "isEmailVerified": false,
     *     "createdAt": "2024-01-15T10:30:00"
     *   }
     * }
     */
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUserProfile(
            @RequestHeader("Authorization") String authHeader) {
        log.info("Get current user profile request received");

        // Extract email from token
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);

        // Get user
        User user = userService.getUserByEmail(email);

        // Build response
        UserProfileResponse profileResponse = UserProfileResponse.fromUser(user);

        log.info("User profile retrieved successfully for: {}", email);

        return ResponseEntity
                .ok(ApiResponse.success("User profile retrieved successfully", profileResponse));
    }

    /**
     * Get user by ID
     * GET /api/v1/users/{id}
     * Requires: JWT token in Authorization header
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "User retrieved successfully",
     *   "data": {
     *     "id": 1,
     *     "email": "student@landmark.edu.ng",
     *     "name": "John Doe",
     *     "role": "BUYER"
     *   }
     * }
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable Long id) {
        log.info("Get user by ID request received for ID: {}", id);

        User user = userService.getUserById(id);
        UserProfileResponse profileResponse = UserProfileResponse.fromUser(user);

        log.info("User retrieved successfully with ID: {}", id);

        return ResponseEntity
                .ok(ApiResponse.success("User retrieved successfully", profileResponse));
    }

    /**
     * Update user profile
     * PUT /api/v1/users/profile
     * Requires: JWT token in Authorization header
     *
     * Request Body:
     * {
     *   "name": "John Updated Doe",
     *   "profilePictureUrl": "https://cloudinary.com/image.jpg"
     * }
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "Profile updated successfully",
     *   "data": {
     *     "id": 1,
     *     "email": "student@landmark.edu.ng",
     *     "name": "John Updated Doe",
     *     "profilePictureUrl": "https://cloudinary.com/image.jpg"
     *   }
     * }
     */
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateProfileRequest request) {
        log.info("Update profile request received");

        // Extract email from token
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);

        // Get user
        User user = userService.getUserByEmail(email);

        // Update profile
        User updatedUser = userService.updateUserProfile(
                user.getId(),
                request.getName(),
                request.getProfilePictureUrl()
        );

        // Build response
        UserProfileResponse profileResponse = UserProfileResponse.fromUser(updatedUser);

        log.info("User profile updated successfully for: {}", email);

        return ResponseEntity
                .ok(ApiResponse.success("Profile updated successfully", profileResponse));
    }

    /**
     * Update user role
     * PUT /api/v1/users/role
     * Requires: JWT token in Authorization header
     *
     * Request Body:
     * {
     *   "role": "BOTH"
     * }
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "Role updated successfully",
     *   "data": {
     *     "role": "BOTH"
     *   }
     * }
     */
    @PutMapping("/role")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateRole(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateRoleRequest request) {
        log.info("Update role request received");

        // Extract email from token
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);

        // Get user
        User user = userService.getUserByEmail(email);

        // Update role
        User updatedUser = userService.updateUserRole(user.getId(), request.getRole());

        // Build response
        UserProfileResponse profileResponse = UserProfileResponse.fromUser(updatedUser);

        log.info("User role updated successfully for: {} to {}", email, request.getRole());

        return ResponseEntity
                .ok(ApiResponse.success("Role updated successfully", profileResponse));
    }

    /**
     * Deactivate user account
     * DELETE /api/v1/users/deactivate
     * Requires: JWT token in Authorization header
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "Account deactivated successfully"
     * }
     */
    @DeleteMapping("/deactivate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deactivateAccount(
            @RequestHeader("Authorization") String authHeader) {
        log.info("Deactivate account request received");

        // Extract email from token
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);

        // Get user
        User user = userService.getUserByEmail(email);

        // Deactivate account
        userService.deactivateUser(user.getId());

        log.info("User account deactivated successfully: {}", email);

        return ResponseEntity
                .ok(ApiResponse.success("Account deactivated successfully", null));
    }

    /**
     * Verify user email
     * POST /api/v1/users/verify-email
     * Requires: JWT token in Authorization header
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "Email verified successfully"
     * }
     */
    @PostMapping("/verify-email")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @RequestHeader("Authorization") String authHeader) {
        log.info("Verify email request received");

        // Extract email from token
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);

        // Get user
        User user = userService.getUserByEmail(email);

        // Verify email
        userService.verifyUserEmail(user.getId());

        log.info("Email verified successfully for: {}", email);

        return ResponseEntity
                .ok(ApiResponse.success("Email verified successfully", null));
    }
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {
        log.info("GET /users/me request received");

        // Extract token and email
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);

        // Get user from DB
        User user = userService.getUserByEmail(email);

        // Convert to response DTO
        UserProfileResponse profileResponse = UserProfileResponse.fromUser(user);

        log.info("Authenticated user retrieved successfully: {}", email);

        return ResponseEntity.ok(
                ApiResponse.success("Authenticated user retrieved successfully", profileResponse)
        );
    }

}


