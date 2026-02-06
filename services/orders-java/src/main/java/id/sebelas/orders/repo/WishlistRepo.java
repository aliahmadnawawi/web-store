package id.sebelas.orders.repo;

import id.sebelas.orders.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WishlistRepo extends JpaRepository<Wishlist, UUID> {
  List<Wishlist> findByUserId(UUID userId);
}
