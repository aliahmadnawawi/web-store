package id.sebelas.orders.service;

import id.sebelas.orders.PaymentUtil;
import id.sebelas.orders.model.Invoice;
import id.sebelas.orders.model.Order;
import id.sebelas.orders.model.OrderItem;
import id.sebelas.orders.repo.InvoiceRepo;
import id.sebelas.orders.repo.OrderRepo;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class InvoiceService {
  private final InvoiceRepo invoiceRepo;
  private final OrderRepo orderRepo;

  public InvoiceService(InvoiceRepo invoiceRepo, OrderRepo orderRepo) {
    this.invoiceRepo = invoiceRepo;
    this.orderRepo = orderRepo;
  }

  public Invoice createGuestInvoice(String productId, String contact, int baseAmount) {
    Invoice invoice = new Invoice();
    invoice.setInvoiceCode("INV-" + Instant.now().getEpochSecond());
    invoice.setToken(UUID.randomUUID().toString().replace("-", ""));
    invoice.setContact(contact);
    invoice.setProductId(productId);
    invoice.setAmount(PaymentUtil.addUniqueCode(baseAmount));
    invoiceRepo.save(invoice);

    Order order = new Order();
    order.setInvoiceId(invoice.getId());
    orderRepo.save(order);

    return invoice;
  }

  public Invoice createMemberInvoice(String productId, String memberId, int baseAmount) {
    Invoice invoice = new Invoice();
    invoice.setInvoiceCode("INV-" + Instant.now().getEpochSecond());
    invoice.setToken(UUID.randomUUID().toString().replace("-", ""));
    invoice.setProductId(productId);
    invoice.setMemberId(UUID.fromString(memberId));
    invoice.setAmount(PaymentUtil.addUniqueCode(baseAmount));
    invoiceRepo.save(invoice);

    Order order = new Order();
    order.setInvoiceId(invoice.getId());
    orderRepo.save(order);

    return invoice;
  }
}
