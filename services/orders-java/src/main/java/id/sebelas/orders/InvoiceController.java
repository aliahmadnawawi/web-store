package id.sebelas.orders;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import id.sebelas.orders.model.Invoice;
import id.sebelas.orders.repo.DeliveryRepo;
import id.sebelas.orders.repo.InvoiceRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/invoice")
public class InvoiceController {
  private final InvoiceRepo invoiceRepo;
  private final DeliveryRepo deliveryRepo;
  private final ObjectMapper mapper = new ObjectMapper();

  public InvoiceController(InvoiceRepo invoiceRepo, DeliveryRepo deliveryRepo) {
    this.invoiceRepo = invoiceRepo;
    this.deliveryRepo = deliveryRepo;
  }

  @GetMapping("/{token}")
  public ResponseEntity<?> getInvoice(@PathVariable("token") String token) {
    if (!token.matches("^[a-fA-F0-9]{16,64}$")) {
      return ResponseEntity.badRequest().body(Map.of("error", "invalid token"));
    }

    return invoiceRepo.findByToken(token)
      .map(invoice -> {
        // Map.of / Map.ofEntries does not allow null values. Invoices may have null PPOB fields.
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("invoiceToken", token);
        out.put("invoiceCode", invoice.getInvoiceCode());
        out.put("status", invoice.getStatus());
        out.put("orderType", invoice.getOrderType());
        out.put("baseAmount", invoice.getBaseAmount());
        out.put("amount", invoice.getAmount());
        out.put("productId", invoice.getProductId());
        out.put("productName", invoice.getProductName());
        out.put("productType", invoice.getProductType());
        out.put("contact", invoice.getContact());
        out.put("checkoutUrl", invoice.getPaymentCheckoutUrl());
        out.put("payment", parsePayment(invoice));

        Map<String, Object> ppob = new LinkedHashMap<>();
        if (invoice.getPpobCode() != null) ppob.put("code", invoice.getPpobCode());
        if (invoice.getPpobCustomerNumber() != null) ppob.put("customerNumber", invoice.getPpobCustomerNumber());
        if (invoice.getPpobPhone() != null) ppob.put("phone", invoice.getPpobPhone());
        if (invoice.getPpobNoMeterPln() != null) ppob.put("noMeterPln", invoice.getPpobNoMeterPln());
        if (invoice.getPpobOrderId() != null) ppob.put("orderId", invoice.getPpobOrderId());
        out.put("ppob", ppob);

        out.put("deliveries", deliveryRepo.findByInvoiceId(invoice.getId()));
        return ResponseEntity.ok(out);
      })
      .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "not found")));
  }

  private Map<String, Object> parsePayment(Invoice invoice) {
    Map<String, Object> out = new LinkedHashMap<>();
    String raw = invoice.getPaymentRaw();
    if (raw == null || raw.isBlank()) return out;
    try {
      JsonNode root = mapper.readTree(raw);
      JsonNode data = root.path("data");
      if (data.isMissingNode() || data.isNull()) return out;

      putIfNonBlank(out, "method", text(data, "payment_method"));
      putIfNonBlank(out, "methodName", text(data, "payment_name"));
      putIfNonBlank(out, "reference", text(data, "reference"));
      putIfNonBlank(out, "merchantRef", text(data, "merchant_ref"));
      putIfNonBlank(out, "payCode", text(data, "pay_code"));
      putIfNonBlank(out, "qrUrl", text(data, "qr_url"));
      putIfNonBlank(out, "checkoutUrl", text(data, "checkout_url"));
      putIfNonBlank(out, "payUrl", text(data, "pay_url"));

      long expiredTime = data.path("expired_time").asLong(0);
      if (expiredTime > 0) out.put("expiredTime", expiredTime);

      JsonNode instructions = data.path("instructions");
      if (instructions.isArray()) {
        List<Map<String, Object>> groups = new ArrayList<>();
        for (JsonNode g : instructions) {
          Map<String, Object> group = new LinkedHashMap<>();
          putIfNonBlank(group, "title", text(g, "title"));
          List<String> steps = new ArrayList<>();
          JsonNode s = g.path("steps");
          if (s.isArray()) {
            for (JsonNode step : s) {
              String line = step.isTextual() ? step.asText() : "";
              if (!line.isBlank()) steps.add(line);
            }
          }
          if (!steps.isEmpty()) group.put("steps", steps);
          if (!group.isEmpty()) groups.add(group);
        }
        if (!groups.isEmpty()) out.put("instructions", groups);
      }
    } catch (Exception ignored) {
      return out;
    }
    return out;
  }

  private String text(JsonNode node, String field) {
    JsonNode v = node.get(field);
    if (v == null || v.isNull()) return "";
    return v.isTextual() ? v.asText() : v.toString();
  }

  private void putIfNonBlank(Map<String, Object> out, String key, String value) {
    if (value == null) return;
    String v = value.trim();
    if (!v.isBlank()) out.put(key, v);
  }

  @GetMapping("/lookup/{invoiceCode}")
  public ResponseEntity<?> lookup(@PathVariable("invoiceCode") String invoiceCode) {
    return invoiceRepo.findByInvoiceCode(invoiceCode)
      .map(inv -> {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("invoiceCode", inv.getInvoiceCode());
        out.put("status", inv.getStatus());
        out.put("invoiceUrl", "https://sebelasindonesia.app/invoice/" + inv.getToken());
        return ResponseEntity.ok(out);
      })
      .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "not found")));
  }
}
