package com.tripplanner.security;

import com.tripplanner.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Creates and validates HMAC-signed JWTs (JJWT 0.12.x).
 *
 * <p>Claims: {@code sub} = user email, {@code role} = user's role, plus
 * standard {@code iat}/{@code exp}. The signing key is derived from
 * {@code app.jwt.secret}; JJWT picks the strongest HMAC algorithm the key
 * length supports (HS256/HS384/HS512).</p>
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /** Creates a signed JWT for the given user. */
    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("role", user.getRole().name())
                .claim("name", user.getName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key)
                .compact();
    }

    /** Extracts the subject (email) from a token. Throws if the token is invalid or expired. */
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    /** Returns true when the token is signed by us, unexpired, and belongs to the user. */
    public boolean isTokenValid(String token, User user) {
        Claims claims = parseClaims(token);
        return claims.getSubject().equals(user.getEmail())
                && claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
