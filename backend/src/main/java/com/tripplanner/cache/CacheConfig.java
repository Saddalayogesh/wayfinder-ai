package com.tripplanner.cache;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import java.time.Duration;

/**
 * Caching setup for <b>place enrichment data only</b> — the "places" cache
 * absorbs repeated external Places API calls. Trip data is deliberately never
 * cached (user-specific, mutates often).
 *
 * <p>Cache backends:</p>
 * <ul>
 *   <li>{@code CACHE_TYPE=simple} (default) — in-memory {@link ConcurrentMapCacheManager},
 *       zero external dependencies, so the app keeps working without Redis.</li>
 *   <li>{@code CACHE_TYPE=redis} — {@link RedisCacheManager} with a 24-hour TTL
 *       (place data rarely changes), connected via {@code REDIS_HOST}/{@code REDIS_PORT}
 *       (defaults match the {@code redis} service in docker-compose).</li>
 * </ul>
 *
 * <p>Every {@code get} on a cache logs a clear CACHE HIT / CACHE MISS line so
 * the caching behavior is observable.</p>
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * 24-hour TTL for cached place data — coordinates, addresses and photos do
     * not change often. Only consulted when the Redis cache manager is active.
     */
    @Bean
    public RedisCacheConfiguration redisCacheConfiguration() {
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(24))
                .disableCachingNullValues();
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory,
                                     RedisCacheConfiguration redisCacheConfiguration,
                                     @Value("${spring.cache.type:simple}") String cacheType) {
        CacheManager delegate;
        if ("redis".equalsIgnoreCase(cacheType)) {
            delegate = RedisCacheManager.builder(redisConnectionFactory)
                    .cacheDefaults(redisCacheConfiguration)
                    .build();
        } else {
            delegate = new ConcurrentMapCacheManager();
        }
        return new LoggingCacheManager(delegate);
    }
}
