package com.app.ecom.security;

import com.app.ecom.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class IdentityResolver {

    private final Environment env;

    public String resolveUserId(String headerUserId) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            return String.valueOf(user.getId());
        }

        boolean isDev = Arrays.asList(env.getActiveProfiles()).contains("dev");
        if (isDev && headerUserId != null && !headerUserId.isBlank()) {
            return headerUserId;
        }

        throw new InsufficientAuthenticationException(
                "Full authentication is required to access this resource."
        );
    }
}
