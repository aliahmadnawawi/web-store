package id.sebelas.orders.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class CatalogClient {
  @Value("${CATALOG_API:http://localhost:8081}")
  private String catalogApi;

  private final RestTemplate rest = new RestTemplate();

  public Product getProductById(String productId) {
    try {
      Map<String, Object> resp = rest.getForObject(catalogApi + "/products/id/" + productId, Map.class);
      if (resp == null || !resp.containsKey("data")) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found");
      }
      Object raw = resp.get("data");
      if (!(raw instanceof Map<?, ?> data)) {
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "invalid catalog response");
      }

      String id = asString(data.get("id"));
      String name = asString(data.get("name"));
      String description = asString(data.get("description"));
      int price = asInt(data.get("price"));
      String slug = asString(data.get("slug"));
      String type = asString(data.get("type"));
      Long categoryId = asLong(data.get("categoryId"));
      String image = asString(data.get("image"));

      if (id == null || id.isBlank() || name == null || name.isBlank() || price < 0) {
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "invalid product");
      }
      return new Product(id, name, description, price, slug, type, categoryId, image);
    } catch (RestClientException e) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "catalog unavailable");
    }
  }

  private static String asString(Object v) {
    return v == null ? null : String.valueOf(v);
  }

  private static int asInt(Object v) {
    if (v instanceof Number n) return n.intValue();
    try {
      return v == null ? 0 : Integer.parseInt(String.valueOf(v));
    } catch (NumberFormatException e) {
      return 0;
    }
  }

  private static Long asLong(Object v) {
    if (v instanceof Number n) return n.longValue();
    try {
      return v == null ? null : Long.parseLong(String.valueOf(v));
    } catch (NumberFormatException e) {
      return null;
    }
  }

  public record Product(
    String id,
    String name,
    String description,
    int price,
    String slug,
    String type,
    Long categoryId,
    String image
  ) {}
}
