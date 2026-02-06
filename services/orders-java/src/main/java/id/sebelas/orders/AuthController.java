package id.sebelas.orders;

import id.sebelas.orders.model.User;
import id.sebelas.orders.repo.UserRepo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final UserRepo userRepo;
  private final JwtService jwtService;
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

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
      .filter(user -> encoder.matches(request.password, user.getPasswordHash()))
      .map(user -> ResponseEntity.ok(Map.of(
        "token", jwtService.generateToken(user.getId().toString()),
        "userId", user.getId()
      )))
      .orElseGet(() -> ResponseEntity.status(401).body(Map.of("error", "invalid")));
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
}
