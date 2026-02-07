package id.sebelas.orders;

import id.sebelas.orders.model.Invoice;
import id.sebelas.orders.service.InvoiceService;
import id.sebelas.orders.service.TripayService;
import id.sebelas.orders.service.FraudClient;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/checkout")
public class CheckoutController {
  private final InvoiceService invoiceService;
  private final TripayService tripayService;
  private final FraudClient fraudClient;
  private final ObjectMapper mapper = new ObjectMapper();

  public CheckoutController(InvoiceService invoiceService, TripayService tripayService, FraudClient fraudClient) {
    this.invoiceService = invoiceService;
    this.tripayService = tripayService;
    this.fraudClient = fraudClient;
  }

  @PostMapping("/guest")
  public ResponseEntity<?> guestCheckout(@Valid @RequestBody GuestCheckoutRequest request) {
    Invoice invoice = invoiceService.createGuestInvoice(request.productId, request.contact);

    Map<String, Object> payment = tripayService.createPayment(invoice.getInvoiceCode(), invoice.getAmount(), invoice.getProductName(), request);
    String paymentRaw = safeJson(payment);
    String checkoutUrl = extractCheckoutUrl(payment);
    invoiceService.recordPayment(invoice, paymentRaw, checkoutUrl);

    Double risk = fraudClient.score(invoice.getInvoiceCode(), invoice.getAmount(), request.deviceFingerprint, request.attempts);
    return ResponseEntity.ok(Map.of(
      "invoiceId", invoice.getInvoiceCode(),
      "invoiceUrl", "https://sebelasindonesia.app/invoice/" + invoice.getToken(),
      "contact", invoice.getContact(),
      "baseAmount", invoice.getBaseAmount(),
      "amount", invoice.getAmount(),
      "checkoutUrl", checkoutUrl,
      "payment", payment,
      "fraudRisk", risk
    ));
  }

  @PostMapping("/member")
  public ResponseEntity<?> memberCheckout(@Valid @RequestBody MemberCheckoutRequest request) {
    Invoice invoice = invoiceService.createMemberInvoice(request.productId, request.memberId);
    Map<String, Object> payment = tripayService.createPayment(invoice.getInvoiceCode(), invoice.getAmount(), invoice.getProductName(), request.toGuest());
    String paymentRaw = safeJson(payment);
    String checkoutUrl = extractCheckoutUrl(payment);
    invoiceService.recordPayment(invoice, paymentRaw, checkoutUrl);

    Double risk = fraudClient.score(invoice.getInvoiceCode(), invoice.getAmount(), request.deviceFingerprint, request.attempts);
    return ResponseEntity.ok(Map.of(
      "invoiceId", invoice.getInvoiceCode(),
      "invoiceUrl", "https://sebelasindonesia.app/invoice/" + invoice.getToken(),
      "memberId", request.memberId,
      "baseAmount", invoice.getBaseAmount(),
      "amount", invoice.getAmount(),
      "checkoutUrl", checkoutUrl,
      "payment", payment,
      "fraudRisk", risk
    ));
  }

  private String safeJson(Object v) {
    try {
      return mapper.writeValueAsString(v);
    } catch (Exception e) {
      return "{}";
    }
  }

  private String extractCheckoutUrl(Map<String, Object> payment) {
    if (payment == null) return "";
    Object dataObj = payment.get("data");
    if (dataObj instanceof Map<?, ?> data) {
      String url = asString(data.get("checkout_url"));
      if (url != null && !url.isBlank()) return url;
      url = asString(data.get("pay_url"));
      if (url != null && !url.isBlank()) return url;
    }
    return "";
  }

  private String asString(Object v) {
    return v == null ? null : String.valueOf(v);
  }

  public static class GuestCheckoutRequest {
    @NotBlank
    public String productId;

    @NotBlank
    @Pattern(regexp = "^[0-9+@A-Za-z._-]{6,}$", message = "contact must be email or phone")
    public String contact;

    public String customerName = "Guest";

    public String paymentMethod = "BRIVA";

    public String deviceFingerprint = "na";

    public int attempts = 1;

    // Deprecated: amount is calculated server-side from product price.
    public int amount = 0;
  }

  public static class MemberCheckoutRequest {
    @NotBlank
    public String productId;

    @NotBlank
    public String memberId;

    public String customerName = "Member";

    public String paymentMethod = "BRIVA";

    public String deviceFingerprint = "na";

    public int attempts = 1;

    // Deprecated: amount is calculated server-side from product price.
    public int amount = 0;

    public GuestCheckoutRequest toGuest() {
      GuestCheckoutRequest g = new GuestCheckoutRequest();
      g.productId = productId;
      g.contact = "member@sebelas.id";
      g.customerName = customerName;
      g.paymentMethod = paymentMethod;
      g.amount = 0;
      return g;
    }
  }
}
