package id.sebelas.orders;

import id.sebelas.orders.repo.InvoiceRepo;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
public class OrdersController {
  private final InvoiceRepo invoiceRepo;

  public OrdersController(InvoiceRepo invoiceRepo) {
    this.invoiceRepo = invoiceRepo;
  }

  @GetMapping("/member/{memberId}")
  public Map<String, Object> memberOrders(@PathVariable("memberId") String memberId) {
    try {
      UUID id = UUID.fromString(memberId);
      return Map.of("orders", invoiceRepo.findAll().stream().filter(inv -> id.equals(inv.getMemberId())).toList());
    } catch (IllegalArgumentException e) {
      return Map.of("error", "invalid memberId");
    }
  }
}
