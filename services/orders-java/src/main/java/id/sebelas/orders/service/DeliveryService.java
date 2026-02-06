package id.sebelas.orders.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class DeliveryService {
  @Value("${FONNTE_TOKEN:}")
  private String fonnteToken;

  @Value("${MAILERSEND_API_KEY:}")
  private String mailersendApiKey;

  @Value("${MAILERSEND_FROM:}")
  private String mailersendFrom;

  private final RestTemplate rest = new RestTemplate();

  public void sendWhatsApp(String number, String message) {
    if (fonnteToken == null || fonnteToken.isBlank()) return;
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", fonnteToken);
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
    body.add("target", number);
    body.add("message", message);

    rest.postForEntity("https://api.fonnte.com/send", new HttpEntity<>(body, headers), String.class);
  }

  public void sendEmail(String email, String message) {
    if (mailersendApiKey == null || mailersendApiKey.isBlank()) return;
    if (mailersendFrom == null || mailersendFrom.isBlank()) return;

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(mailersendApiKey);
    headers.setContentType(MediaType.APPLICATION_JSON);

    Map<String, Object> payload = Map.of(
      "from", Map.of("email", mailersendFrom, "name", "Sebelas Indonesia"),
      "to", new Object[]{Map.of("email", email)},
      "subject", "Sebelas Indonesia - Produk Digital",
      "text", message
    );

    rest.postForEntity("https://api.mailersend.com/v1/email", new HttpEntity<>(payload, headers), String.class);
  }
}
