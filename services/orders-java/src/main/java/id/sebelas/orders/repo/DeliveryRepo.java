package id.sebelas.orders.repo;

import id.sebelas.orders.model.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DeliveryRepo extends JpaRepository<Delivery, UUID> {
  List<Delivery> findByInvoiceId(UUID invoiceId);
}
