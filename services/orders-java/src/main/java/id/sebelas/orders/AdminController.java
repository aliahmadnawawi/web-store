package id.sebelas.orders;

import id.sebelas.orders.model.Invoice;
import id.sebelas.orders.repo.DeliveryRepo;
import id.sebelas.orders.repo.InvoiceRepo;
import id.sebelas.orders.repo.AuditLogRepo;
import id.sebelas.orders.model.AuditLog;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Sort;

import java.security.MessageDigest;
import java.util.*;

@RestController
@RequestMapping("/admin")
public class AdminController {
  private final InvoiceRepo invoiceRepo;
  private final DeliveryRepo deliveryRepo;
  private final AuditLogRepo auditLogRepo;

  public AdminController(InvoiceRepo invoiceRepo, DeliveryRepo deliveryRepo, AuditLogRepo auditLogRepo) {
    this.invoiceRepo = invoiceRepo;
    this.deliveryRepo = deliveryRepo;
    this.auditLogRepo = auditLogRepo;
  }

  private String requireAdmin(String key) {
    String expected = System.getenv("ADMIN_API_KEY");
    if (expected == null || expected.isBlank()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "admin key not configured");
    }
    if (key == null || !MessageDigest.isEqual(key.getBytes(), expected.getBytes())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized");
    }
    return System.getenv().getOrDefault("ADMIN_ROLE", "editor");
  }

  private void audit(String actor, String role, String action, String entity, String entityId, String meta) {
    AuditLog log = new AuditLog();
    log.setActor(actor);
    log.setRole(role);
    log.setAction(action);
    log.setEntity(entity);
    log.setEntityId(entityId);
    log.setMeta(meta);
    auditLogRepo.save(log);
  }

  @GetMapping("/audit-logs")
  public Map<String, Object> auditLogs(
    @RequestHeader(value = "X-Admin-Key", required = false) String key,
    @RequestHeader(value = "X-Admin-User", required = false) String actor,
    @RequestParam(value = "limit", required = false, defaultValue = "100") int limit,
    @RequestParam(value = "q", required = false) String q
  ) {
    String role = requireAdmin(key);
    List<AuditLog> all = auditLogRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    String query = q == null ? "" : q.toLowerCase();
    List<Map<String, Object>> data = all.stream()
      .filter(log -> query.isBlank() || (
        (log.getActor() != null && log.getActor().toLowerCase().contains(query)) ||
        (log.getAction() != null && log.getAction().toLowerCase().contains(query)) ||
        (log.getEntity() != null && log.getEntity().toLowerCase().contains(query))
      ))
      .limit(limit)
      .map(log -> Map.<String, Object>of(
        "id", log.getId(),
        "actor", log.getActor(),
        "role", log.getRole(),
        "action", log.getAction(),
        "entity", log.getEntity(),
        "entityId", log.getEntityId(),
        "meta", log.getMeta(),
        "createdAt", log.getCreatedAt()
      )).toList();
    audit(actor == null ? "admin" : actor, role, "LIST", "audit_log", "", "limit=" + limit);
    return Map.of("data", data);
  }

  @GetMapping("/invoices")
  public Map<String, Object> invoices(
    @RequestHeader(value = "X-Admin-Key", required = false) String key,
    @RequestHeader(value = "X-Admin-User", required = false) String actor,
    @RequestParam(value = "limit", required = false, defaultValue = "100") int limit
  ) {
    String role = requireAdmin(key);
    List<Invoice> all = invoiceRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    audit(actor == null ? "admin" : actor, role, "LIST", "invoice", "", "limit=" + limit);
    List<Map<String, Object>> data = all.stream().limit(limit).map(inv -> Map.<String, Object>ofEntries(
      Map.entry("id", inv.getId()),
      Map.entry("invoiceCode", inv.getInvoiceCode()),
      Map.entry("token", inv.getToken()),
      Map.entry("invoiceUrl", "https://sebelasindonesia.app/invoice/" + inv.getToken()),
      Map.entry("status", inv.getStatus()),
      Map.entry("orderType", inv.getOrderType()),
      Map.entry("baseAmount", inv.getBaseAmount()),
      Map.entry("amount", inv.getAmount()),
      Map.entry("productId", inv.getProductId()),
      Map.entry("productName", inv.getProductName()),
      Map.entry("productType", inv.getProductType()),
      Map.entry("ppobCode", inv.getPpobCode()),
      Map.entry("ppobCustomerNumber", inv.getPpobCustomerNumber()),
      Map.entry("contact", inv.getContact()),
      Map.entry("memberId", inv.getMemberId()),
      Map.entry("createdAt", inv.getCreatedAt())
    )).toList();
    return Map.of("data", data);
  }

  @GetMapping("/deliveries/{invoiceCode}")
  public Map<String, Object> deliveries(
    @RequestHeader(value = "X-Admin-Key", required = false) String key,
    @RequestHeader(value = "X-Admin-User", required = false) String actor,
    @PathVariable("invoiceCode") String invoiceCode
  ) {
    String role = requireAdmin(key);
    audit(actor == null ? "admin" : actor, role, "GET", "delivery", invoiceCode, "");
    return invoiceRepo.findByInvoiceCode(invoiceCode)
      .map(inv -> Map.of(
        "invoiceCode", inv.getInvoiceCode(),
        "deliveries", deliveryRepo.findByInvoiceId(inv.getId())
      ))
      .orElseGet(() -> Map.of("deliveries", List.of()));
  }
}
