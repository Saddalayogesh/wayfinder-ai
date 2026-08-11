package com.tripplanner.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Decorates a delegate {@link CacheManager} so every cache logs a clear
 * CACHE HIT / CACHE MISS line on {@link Cache#get(Object)} — making the
 * caching behavior (and its effect on external Places API calls) observable.
 */
public class LoggingCacheManager implements CacheManager {

    private static final Logger log = LoggerFactory.getLogger("PLACES-CACHE");

    private final CacheManager delegate;
    private final Map<String, Cache> wrapped = new ConcurrentHashMap<>();

    public LoggingCacheManager(CacheManager delegate) {
        this.delegate = delegate;
    }

    @Override
    public Cache getCache(String name) {
        Cache cache = delegate.getCache(name);
        if (cache == null) {
            return null;
        }
        return wrapped.computeIfAbsent(name, key -> new LoggingCache(cache, log));
    }

    @Override
    public Collection<String> getCacheNames() {
        return delegate.getCacheNames();
    }
}
