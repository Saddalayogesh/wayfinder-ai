package com.tripplanner.auth;

import com.tripplanner.auth.dto.AuthResponse;
import com.tripplanner.auth.dto.LoginRequest;
import com.tripplanner.auth.dto.RegisterRequest;
import com.tripplanner.exception.EmailAlreadyExistsException;
import com.tripplanner.security.JwtService;
import com.tripplanner.user.Role;
import com.tripplanner.user.User;
import com.tripplanner.user.UserRepository;
import com.tripplanner.user.UserResponse;
import com.tripplanner.user.dto.UpdateProfileRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("An account with this email already exists");
        }

        User user = new User(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password()),
                Role.USER
        );
        userRepository.save(user);

        return AuthResponse.of(jwtService.generateToken(user), UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return AuthResponse.of(jwtService.generateToken(user), UserResponse.from(user));
    }

    /**
     * Updates the signed-in user's profile: display name always, and the
     * password when both password fields are supplied (the current password
     * is verified first). Returns the refreshed profile.
     */
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setName(request.name().trim());

        if (request.newPassword() != null) {
            if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(request.newPassword()));
        }
        return UserResponse.from(user);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
