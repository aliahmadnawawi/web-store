package id.sebelas.orders;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
  @Value("${JWT_SECRET:change_me}")
  private String secret;

  public String generateToken(String userId) {
    return Jwts.builder()
      .claims(Map.of("sub", userId))
      .issuedAt(new Date())
      .expiration(new Date(System.currentTimeMillis() + 86400000))
      .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
      .compact();
  }
}
