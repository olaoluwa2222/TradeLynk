package com.codewithola.tradelynkapi.config;

import com.codewithola.tradelynkapi.security.jwt.JwtAuthenticationEntryPoint;
import com.codewithola.tradelynkapi.security.jwt.JwtAuthenticationFilter;
import com.codewithola.tradelynkapi.security.RateLimitingFilter; // ✅ Import your rate limiting filter
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security Configuration for JWT-based authentication
 * Configures:
 * - Password encoding with bcrypt
 * - JWT filter for token validation
 * - Rate limiting filter for API protection
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
    private final RateLimitingFilter rateLimitingFilter; // ✅ Inject rate limiting filter
    private final CorsConfigurationSource corsConfigurationSource;

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
     *
     * FILTER ORDER (VERY IMPORTANT!):
     * 1. RateLimitingFilter - Checks rate limits FIRST (before authentication)
     * 2. JwtAuthenticationFilter - Validates JWT and sets userId for rate limiting
     * 3. UsernamePasswordAuthenticationFilter - Spring's default filter
     *
     * Why this order?
     * - Rate limiting happens BEFORE authentication to prevent auth endpoint abuse
     * - JWT filter sets userId attribute that rate limiter uses for per-user limits
     *
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
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

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
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/items/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/sellers/*/profile").permitAll()
                        .requestMatchers(HttpMethod.GET, "/sellers/*/items").permitAll()
                        .requestMatchers(HttpMethod.GET, "/sellers/banks").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/health/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )

                // ✅✅✅ ADD FILTERS IN THIS SPECIFIC ORDER ✅✅✅
                // 1. Rate limiting filter FIRST (runs before JWT authentication)
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)

                // 2. JWT authentication filter SECOND (runs after rate limiting, before Spring's auth filter)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}