package com.codewithola.tradelynkapi.security.jwt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JwtAuthenticationFilter extends org.springframework.web.filter.OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @Autowired
    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   org.springframework.security.core.userdetails.UserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Skip JWT authentication for webhook endpoints
     */
    @Override
    protected boolean shouldNotFilter(jakarta.servlet.http.HttpServletRequest request) {
        String path = request.getRequestURI();
        // Handle both with and without context-path
        boolean shouldSkip = path.contains("/payments/webhook");
        if (shouldSkip) {
            log.info("Skipping JWT filter for webhook: {}", path);
        }
        return shouldSkip;
    }

    @Override
    protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                                    jakarta.servlet.http.HttpServletResponse response,
                                    jakarta.servlet.FilterChain filterChain)
            throws jakarta.servlet.ServletException, java.io.IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (jwt != null && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);

                org.springframework.security.core.userdetails.UserDetails userDetails =
                        userDetailsService.loadUserByUsername(username);

                org.springframework.security.authentication.UsernamePasswordAuthenticationToken authentication =
                        new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new org.springframework.security.web.authentication.WebAuthenticationDetailsSource()
                        .buildDetails(request));

                org.springframework.security.core.context.SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);

                request.setAttribute("userId", username);

                log.debug("JWT validated for user: {}", username);
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(jakarta.servlet.http.HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}