package id.sebelas.orders.repo;

import id.sebelas.orders.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderRepo extends JpaRepository<Order, UUID> {
  List<Order> findByInvoiceId(UUID invoiceId);
}
