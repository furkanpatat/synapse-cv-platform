package com.cvplatform.common;

import com.cvplatform.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiRateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitService rateLimit;

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return true;
        Object principal = auth.getPrincipal();
        if (!(principal instanceof User user)) return true;

        rateLimit.chargeAi(user); // throws ApiException 429 if exceeded
        return true;
    }
}
