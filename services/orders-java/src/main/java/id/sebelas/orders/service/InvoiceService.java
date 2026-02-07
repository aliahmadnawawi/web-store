package id.sebelas.orders.service;

import id.sebelas.orders.PaymentUtil;
import id.sebelas.orders.model.Invoice;
import id.sebelas.orders.model.Order;
import id.sebelas.orders.model.OrderItem;
import id.sebelas.orders.repo.InvoiceRepo;
import id.sebelas.orders.repo.OrderItemRepo;
import id.sebelas.orders.repo.OrderRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
public class InvoiceService {
  private final InvoiceRepo invoiceRepo;
  private final OrderRepo orderRepo;
  private final OrderItemRepo orderItemRepo;
  private final CatalogClient catalogClient;
  private final SecureRandom random = new SecureRandom();

  public InvoiceService(InvoiceRepo invoiceRepo, OrderRepo orderRepo, OrderItemRepo orderItemRepo, CatalogClient catalogClient) {
    this.invoiceRepo = invoiceRepo;
    this.orderRepo = orderRepo;
    this.orderItemRepo = orderItemRepo;
    this.catalogClient = catalogClient;
  }

  public Invoice createGuestInvoice(String productId, String contact) {
    CatalogClient.Product product = catalogClient.getProductById(productId);

    Invoice invoice = new Invoice();
    invoice.setInvoiceCode(newInvoiceCode());
    invoice.setToken(UUID.randomUUID().toString().replace("-", ""));
    invoice.setContact(contact);
    invoice.setProductId(product.id());
    invoice.setProductName(product.name());
    invoice.setProductType(Objects.requireNonNullElse(product.type(), "ACCOUNT"));
    invoice.setBaseAmount(product.price());
    invoice.setAmount(PaymentUtil.addUniqueCode(product.price()));
    invoiceRepo.save(invoice);

    Order order = new Order();
    order.setInvoiceId(invoice.getId());
    orderRepo.save(order);

    OrderItem item = new OrderItem();
    item.setOrderId(order.getId());
    item.setProductId(product.id());
    item.setProductName(product.name());
    item.setPrice(product.price());
    item.setQty(1);
    orderItemRepo.save(item);

    return invoice;
  }

  public Invoice createMemberInvoice(String productId, String memberId) {
    CatalogClient.Product product = catalogClient.getProductById(productId);

    Invoice invoice = new Invoice();
    invoice.setInvoiceCode(newInvoiceCode());
    invoice.setToken(UUID.randomUUID().toString().replace("-", ""));
    invoice.setProductId(product.id());
    invoice.setProductName(product.name());
    invoice.setProductType(Objects.requireNonNullElse(product.type(), "ACCOUNT"));
    invoice.setMemberId(parseUuidOrThrow(memberId));
    invoice.setBaseAmount(product.price());
    invoice.setAmount(PaymentUtil.addUniqueCode(product.price()));
    invoiceRepo.save(invoice);

    Order order = new Order();
    order.setInvoiceId(invoice.getId());
    orderRepo.save(order);

    OrderItem item = new OrderItem();
    item.setOrderId(order.getId());
    item.setProductId(product.id());
    item.setProductName(product.name());
    item.setPrice(product.price());
    item.setQty(1);
    orderItemRepo.save(item);

    return invoice;
  }

  public void recordPayment(Invoice invoice, String paymentRawJson, String checkoutUrl) {
    invoice.setPaymentRaw(paymentRawJson);
    invoice.setPaymentCheckoutUrl(checkoutUrl);
    invoiceRepo.save(invoice);
  }

  private UUID parseUuidOrThrow(String raw) {
    try {
      return UUID.fromString(raw);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid memberId");
    }
  }

  private String newInvoiceCode() {
    long ts = Instant.now().getEpochSecond();
    int suffix = 100000 + random.nextInt(900000);
    return "INV-" + ts + "-" + suffix;
  }
}
