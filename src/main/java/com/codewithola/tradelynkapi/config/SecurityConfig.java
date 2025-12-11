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

                        // ✅✅✅ WEBHOOK ENDPOINTS - MUST BE BEFORE anyRequest() ✅✅✅
                        .requestMatchers("/payments/webhook").permitAll()
                        .requestMatchers("/payments/webhook/**").permitAll()

                        // ✅ Public endpoints
                        .requestMatchers("/public/**").permitAll()
                        .requestMatchers("/health").permitAll()
                        .requestMatchers("/actuator/**").permitAll()

                        // ✅ Item endpoints
                        .requestMatchers(HttpMethod.GET, "/items/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/items/suggestions").permitAll()

                        // ✅ Seller endpoints
                        .requestMatchers(HttpMethod.GET, "/sellers/*/profile").permitAll()
                        .requestMatchers(HttpMethod.GET, "/sellers/*/items").permitAll()
                        .requestMatchers(HttpMethod.GET, "/sellers/banks").permitAll()

                        // ✅ Documentation
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // ✅ Admin endpoints
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/health/**").hasRole("ADMIN")

                        // ✅ All other endpoints require authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}