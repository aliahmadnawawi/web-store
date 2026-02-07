package id.sebelas.orders.repo;

import id.sebelas.orders.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepo extends JpaRepository<OrderItem, UUID> {
  List<OrderItem> findByOrderId(UUID orderId);
}

