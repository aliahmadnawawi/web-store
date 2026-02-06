package id.sebelas.orders.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class Order {
  @Id
  @Column(columnDefinition = "uuid")
  private UUID id = UUID.randomUUID();

  @Column(columnDefinition = "uuid")
  private UUID invoiceId;

  private String status = "PENDING";

  private Instant createdAt = Instant.now();

  public UUID getId() { return id; }
  public UUID getInvoiceId() { return invoiceId; }
  public void setInvoiceId(UUID invoiceId) { this.invoiceId = invoiceId; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Instant getCreatedAt() { return createdAt; }
}
