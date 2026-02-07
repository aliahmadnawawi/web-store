package id.sebelas.orders;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;

@Service
public class JwtService {
  @Value("${JWT_SECRET:change_me}")
  private String secret;

  public String generateToken(String userId) {
    return Jwts.builder()
      .claims(Map.of("sub", userId))
      .issuedAt(new Date())
      .expiration(new Date(System.currentTimeMillis() + 86400000))
      .signWith(key())
      .compact();
  }

  public String parseSubject(String token) {
    try {
      var claims = Jwts.parser()
        .verifyWith(key())
        .build()
        .parseSignedClaims(token)
        .getPayload();
      String sub = claims.getSubject();
      return sub == null ? "" : sub;
    } catch (Exception ignored) {
      return "";
    }
  }

  private SecretKey key() {
    byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
    if (raw.length < 32) {
      try {
        raw = MessageDigest.getInstance("SHA-256").digest(raw);
      } catch (Exception ignored) {
        // Fallback to a deterministic pad to 32 bytes.
        byte[] padded = new byte[32];
        for (int i = 0; i < padded.length; i++) padded[i] = raw[i % raw.length];
        raw = padded;
      }
    }
    return Keys.hmacShaKeyFor(raw);
  }
}
