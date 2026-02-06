package id.sebelas.orders.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "order_items")
public class OrderItem {
  @Id
  @Column(columnDefinition = "uuid")
  private UUID id = UUID.randomUUID();

  @Column(columnDefinition = "uuid")
  private UUID orderId;

  private String productId;
  private String productName;
  private int price;
  private int qty = 1;

  public UUID getId() { return id; }
  public UUID getOrderId() { return orderId; }
  public void setOrderId(UUID orderId) { this.orderId = orderId; }
  public String getProductId() { return productId; }
  public void setProductId(String productId) { this.productId = productId; }
  public String getProductName() { return productName; }
  public void setProductName(String productName) { this.productName = productName; }
  public int getPrice() { return price; }
  public void setPrice(int price) { this.price = price; }
  public int getQty() { return qty; }
  public void setQty(int qty) { this.qty = qty; }
}
