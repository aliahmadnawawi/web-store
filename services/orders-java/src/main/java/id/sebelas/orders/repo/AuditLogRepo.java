package id.sebelas.orders.repo;

import id.sebelas.orders.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepo extends JpaRepository<AuditLog, UUID> {}
