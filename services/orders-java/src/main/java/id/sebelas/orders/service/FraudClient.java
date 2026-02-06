package id.sebelas.orders.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class FraudClient {
  @Value("${AI_API:http://localhost:8000}")
  private String aiApi;

  private final RestTemplate rest = new RestTemplate();

  public Double score(String invoiceId, int amount, String fingerprint, int attempts) {
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      Map<String, Object> payload = Map.of(
        "invoice_id", invoiceId,
        "amount", amount,
        "device_fingerprint", fingerprint,
        "attempts", attempts
      );
      Map resp = rest.postForObject(aiApi + "/fraud/score", new HttpEntity<>(payload, headers), Map.class);
      if (resp != null && resp.containsKey("risk_score")) {
        return Double.valueOf(resp.get("risk_score").toString());
      }
      return null;
    } catch (Exception e) {
      return null;
    }
  }
}
