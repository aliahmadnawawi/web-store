package id.sebelas.orders.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deliveries")
public class Delivery {
  @Id
  @Column(columnDefinition = "uuid")
  private UUID id = UUID.randomUUID();

  @Column(columnDefinition = "uuid")
  private UUID invoiceId;

  @Column(columnDefinition = "text")
  private String payload;

  private String channel;

  private Instant sentAt;

  public UUID getId() { return id; }
  public UUID getInvoiceId() { return invoiceId; }
  public void setInvoiceId(UUID invoiceId) { this.invoiceId = invoiceId; }
  public String getPayload() { return payload; }
  public void setPayload(String payload) { this.payload = payload; }
  public String getChannel() { return channel; }
  public void setChannel(String channel) { this.channel = channel; }
  public Instant getSentAt() { return sentAt; }
  public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
}
