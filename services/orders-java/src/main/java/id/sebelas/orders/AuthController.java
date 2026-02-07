package id.sebelas.orders;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import id.sebelas.orders.model.User;
import id.sebelas.orders.repo.UserRepo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final UserRepo userRepo;
  private final JwtService jwtService;
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
  private final ObjectMapper mapper = new ObjectMapper();

  public AuthController(UserRepo userRepo, JwtService jwtService) {
    this.userRepo = userRepo;
    this.jwtService = jwtService;
  }

  @PostMapping("/register")
  public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
    if (userRepo.findByEmail(request.email).isPresent()) {
      return ResponseEntity.badRequest().body(Map.of("error", "email already used"));
    }

    User user = new User();
    user.setEmail(request.email);
    user.setPasswordHash(encoder.encode(request.password));
    userRepo.save(user);

    return ResponseEntity.ok(Map.of("userId", user.getId()));
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
    return userRepo.findByEmail(request.email)
      .filter(user -> user.getPasswordHash() != null && encoder.matches(request.password, user.getPasswordHash()))
      .map(user -> ResponseEntity.ok(Map.of(
        "token", jwtService.generateToken(user.getId().toString()),
        "userId", user.getId()
      )))
      .orElseGet(() -> ResponseEntity.status(401).body(Map.of("error", "invalid")));
  }

  @PostMapping("/google")
  public ResponseEntity<?> google(@Valid @RequestBody GoogleRequest request) {
    Map<String, Object> info = verifyGoogleIdToken(request.idToken);
    String email = String.valueOf(info.getOrDefault("email", "")).trim();
    String aud = String.valueOf(info.getOrDefault("aud", "")).trim();
    String expectedAud = String.valueOf(System.getenv().getOrDefault("GOOGLE_CLIENT_ID", "")).trim();

    if (email.isBlank()) {
      return ResponseEntity.status(401).body(Map.of("error", "invalid google token"));
    }
    if (!expectedAud.isBlank() && !expectedAud.equals(aud)) {
      return ResponseEntity.status(401).body(Map.of("error", "invalid google audience"));
    }

    User user = userRepo.findByEmail(email).orElseGet(() -> {
      User u = new User();
      u.setEmail(email);
      // Set a random hash so password login doesn't NPE and remains unusable by default.
      u.setPasswordHash(encoder.encode(java.util.UUID.randomUUID().toString()));
      return userRepo.save(u);
    });

    return ResponseEntity.ok(Map.of(
      "token", jwtService.generateToken(user.getId().toString()),
      "userId", user.getId()
    ));
  }

  private Map<String, Object> verifyGoogleIdToken(String idToken) {
    try {
      RestTemplate rt = new RestTemplate();
      String raw = rt.getForObject("https://oauth2.googleapis.com/tokeninfo?id_token={token}", String.class, idToken);
      if (raw == null || raw.isBlank()) return Map.of();
      return mapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
    } catch (Exception ignored) {
      return Map.of();
    }
  }

  public static class RegisterRequest {
    @Email
    public String email;

    @NotBlank
    public String password;
  }

  public static class LoginRequest {
    @Email
    public String email;

    @NotBlank
    public String password;
  }

  public static class GoogleRequest {
    @NotBlank
    public String idToken;
  }
}
