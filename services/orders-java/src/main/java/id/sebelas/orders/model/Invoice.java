package id.sebelas.orders.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "invoices")
public class Invoice {
  @Id
  @Column(columnDefinition = "uuid")
  private UUID id = UUID.randomUUID();

  @Column(unique = true)
  private String invoiceCode;

  @Column(unique = true)
  private String token;

  private String status = "PENDING";

  private int amount;

  private String productId;

  private String contact;

  private UUID memberId;

  private Instant createdAt = Instant.now();

  public UUID getId() { return id; }
  public String getInvoiceCode() { return invoiceCode; }
  public void setInvoiceCode(String invoiceCode) { this.invoiceCode = invoiceCode; }
  public String getToken() { return token; }
  public void setToken(String token) { this.token = token; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public int getAmount() { return amount; }
  public void setAmount(int amount) { this.amount = amount; }
  public String getProductId() { return productId; }
  public void setProductId(String productId) { this.productId = productId; }
  public String getContact() { return contact; }
  public void setContact(String contact) { this.contact = contact; }
  public UUID getMemberId() { return memberId; }
  public void setMemberId(UUID memberId) { this.memberId = memberId; }
  public Instant getCreatedAt() { return createdAt; }
}
