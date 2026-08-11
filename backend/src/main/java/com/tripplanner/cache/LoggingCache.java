package com.tripplanner.cache;

import org.slf4j.Logger;
import org.springframework.cache.Cache;
import org.springframework.cache.support.NullValue;

import java.util.concurrent.Callable;

/**
 * Read-only-aware {@link Cache} decorator: logs a clear
 * "CACHE HIT  cache=places key=Tokyo" / "CACHE MISS cache=places key=Tokyo"
 * line for every read so the effectiveness of the places cache is observable.
 * All writes delegate straight through.
 */
public class LoggingCache implements Cache {

    private final Cache delegate;
    private final Logger log;

    public LoggingCache(Cache delegate, Logger log) {
        this.delegate = delegate;
        this.log = log;
    }

    @Override
    public String getName() {
        return delegate.getName();
    }

    @Override
    public Object getNativeCache() {
        return delegate.getNativeCache();
    }

    @Override
    public ValueWrapper get(Object key) {
        ValueWrapper wrapper = delegate.get(key);
        logRead(key, wrapper);
        return wrapper;
    }

    @Override
    public <T> T get(Object key, Class<T> type) {
        T value = delegate.get(key, type);
        logRead(key, value);
        return value;
    }

    @Override
    public <T> T get(Object key, Callable<T> valueLoader) {
        T value = delegate.get(key, valueLoader);
        logRead(key, value);
        return value;
    }

    @Override
    public void put(Object key, Object value) {
        delegate.put(key, value);
    }

    @Override
    public ValueWrapper putIfAbsent(Object key, Object value) {
        return delegate.putIfAbsent(key, value);
    }

    @Override
    public void evict(Object key) {
        delegate.evict(key);
    }

    @Override
    public void clear() {
        delegate.clear();
    }

    private void logRead(Object key, Object value) {
        boolean hit = value != null && value != NullValue.INSTANCE;
        if (hit) {
            log.info("CACHE HIT  cache={} key={}", delegate.getName(), key);
        } else {
            log.info("CACHE MISS cache={} key={}", delegate.getName(), key);
        }
    }
}
