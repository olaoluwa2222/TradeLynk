package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.dtos.requests.LoginRequest;
import com.codewithola.tradelynkapi.dtos.requests.RegisterRequest;
import com.codewithola.tradelynkapi.dtos.response.ApiResponse;
import com.codewithola.tradelynkapi.dtos.response.AuthResponse;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.entity.VerificationToken;
import com.codewithola.tradelynkapi.exception.ResourceNotFoundException;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import com.codewithola.tradelynkapi.repositories.VerificationTokenRepository;
import com.codewithola.tradelynkapi.security.jwt.JwtTokenProvider;
import com.codewithola.tradelynkapi.services.UserService;
import com.codewithola.tradelynkapi.services.VerificationService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * Handles user registration, login, and token management
 * Base URL: /api/v1/auth
 */
@RestController
@RequestMapping("/auth")
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final VerificationTokenRepository verificationTokenRepository;
    private final VerificationService verificationService;
    private final UserRepository userRepository;

    @Value("${jwt.expiration}")
    private Long jwtExpirationMs;

    @Autowired
    public AuthController(UserService userService, JwtTokenProvider jwtTokenProvider,VerificationTokenRepository verificationTokenRepository,VerificationService verificationService,UserRepository userRepository) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.verificationTokenRepository = verificationTokenRepository;
        this.verificationService = verificationService;
        this.userRepository = userRepository;
    }

    /**
     * Register a new user
     * POST /api/v1/auth/register
     *
     * Request Body:
     * {
     *   "email": "student@landmark.edu.ng",
     *   "name": "John Doe",
     *   "password": "SecurePass123"
     * }
     *
     * Response: 201 CREATED
     * {
     *   "success": true,
     *   "message": "User registered successfully",
     *   "data": {
     *     "userId": 1,
     *     "email": "student@landmark.edu.ng",
     *     "name": "John Doe",
     *     "role": "BUYER",
     *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *     "tokenType": "Bearer",
     *     "expiresIn": 86400000,
     *     "isEmailVerified": false,
     *     "message": "Registration successful"
     *   }
     * }
     *
     * Error Responses:
     * - 400 BAD REQUEST: Invalid email format or weak password
     * - 409 CONFLICT: Email already exists
     * - 500 INTERNAL SERVER ERROR: Server error
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request received for email: {}", request.getEmail());

        // 1️⃣ Register user
        User user = userService.registerUser(
                request.getEmail(),
                request.getName(),
                request.getPassword()
        );

        // 2️⃣ Send verification email
        verificationService.sendVerificationEmail(user);

        // 3️⃣ Build response (no token yet until verified)
        AuthResponse authResponse = AuthResponse.fromUser(
                user,
                null, // No JWT yet
                jwtExpirationMs,
                "Registration successful! Please check your email to verify your account."
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully. Verification email sent.", authResponse));
    }


    /**
     * Login user
     * POST /api/v1/auth/login
     *
     * Request Body:
     * {
     *   "email": "student@landmark.edu.ng",
     *   "password": "SecurePass123"
     * }
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "Login successful",
     *   "data": {
     *     "userId": 1,
     *     "email": "student@landmark.edu.ng",
     *     "name": "John Doe",
     *     "role": "BUYER",
     *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *     "tokenType": "Bearer",
     *     "expiresIn": 86400000,
     *     "isEmailVerified": false,
     *     "message": "Login successful"
     *   }
     * }
     *
     * Error Responses:
     * - 401 UNAUTHORIZED: Invalid credentials
     * - 403 FORBIDDEN: Account deactivated
     * - 500 INTERNAL SERVER ERROR: Server error
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request received for email: {}", request.getEmail());

        // Authenticate user
        User user = userService.loginUser(request.getEmail(), request.getPassword());

        // Generate JWT token
        String token = jwtTokenProvider.generateTokenFromEmail(user.getEmail());
        log.debug("JWT token generated for user: {}", user.getEmail());

        // Build response
        AuthResponse authResponse = AuthResponse.fromUser(
                user,
                token,
                jwtExpirationMs,
                "Login successful. Welcome back!"
        );

        log.info("User logged in successfully: {}", user.getEmail());

        return ResponseEntity
                .ok(ApiResponse.success("Login successful", authResponse));
    }

    /**
     * Refresh JWT token
     * POST /api/v1/auth/refresh-token
     *
     * Request Header:
     * Authorization: Bearer <old_token>
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "Token refreshed successfully",
     *   "data": {
     *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *     "tokenType": "Bearer",
     *     "expiresIn": 86400000
     *   }
     * }
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestHeader("Authorization") String authHeader) {
        log.info("Token refresh request received");

        // Extract token from header
        String token = authHeader.substring(7); // Remove "Bearer " prefix

        // Validate token
        if (!jwtTokenProvider.validateToken(token)) {
            log.error("Invalid token provided for refresh");
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid or expired token"));
        }

        // Extract email from token
        String email = jwtTokenProvider.getUsernameFromToken(token);

        // Get user
        User user = userService.getUserByEmail(email);

        // Generate new token
        String newToken = jwtTokenProvider.generateTokenFromEmail(user.getEmail());

        // Build response
        AuthResponse authResponse = AuthResponse.fromUser(
                user,
                newToken,
                jwtExpirationMs,
                "Token refreshed successfully"
        );

        log.info("Token refreshed successfully for user: {}", email);

        return ResponseEntity
                .ok(ApiResponse.success("Token refreshed successfully", authResponse));
    }

    /**
     * Logout user (client-side token removal)
     * POST /api/v1/auth/logout
     *
     * Note: JWT tokens are stateless, so logout is handled client-side
     * by removing the token from storage. This endpoint is for logging purposes.
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "Logged out successfully"
     * }
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String email = jwtTokenProvider.getUsernameFromToken(token);
            log.info("User logged out: {}", email);
        }

        return ResponseEntity
                .ok(ApiResponse.success("Logged out successfully. Please remove token from client.", null));
    }

    /**
     * Check if email exists
     * GET /api/v1/auth/check-email?email=student@landmark.edu.ng
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "Email availability checked",
     *   "data": {
     *     "exists": true
     *   }
     * }
     */
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmail(@RequestParam String email) {
        log.debug("Email availability check for: {}", email);

        boolean exists = userService.emailExists(email);

        return ResponseEntity
                .ok(ApiResponse.success("Email availability checked", exists));
    }

    /**
     * Health check endpoint
     * GET /api/v1/auth/health
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "message": "Auth service is running"
     * }
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity
                .ok(ApiResponse.success("Auth service is running", "OK"));
    }

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam("token") String token) {
        log.info("Received email verification request with token: {}", token);

        // 1️⃣ Look up token in DB
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid verification token"));

        // 2️⃣ Check expiration
        if (verificationToken.isExpired()) {
            log.warn("Verification token expired for user: {}", verificationToken.getUser().getEmail());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Verification token has expired. Please request a new verification email."));
        }

        // 3️⃣ Get associated user
        User user = verificationToken.getUser();
        user.setIsEmailVerified(true);
        userRepository.save(user);

        // 4️⃣ Remove used token
        verificationTokenRepository.delete(verificationToken);

        log.info("✅ Email verified successfully for user: {}", user.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully!", "verified"));
    }

}
