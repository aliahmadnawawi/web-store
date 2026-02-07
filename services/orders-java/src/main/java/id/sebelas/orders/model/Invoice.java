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

  private String orderType = "STOCK";

  // Base amount (product price) before any unique-code/top-up logic.
  private int baseAmount;

  private int amount;

  private String productId;

  private String productName;

  private String productType;

  // Stored as text so the invoice page can show checkout URL/instructions later.
  @Column(columnDefinition = "text")
  private String paymentRaw;

  private String paymentCheckoutUrl;

  private String ppobCode;

  private String ppobCustomerNumber;

  private String ppobPhone;

  private String ppobNoMeterPln;

  private String ppobOrderId;

  @Column(columnDefinition = "text")
  private String ppobRaw;

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
  public String getOrderType() { return orderType; }
  public void setOrderType(String orderType) { this.orderType = orderType; }
  public int getBaseAmount() { return baseAmount; }
  public void setBaseAmount(int baseAmount) { this.baseAmount = baseAmount; }
  public int getAmount() { return amount; }
  public void setAmount(int amount) { this.amount = amount; }
  public String getProductId() { return productId; }
  public void setProductId(String productId) { this.productId = productId; }
  public String getProductName() { return productName; }
  public void setProductName(String productName) { this.productName = productName; }
  public String getProductType() { return productType; }
  public void setProductType(String productType) { this.productType = productType; }
  public String getPaymentRaw() { return paymentRaw; }
  public void setPaymentRaw(String paymentRaw) { this.paymentRaw = paymentRaw; }
  public String getPaymentCheckoutUrl() { return paymentCheckoutUrl; }
  public void setPaymentCheckoutUrl(String paymentCheckoutUrl) { this.paymentCheckoutUrl = paymentCheckoutUrl; }
  public String getPpobCode() { return ppobCode; }
  public void setPpobCode(String ppobCode) { this.ppobCode = ppobCode; }
  public String getPpobCustomerNumber() { return ppobCustomerNumber; }
  public void setPpobCustomerNumber(String ppobCustomerNumber) { this.ppobCustomerNumber = ppobCustomerNumber; }
  public String getPpobPhone() { return ppobPhone; }
  public void setPpobPhone(String ppobPhone) { this.ppobPhone = ppobPhone; }
  public String getPpobNoMeterPln() { return ppobNoMeterPln; }
  public void setPpobNoMeterPln(String ppobNoMeterPln) { this.ppobNoMeterPln = ppobNoMeterPln; }
  public String getPpobOrderId() { return ppobOrderId; }
  public void setPpobOrderId(String ppobOrderId) { this.ppobOrderId = ppobOrderId; }
  public String getPpobRaw() { return ppobRaw; }
  public void setPpobRaw(String ppobRaw) { this.ppobRaw = ppobRaw; }
  public String getContact() { return contact; }
  public void setContact(String contact) { this.contact = contact; }
  public UUID getMemberId() { return memberId; }
  public void setMemberId(UUID memberId) { this.memberId = memberId; }
  public Instant getCreatedAt() { return createdAt; }
}
