package id.sebelas.orders;

import com.fasterxml.jackson.databind.ObjectMapper;
import id.sebelas.orders.model.Invoice;
import id.sebelas.orders.model.Order;
import id.sebelas.orders.model.OrderItem;
import id.sebelas.orders.repo.InvoiceRepo;
import id.sebelas.orders.repo.OrderItemRepo;
import id.sebelas.orders.repo.OrderRepo;
import id.sebelas.orders.service.FraudClient;
import id.sebelas.orders.service.TripayPpobService;
import id.sebelas.orders.service.TripayService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/checkout/ppob")
public class PpobCheckoutController {
  private final InvoiceRepo invoiceRepo;
  private final OrderRepo orderRepo;
  private final OrderItemRepo orderItemRepo;
  private final TripayService tripayService;
  private final TripayPpobService ppob;
  private final FraudClient fraudClient;

  private final SecureRandom random = new SecureRandom();
  private final ObjectMapper mapper = new ObjectMapper();

  public PpobCheckoutController(
    InvoiceRepo invoiceRepo,
    OrderRepo orderRepo,
    OrderItemRepo orderItemRepo,
    TripayService tripayService,
    TripayPpobService ppob,
    FraudClient fraudClient
  ) {
    this.invoiceRepo = invoiceRepo;
    this.orderRepo = orderRepo;
    this.orderItemRepo = orderItemRepo;
    this.tripayService = tripayService;
    this.ppob = ppob;
    this.fraudClient = fraudClient;
  }

  @PostMapping("/prepaid")
  public ResponseEntity<?> prepaid(@Valid @RequestBody PrepaidRequest request) {
    TripayPpobService.PrepaidProduct product;
    try {
      product = ppob.getPrepaidProduct(request.code);
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage() == null ? "invalid product" : e.getMessage());
    }

    String invoiceCode = newInvoiceCode();
    String token = UUID.randomUUID().toString().replace("-", "");

    String inquiry = (request.inquiry == null || request.inquiry.isBlank()) ? "I" : request.inquiry.toUpperCase();
    String customerNumber = request.customerNumber;
    String phone = resolvePhone(inquiry, customerNumber, request.phone);
    String noMeterPln = "PLN".equals(inquiry) ? customerNumber : "";

    Invoice invoice = new Invoice();
    invoice.setInvoiceCode(invoiceCode);
    invoice.setToken(token);
    invoice.setStatus("PENDING");
    invoice.setOrderType("PPOB_PREPAID");
    invoice.setBaseAmount(product.price());
    invoice.setAmount(PaymentUtil.addUniqueCode(product.price()));
    invoice.setProductName(product.name());
    invoice.setProductType("PPOB");
    invoice.setContact(phone);
    invoice.setPpobCode(product.code());
    invoice.setPpobCustomerNumber(customerNumber);
    invoice.setPpobPhone(phone);
    invoice.setPpobNoMeterPln(noMeterPln);
    invoiceRepo.save(invoice);

    Order order = new Order();
    order.setInvoiceId(invoice.getId());
    orderRepo.save(order);

    OrderItem item = new OrderItem();
    item.setOrderId(order.getId());
    item.setProductId(product.code());
    item.setProductName(product.name());
    item.setPrice(product.price());
    item.setQty(1);
    orderItemRepo.save(item);

    CheckoutController.GuestCheckoutRequest pg = new CheckoutController.GuestCheckoutRequest();
    pg.contact = phone;
    pg.customerName = request.customerName;
    pg.paymentMethod = request.paymentMethod;
    pg.deviceFingerprint = request.deviceFingerprint;
    pg.attempts = request.attempts;

    Map<String, Object> payment;
    try {
      payment = tripayService.createPayment(invoice.getInvoiceCode(), invoice.getAmount(), invoice.getProductName(), pg);
    } catch (Exception e) {
      return ResponseEntity.status(503).body(Map.of("error", e.getMessage() == null ? "tripay unavailable" : e.getMessage()));
    }
    if (payment == null) {
      payment = Map.of();
    }
    String checkoutUrl = extractCheckoutUrl(payment);
    invoice.setPaymentRaw(safeJson(payment));
    invoice.setPaymentCheckoutUrl(checkoutUrl);
    invoiceRepo.save(invoice);

