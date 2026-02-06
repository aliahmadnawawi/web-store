package id.sebelas.orders.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wishlists")
public class Wishlist {
  @Id
  @Column(columnDefinition = "uuid")
  private UUID id = UUID.randomUUID();

  @Column(columnDefinition = "uuid")
  private UUID userId;

  private String productId;

  private Instant createdAt = Instant.now();

  public UUID getId() { return id; }
  public UUID getUserId() { return userId; }
  public void setUserId(UUID userId) { this.userId = userId; }
  public String getProductId() { return productId; }
  public void setProductId(String productId) { this.productId = productId; }
  public Instant getCreatedAt() { return createdAt; }
}
