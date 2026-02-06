package id.sebelas.orders.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
  @Id
  @Column(columnDefinition = "uuid")
  private UUID id = UUID.randomUUID();

  private String actor;
  private String role;
  private String action;
  private String entity;
  private String entityId;

  @Column(columnDefinition = "text")
  private String meta;

  private Instant createdAt = Instant.now();

  public UUID getId() { return id; }
  public String getActor() { return actor; }
  public void setActor(String actor) { this.actor = actor; }
  public String getRole() { return role; }
  public void setRole(String role) { this.role = role; }
  public String getAction() { return action; }
  public void setAction(String action) { this.action = action; }
  public String getEntity() { return entity; }
  public void setEntity(String entity) { this.entity = entity; }
  public String getEntityId() { return entityId; }
  public void setEntityId(String entityId) { this.entityId = entityId; }
  public String getMeta() { return meta; }
  public void setMeta(String meta) { this.meta = meta; }
  public Instant getCreatedAt() { return createdAt; }
}
