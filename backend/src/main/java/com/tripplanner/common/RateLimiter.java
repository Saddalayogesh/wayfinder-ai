package com.tripplanner.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Minimal in-memory per-user token-bucket rate limiter.
 *
 * <p>Each user (keyed by user id) gets a bucket with {@code capacity} tokens,
 * refilled at {@code refillPerMinute} tokens per minute. {@link #tryAcquire}
 * consumes one token on success and returns {@code false} when the bucket is
 * empty. State lives in memory only — fine for a single-node monolith.</p>
 */
@Component
public class RateLimiter {

    private static final long MAX_BUCKETS = 10_000;
    private static final long IDLE_EVICTION_SECONDS = 3_600;

    private final int capacity;
    private final double refillPerSecond;
    private final Map<Long, Bucket> buckets = new HashMap<>();
    private final Object lock = new Object();

    public RateLimiter(@Value("${app.rate-limit.generate.capacity:3}") int capacity,
                       @Value("${app.rate-limit.generate.refill-per-minute:1}") double refillPerMinute) {
        this.capacity = Math.max(1, capacity);
        this.refillPerSecond = Math.max(0, refillPerMinute) / 60.0;
    }

    /** Consumes one token for the user if available. */
    public boolean tryAcquire(Long userId) {
        synchronized (lock) {
            Instant now = Instant.now();
            Bucket bucket = buckets.computeIfAbsent(userId, k -> new Bucket(capacity, now));
            bucket.lastAccess = now;
            bucket.refill(now, capacity, refillPerSecond);
            if (buckets.size() > MAX_BUCKETS) {
                // Opportunistic cleanup: drop buckets idle for over an hour so
                // the map cannot grow without bound on a long-running monolith.
                buckets.entrySet().removeIf(e -> e.getValue().idleFor(now) > IDLE_EVICTION_SECONDS);
            }
            if (bucket.tokens >= 1) {
                bucket.tokens -= 1;
                return true;
            }
            return false;
        }
    }

    /** Number of tracked users (used by tests / observability). */
    int trackedUsers() {
        synchronized (lock) {
            return buckets.size();
        }
    }

    private static final class Bucket {
        private double tokens;
        private Instant lastRefill;
        private Instant lastAccess;

        private Bucket(double tokens, Instant now) {
            this.tokens = tokens;
            this.lastRefill = now;
            this.lastAccess = now;
        }

        private void refill(Instant now, int capacity, double refillPerSecond) {
            double elapsedSeconds = Duration.between(lastRefill, now).toMillis() / 1000.0;
            tokens = Math.min(capacity, tokens + elapsedSeconds * refillPerSecond);
            lastRefill = now;
        }

        private long idleFor(Instant now) {
            return Duration.between(lastAccess, now).getSeconds();
        }
    }
}
