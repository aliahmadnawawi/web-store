package id.sebelas.orders;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
  private static final int LIMIT = 20;
  private static final long WINDOW_SECONDS = 60;

  private final Map<String, Counter> counters = new ConcurrentHashMap<>();

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
    throws ServletException, IOException {
    String key = request.getRemoteAddr() + ":" + request.getRequestURI();
    Counter counter = counters.computeIfAbsent(key, k -> new Counter());

    synchronized (counter) {
      long now = Instant.now().getEpochSecond();
      if (now - counter.windowStart >= WINDOW_SECONDS) {
        counter.windowStart = now;
        counter.count = 0;
      }

      counter.count++;
      if (counter.count > LIMIT) {
        response.setStatus(429);
        response.getWriter().write("Rate limit exceeded");
        return;
      }
    }

    filterChain.doFilter(request, response);
  }

  private static class Counter {
    long windowStart = Instant.now().getEpochSecond();
    int count = 0;
  }
}
