package id.sebelas.orders.repo;

import id.sebelas.orders.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepo extends JpaRepository<Invoice, UUID> {
  Optional<Invoice> findByToken(String token);
  Optional<Invoice> findByInvoiceCode(String invoiceCode);
}
