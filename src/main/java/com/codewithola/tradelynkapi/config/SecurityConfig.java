package com.codewithola.tradelynkapi.config;

import com.codewithola.tradelynkapi.security.jwt.JwtAuthenticationEntryPoint;
import com.codewithola.tradelynkapi.security.jwt.JwtAuthenticationFilter;
import com.codewithola.tradelynkapi.security.RateLimitingFilter;
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

@Configuration
@EnableWebSecurity
@AllArgsConstructor
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(jwtAuthenticationEntryPoint)
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(authz -> authz
                        // ✅ Authentication endpoints
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // ✅ Webhook endpoints
                        .requestMatchers("/payments/webhook").permitAll()
                        .requestMatchers("/payments/webhook/**").permitAll()
                        .requestMatchers("/whatsapp/webhook").permitAll()      // ← ADD THIS LINE
                        .requestMatchers("/whatsapp/webhook/**").permitAll()   // ← ADD THIS LINE
                        .requestMatchers("/api/v1/whatsapp/webhook").permitAll()      // ← ADD THIS LINE TOO (for safety)
                        .requestMatchers("/api/v1/whatsapp/webhook/**").permitAll()   // ← ADD THIS LINE TOO

                        // ✅ Public endpoints
                        .requestMatchers("/public/**").permitAll()
                        .requestMatchers("/health").permitAll()
                        .requestMatchers("/actuator/**").permitAll()

                        // ✅ Item endpoints (public read, auth write)
                        .requestMatchers(HttpMethod.GET, "/items/**").permitAll()

                        // ✅ Seller endpoints (public read ONLY)
                        .requestMatchers(HttpMethod.GET, "/sellers/banks").permitAll()
                        .requestMatchers(HttpMethod.GET, "/sellers/**").permitAll()

                        // ✅ Documentation
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // ✅ Admin endpoints
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // ✅ All other endpoints require authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}