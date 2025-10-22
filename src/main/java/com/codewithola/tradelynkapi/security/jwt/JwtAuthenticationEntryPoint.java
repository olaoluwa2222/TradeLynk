package com.codewithola.tradelynkapi.security.jwt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JwtAuthenticationEntryPoint implements org.springframework.security.web.AuthenticationEntryPoint {

    @Override
    public void commence(jakarta.servlet.http.HttpServletRequest httpServletRequest,
                         jakarta.servlet.http.HttpServletResponse httpServletResponse,
                         org.springframework.security.core.AuthenticationException e)
            throws java.io.IOException {
        log.error("Responding with unauthorized error. Message - {}", e.getLocalizedMessage());

        httpServletResponse.setContentType("application/json;charset=UTF-8");
        httpServletResponse.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);

        final java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("status", jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
        body.put("error", "Unauthorized");
        body.put("message", e.getLocalizedMessage());
        body.put("path", httpServletRequest.getServletPath());

        final com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        mapper.writeValue(httpServletResponse.getOutputStream(), body);
    }
}
