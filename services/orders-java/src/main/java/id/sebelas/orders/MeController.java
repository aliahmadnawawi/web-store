package id.sebelas.orders;

import id.sebelas.orders.model.Invoice;
import id.sebelas.orders.repo.InvoiceRepo;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/me")
public class MeController {
  private final InvoiceRepo invoiceRepo;
  private final JwtService jwtService;

  public MeController(InvoiceRepo invoiceRepo, JwtService jwtService) {
    this.invoiceRepo = invoiceRepo;
    this.jwtService = jwtService;
  }

  @GetMapping
  public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
    String userId = getUserId(auth);
    if (userId.isBlank()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "unauthorized"));
    }
    return ResponseEntity.ok(Map.of("userId", userId));
  }

  @GetMapping("/invoices")
  public ResponseEntity<?> invoices(
    @RequestHeader(value = "Authorization", required = false) String auth,
    @RequestParam(value = "limit", required = false, defaultValue = "50") int limit
  ) {
    String userId = getUserId(auth);
    if (userId.isBlank()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "unauthorized"));
    }
    UUID memberId;
    try {
      memberId = UUID.fromString(userId);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid token"));
    }

    int safeLimit = Math.min(Math.max(limit, 1), 200);
    List<Invoice> all = invoiceRepo.findByMemberIdOrderByCreatedAtDesc(memberId);

    List<Map<String, Object>> data = all.stream().limit(safeLimit).map(inv -> {
      Map<String, Object> out = new LinkedHashMap<>();
      out.put("invoiceCode", inv.getInvoiceCode());
      out.put("token", inv.getToken());
      out.put("status", inv.getStatus());
      out.put("amount", inv.getAmount());
      out.put("productName", inv.getProductName());
      out.put("createdAt", inv.getCreatedAt());
      return out;
    }).toList();

    return ResponseEntity.ok(Map.of("data", data));
  }

  private String getUserId(String authHeader) {
    String token = "";
    if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring("bearer ".length()).trim();
    }
    String sub = jwtService.parseSubject(token);
    return sub == null ? "" : sub;
  }
}
