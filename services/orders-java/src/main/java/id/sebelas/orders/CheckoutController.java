package id.sebelas.orders;

import id.sebelas.orders.model.Invoice;
import id.sebelas.orders.service.InvoiceService;
import id.sebelas.orders.service.TripayService;
import id.sebelas.orders.service.FraudClient;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/checkout")
public class CheckoutController {
  private final InvoiceService invoiceService;
  private final TripayService tripayService;
  private final FraudClient fraudClient;

  public CheckoutController(InvoiceService invoiceService, TripayService tripayService, FraudClient fraudClient) {
    this.invoiceService = invoiceService;
    this.tripayService = tripayService;
    this.fraudClient = fraudClient;
  }

  @PostMapping("/guest")
  public ResponseEntity<?> guestCheckout(@Valid @RequestBody GuestCheckoutRequest request) {
    Invoice invoice = invoiceService.createGuestInvoice(request.productId, request.contact, request.amount);

    Map<String, Object> payment = tripayService.createPayment(invoice.getInvoiceCode(), invoice.getAmount(), request);
    Double risk = fraudClient.score(invoice.getInvoiceCode(), invoice.getAmount(), request.deviceFingerprint, request.attempts);
    return ResponseEntity.ok(Map.of(
      "invoiceId", invoice.getInvoiceCode(),
      "invoiceUrl", "https://sebelasindonesia.app/invoice/" + invoice.getToken(),
      "contact", invoice.getContact(),
      "amount", invoice.getAmount(),
      "payment", payment,
      "fraudRisk", risk
    ));
  }

  @PostMapping("/member")
  public ResponseEntity<?> memberCheckout(@Valid @RequestBody MemberCheckoutRequest request) {
    Invoice invoice = invoiceService.createMemberInvoice(request.productId, request.memberId, request.amount);
    Map<String, Object> payment = tripayService.createPayment(invoice.getInvoiceCode(), invoice.getAmount(), request.toGuest());
    Double risk = fraudClient.score(invoice.getInvoiceCode(), invoice.getAmount(), request.deviceFingerprint, request.attempts);
    return ResponseEntity.ok(Map.of(
      "invoiceId", invoice.getInvoiceCode(),
      "invoiceUrl", "https://sebelasindonesia.app/invoice/" + invoice.getToken(),
      "memberId", request.memberId,
      "amount", invoice.getAmount(),
      "payment", payment,
      "fraudRisk", risk
    ));
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

    public int amount = 39000;
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

    public int amount = 39000;

    public GuestCheckoutRequest toGuest() {
      GuestCheckoutRequest g = new GuestCheckoutRequest();
      g.productId = productId;
      g.contact = "member@sebelas.id";
      g.customerName = customerName;
      g.paymentMethod = paymentMethod;
      g.amount = amount;
      return g;
    }
  }
}
