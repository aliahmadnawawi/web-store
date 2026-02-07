package id.sebelas.orders;

import id.sebelas.orders.model.Invoice;
import id.sebelas.orders.repo.DeliveryRepo;
import id.sebelas.orders.repo.InvoiceRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
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
