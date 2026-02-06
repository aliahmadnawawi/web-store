package id.sebelas.orders;

import id.sebelas.orders.model.Invoice;
import id.sebelas.orders.repo.DeliveryRepo;
import id.sebelas.orders.repo.InvoiceRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/invoice")
public class InvoiceController {
  private final InvoiceRepo invoiceRepo;
  private final DeliveryRepo deliveryRepo;

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
      .map(invoice -> ResponseEntity.ok(Map.of(
        "invoiceToken", token,
        "status", invoice.getStatus(),
        "amount", invoice.getAmount(),
        "contact", invoice.getContact(),
        "deliveries", deliveryRepo.findByInvoiceId(invoice.getId())
      )))
      .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "not found")));
  }

  @GetMapping("/lookup/{invoiceCode}")
  public ResponseEntity<?> lookup(@PathVariable("invoiceCode") String invoiceCode) {
    return invoiceRepo.findByInvoiceCode(invoiceCode)
      .map(inv -> ResponseEntity.ok(Map.of(
        "invoiceCode", inv.getInvoiceCode(),
        "status", inv.getStatus(),
        "invoiceUrl", "https://sebelasindonesia.app/invoice/" + inv.getToken()
      )))
      .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "not found")));
  }
}
