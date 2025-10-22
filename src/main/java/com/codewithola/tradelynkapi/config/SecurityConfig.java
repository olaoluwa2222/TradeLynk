package com.codewithola.tradelynkapi.config;


import com.codewithola.tradelynkapi.security.jwt.JwtAuthenticationEntryPoint;
import com.codewithola.tradelynkapi.security.jwt.JwtAuthenticationFilter;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Spring Security Configuration for JWT-based authentication
 * Configures:
 * - Password encoding with bcrypt
 * - JWT filter for token validation
 * - HTTP security policy
 * - Session management (stateless)
 * - CORS settings for frontend integration
 */
@Configuration
@EnableWebSecurity
@AllArgsConstructor
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;



    /**
     * BCryptPasswordEncoder bean for secure password hashing
     * Strength parameter: 12 (recommended for production)
     * @return PasswordEncoder instance
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * Authentication manager bean for handling authentication requests
     * @param config Authentication configuration
     * @return AuthenticationManager instance
     * @throws Exception if configuration is invalid
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Main security filter chain configuration
     * Defines which endpoints require authentication and which are public
     * Disables CSRF for API (uses JWT tokens instead)
     * Configures stateless session management (no cookies)
     * @param http HttpSecurity configuration object
     * @return SecurityFilterChain
     * @throws Exception if security configuration fails
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF for stateless API (JWT handles security instead)
                .csrf(AbstractHttpConfigurer::disable)

                // Enable CORS for frontend integration
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Configure exception handling for authentication errors
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(jwtAuthenticationEntryPoint)
                )

                // Set session management to stateless (no server-side sessions)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Configure authorization for endpoints
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/public/**").permitAll()
                        .requestMatchers("/health").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .anyRequest().authenticated()
                )


                // Add JWT authentication filter before UsernamePasswordAuthenticationFilter
                // This filter validates JWT tokens on every request
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS configuration for frontend integration
     * Allows requests from localhost (development) and production domains
     * Permits common HTTP methods and headers
     * @return CorsConfigurationSource
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allowed origins - update with your frontend URL in production
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",      // React dev server
                "http://localhost:8080",      // Local backend
                "https://yourdomain.com"      // Update with production domain
        ));

        // Allowed HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Allowed headers
        configuration.setAllowedHeaders(List.of("*"));

        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Maximum age of pre-flight requests (in seconds)
        configuration.setMaxAge(3600L);

        // Expose Authorization header so frontend can read it
        configuration.setExposedHeaders(Collections.singletonList("Authorization"));

        // Apply CORS configuration to all endpoints
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}