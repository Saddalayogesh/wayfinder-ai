package com.tripplanner.common;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimiterTest {

    @Test
    void capacityIsEnforcedPerUser() {
        RateLimiter limiter = new RateLimiter(2, 0);

        assertTrue(limiter.tryAcquire(1L));
        assertTrue(limiter.tryAcquire(1L));
        assertFalse(limiter.tryAcquire(1L), "third request should be denied at capacity");

        // A different user has their own independent bucket.
        assertTrue(limiter.tryAcquire(2L));
        assertTrue(limiter.tryAcquire(2L));
    }

    @Test
    void tokensRefillOverTime() throws InterruptedException {
        // Refill rate 60/minute == 1 token/second.
        RateLimiter limiter = new RateLimiter(1, 60);

        assertTrue(limiter.tryAcquire(1L));
        assertFalse(limiter.tryAcquire(1L), "bucket empty immediately after consumption");

        Thread.sleep(1100);
        assertTrue(limiter.tryAcquire(1L), "token should have been refilled after ~1s");
    }

    @Test
    void capacityIsAtLeastOne() {
        RateLimiter limiter = new RateLimiter(0, 0);

        assertTrue(limiter.tryAcquire(7L));
    }
}
