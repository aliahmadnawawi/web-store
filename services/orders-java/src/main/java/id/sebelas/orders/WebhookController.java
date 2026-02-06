package id.sebelas.orders;

import id.sebelas.orders.model.Delivery;
import id.sebelas.orders.repo.DeliveryRepo;
import id.sebelas.orders.repo.InvoiceRepo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import id.sebelas.orders.service.StockClient;
import id.sebelas.orders.service.DeliveryService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/webhook")
public class WebhookController {
  private final IdempotencyService idempotencyService = new IdempotencyService();
  private final InvoiceRepo invoiceRepo;
  private final DeliveryRepo deliveryRepo;
  private final StockClient stockClient;
  private final DeliveryService deliveryService;

  @Value("${TRIPAY_PRIVATE_KEY:}")
  private String tripayPrivateKey;

  public WebhookController(InvoiceRepo invoiceRepo, DeliveryRepo deliveryRepo, StockClient stockClient, DeliveryService deliveryService) {
    this.invoiceRepo = invoiceRepo;
    this.deliveryRepo = deliveryRepo;
    this.stockClient = stockClient;
    this.deliveryService = deliveryService;
  }

  @PostMapping("/tripay")
  public ResponseEntity<?> handleTripay(
    @RequestHeader(value = "X-Callback-Signature", required = false) String signature,
    @RequestHeader(value = "X-Callback-Event", required = false) String callbackEvent,
    @RequestBody String rawBody
  ) {
    if (tripayPrivateKey != null && !tripayPrivateKey.isBlank()) {
      String expected = hmacSha256(rawBody, tripayPrivateKey);
      if (signature == null || !signature.equalsIgnoreCase(expected)) {
        return ResponseEntity.status(403).body(Map.of("error", "invalid signature"));
      }
    }

    if (callbackEvent != null && !callbackEvent.equalsIgnoreCase("payment_status")) {
      return ResponseEntity.badRequest().body(Map.of("error", "invalid callback"));
    }

    TripayWebhook payload = TripayWebhook.fromRaw(rawBody);
    if (payload == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "invalid payload"));
    }

    String idempotencyKey = payload.reference + ":" + payload.status;
    if (idempotencyService.isDuplicate(idempotencyKey)) {
      return ResponseEntity.ok(Map.of("status", "duplicate"));
    }

    if ("PAID".equalsIgnoreCase(payload.status)) {
      invoiceRepo.findByInvoiceCode(payload.reference).ifPresent(invoice -> {
        invoice.setStatus("PAID");
        invoiceRepo.save(invoice);

        String productId = invoice.getProductId();
        Map<String, Object> stock = (productId == null || productId.isBlank())
          ? Map.of("payload", "manual delivery")
          : stockClient.allocate(productId, invoice.getInvoiceCode());

        Delivery delivery = new Delivery();
        delivery.setInvoiceId(invoice.getId());
        delivery.setChannel("AUTO");
        delivery.setPayload(String.valueOf(stock.getOrDefault("payload", "pending")));
        delivery.setSentAt(Instant.now());
        deliveryRepo.save(delivery);

        if (invoice.getContact() != null && invoice.getContact().contains("@")) {
          deliveryService.sendEmail(invoice.getContact(), "Produk: " + delivery.getPayload());
        } else if (invoice.getContact() != null) {
          deliveryService.sendWhatsApp(invoice.getContact(), "Produk: " + delivery.getPayload());
        }
      });
    }

    return ResponseEntity.ok(Map.of("success", true));
  }

  private String hmacSha256(String data, String key) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder();
      for (byte b : digest) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    } catch (Exception e) {
      return "";
    }
  }

  public static class TripayWebhook {
    @NotBlank
    public String reference;

    @NotBlank
    public String status;

    public static TripayWebhook fromRaw(String raw) {
      try {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(raw);
        String ref = root.path("merchant_ref").asText();
        String status = root.path("status").asText();
        int closed = root.path("is_closed_payment").asInt(1);
        TripayWebhook w = new TripayWebhook();
        w.reference = ref;
        w.status = status;
        if (closed != 1) {
          return null;
        }
        return w;
      } catch (Exception e) {
        return null;
      }
    }
  }
}
