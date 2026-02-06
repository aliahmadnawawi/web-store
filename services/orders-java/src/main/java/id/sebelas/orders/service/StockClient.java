package id.sebelas.orders.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class StockClient {
  @Value("${CATALOG_API:http://localhost:8081}")
  private String catalogApi;

  private final RestTemplate rest = new RestTemplate();

  public Map<String, Object> allocate(String productId, String invoiceId) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    Map<String, String> body = Map.of("productId", productId, "invoiceId", invoiceId);
    return rest.postForObject(catalogApi + "/stock/allocate", new HttpEntity<>(body, headers), Map.class);
  }
}