    Double risk = fraudClient.score(invoice.getInvoiceCode(), invoice.getAmount(), request.deviceFingerprint, request.attempts);
    Map<String, Object> resp = new LinkedHashMap<>();
    resp.put("invoiceId", invoice.getInvoiceCode());
    resp.put("invoiceUrl", "https://sebelasindonesia.app/invoice/" + invoice.getToken());
    resp.put("baseAmount", invoice.getBaseAmount());
    resp.put("amount", invoice.getAmount());
    resp.put("checkoutUrl", checkoutUrl);
    resp.put("payment", payment);
    if (risk != null) {
      resp.put("fraudRisk", risk);
    }
    return ResponseEntity.ok(resp);
  }

  @PostMapping("/postpaid")
  public ResponseEntity<?> postpaid(@Valid @RequestBody PostpaidRequest request) {
    String invoiceCode = newInvoiceCode();
    String token = UUID.randomUUID().toString().replace("-", "");

    TripayPpobService.PostpaidBill bill;
    try {
      bill = ppob.checkBill(request.product, request.phone, request.customerNumber, invoiceCode);
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage() == null ? "invalid bill" : e.getMessage());
    }

    Invoice invoice = new Invoice();
    invoice.setInvoiceCode(invoiceCode);
    invoice.setToken(token);
    invoice.setStatus("PENDING");
    invoice.setOrderType("PPOB_POSTPAID");
    invoice.setBaseAmount(bill.amount());
    invoice.setAmount(PaymentUtil.addUniqueCode(bill.amount()));
    invoice.setProductName(bill.productName());
    invoice.setProductType("PPOB");
    invoice.setContact(request.phone);
    invoice.setPpobCode(request.product);
    invoice.setPpobCustomerNumber(request.customerNumber);
    invoice.setPpobPhone(request.phone);
    invoice.setPpobOrderId(bill.orderId());
    invoice.setPpobRaw(ppob.safeJson(bill));
    invoiceRepo.save(invoice);

    Order order = new Order();
    order.setInvoiceId(invoice.getId());
    orderRepo.save(order);

    OrderItem item = new OrderItem();
    item.setOrderId(order.getId());
    item.setProductId(request.product);
    item.setProductName(bill.productName());
    item.setPrice(bill.amount());
    item.setQty(1);
    orderItemRepo.save(item);

    CheckoutController.GuestCheckoutRequest pg = new CheckoutController.GuestCheckoutRequest();
    pg.contact = request.phone;
    pg.customerName = request.customerName;
    pg.paymentMethod = request.paymentMethod;
    pg.deviceFingerprint = request.deviceFingerprint;
    pg.attempts = request.attempts;

    Map<String, Object> payment;
    try {
      payment = tripayService.createPayment(invoice.getInvoiceCode(), invoice.getAmount(), invoice.getProductName(), pg);
    } catch (Exception e) {
      return ResponseEntity.status(503).body(Map.of("error", e.getMessage() == null ? "tripay unavailable" : e.getMessage()));
    }
    if (payment == null) {
      payment = Map.of();
    }
    String checkoutUrl = extractCheckoutUrl(payment);
    invoice.setPaymentRaw(safeJson(payment));
    invoice.setPaymentCheckoutUrl(checkoutUrl);
    invoiceRepo.save(invoice);

    Double risk = fraudClient.score(invoice.getInvoiceCode(), invoice.getAmount(), request.deviceFingerprint, request.attempts);
    Map<String, Object> billOut = new LinkedHashMap<>();
    billOut.put("customerName", bill.customerName());
    billOut.put("orderId", bill.orderId());

    Map<String, Object> resp = new LinkedHashMap<>();
    resp.put("invoiceId", invoice.getInvoiceCode());
    resp.put("invoiceUrl", "https://sebelasindonesia.app/invoice/" + invoice.getToken());
    resp.put("baseAmount", invoice.getBaseAmount());
    resp.put("amount", invoice.getAmount());
    resp.put("bill", billOut);
    resp.put("checkoutUrl", checkoutUrl);
    resp.put("payment", payment);
    if (risk != null) {
      resp.put("fraudRisk", risk);
    }
    return ResponseEntity.ok(resp);
  }

  private String resolvePhone(String inquiry, String customerNumber, String phone) {
    if ("PLN".equalsIgnoreCase(inquiry)) {
      if (phone == null || phone.isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "phone required for PLN");
      }
      return phone;
    }
    return customerNumber;
  }

  private String newInvoiceCode() {
    long ts = Instant.now().getEpochSecond();
    int suffix = 100000 + random.nextInt(900000);
    return "INV-" + ts + "-" + suffix;
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

  public static class PrepaidRequest {
    @NotBlank
    public String code;

    // "I" for general prepaid, "PLN" for PLN token.
    public String inquiry = "I";

    // Primary input: phone number OR customer ID (for PLN).
    @NotBlank
    public String customerNumber;

    // Required for PLN token (Tripay API requires phone).
    public String phone = "";

    public String customerName = "Guest";
    public String paymentMethod = "BRIVA";
    public String deviceFingerprint = "na";
    public int attempts = 1;
  }

  public static class PostpaidRequest {
    @NotBlank
    public String product;

    @NotBlank
    public String phone;

    @NotBlank
    public String customerNumber;

    public String customerName = "Guest";
    public String paymentMethod = "BRIVA";
    public String deviceFingerprint = "na";
    public int attempts = 1;
  }
}
