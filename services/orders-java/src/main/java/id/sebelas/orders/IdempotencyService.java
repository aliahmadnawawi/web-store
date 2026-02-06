package id.sebelas.orders;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class IdempotencyService {
  private final Map<String, Long> store = new ConcurrentHashMap<>();
  private static final long TTL_SECONDS = 300;

  public boolean isDuplicate(String key) {
    cleanup();
    return store.putIfAbsent(key, Instant.now().getEpochSecond()) != null;
  }

  private void cleanup() {
    long now = Instant.now().getEpochSecond();
    store.entrySet().removeIf(entry -> now - entry.getValue() > TTL_SECONDS);
  }
}
