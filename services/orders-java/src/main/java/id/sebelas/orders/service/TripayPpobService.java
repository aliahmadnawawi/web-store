package id.sebelas.orders.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class TripayPpobService {
  @Value("${TRIPAY_PPOB_API_KEY:}")
  private String apiKey;

  @Value("${TRIPAY_PPOB_PIN:}")
  private String pin;

  @Value("${TRIPAY_PPOB_BASE_URL:https://tripay.id/api}")
  private String baseUrl;

  private final RestTemplate rest = new RestTemplate();
  private final ObjectMapper mapper = new ObjectMapper();

  public PrepaidProduct getPrepaidProduct(String code) {
    Map<String, Object> resp = get("/v2/pembelian/produk/cek", Map.of("code", code));
    Map<String, Object> first = firstDataItem(resp);
    String productName = asString(first.get("product_name"));
    int price = asInt(first.get("price"));
    String status = asString(first.get("status"));
    if (productName == null || productName.isBlank()) {
      throw new IllegalArgumentException("invalid product");
    }
    if (status != null && !"1".equals(status) && !"active".equalsIgnoreCase(status)) {
      throw new IllegalArgumentException("product inactive");
    }
    return new PrepaidProduct(code, productName, price);
  }

  public Map<String, Object> purchasePrepaid(String inquiry, String code, String phone, String noMeterPln, String apiTrxId) {
    requireConfigured();
    if (pin == null || pin.isBlank()) {
      throw new IllegalStateException("ppob pin not configured");
    }

    MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("inquiry", (inquiry == null || inquiry.isBlank()) ? "I" : inquiry);
    form.add("code", code);
    form.add("phone", phone);
    if (noMeterPln != null && !noMeterPln.isBlank()) {
      form.add("no_meter_pln", noMeterPln);
    }
    if (apiTrxId != null && !apiTrxId.isBlank()) {
      form.add("api_trxid", apiTrxId);
    }
    form.add("pin", pin);

    return postForm("/v2/transaksi/pembelian", form);
  }

  public PostpaidBill checkBill(String product, String phone, String customerNumber, String apiTrxId) {
    requireConfigured();
    if (pin == null || pin.isBlank()) {
      throw new IllegalStateException("ppob pin not configured");
    }

    MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("product", product);
    form.add("phone", phone);
    form.add("no_pelanggan", customerNumber);
    if (apiTrxId != null && !apiTrxId.isBlank()) {
      form.add("api_trxid", apiTrxId);
    }
    form.add("pin", pin);

    Map<String, Object> resp = postForm("/v2/pembayaran/cek-tagihan", form);
    Object dataObj = resp.get("data");
    if (!(dataObj instanceof Map<?, ?> data)) {
      throw new IllegalArgumentException("invalid bill response");
    }
    String orderId = asString(data.get("id")); // per docs: ID pengecekan tagihan, used as order_id for payment
    String productName = asString(data.get("product_name"));
    int total = asInt(data.get("jumlah_bayar"));
    String customerName = asString(data.get("nama"));
    if (orderId == null || orderId.isBlank() || total <= 0) {
      throw new IllegalArgumentException("invalid bill");
    }
    return new PostpaidBill(orderId, productName == null ? product : productName, total, customerName);
  }

  public Map<String, Object> payBill(String orderId, String apiTrxId) {
    requireConfigured();
    if (pin == null || pin.isBlank()) {
      throw new IllegalStateException("ppob pin not configured");
    }
    MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("order_id", orderId);
    if (apiTrxId != null && !apiTrxId.isBlank()) {
      form.add("api_trxid", apiTrxId);
    }
    form.add("pin", pin);
    return postForm("/v2/transaksi/pembayaran", form);
  }

  private void requireConfigured() {
    if (apiKey == null || apiKey.isBlank()) {
      throw new IllegalStateException("ppob api key not configured");
    }
    if (baseUrl == null || baseUrl.isBlank()) {
      throw new IllegalStateException("ppob base url not configured");
    }
  }

  private Map<String, Object> get(String path, Map<String, String> query) {
    requireConfigured();
    String url = baseUrl.replaceAll("/+$", "") + path;
    if (query != null && !query.isEmpty()) {
      String q = query.entrySet().stream()
        .map(e -> e.getKey() + "=" + encode(e.getValue()))
        .reduce((a, b) -> a + "&" + b)
        .orElse("");
      url = url + "?" + q;
    }
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(apiKey);
    headers.setAccept(List.of(MediaType.APPLICATION_JSON));
    try {
      ResponseEntity<Map> resp = rest.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
      return resp.getBody() == null ? Map.of() : resp.getBody();
    } catch (RestClientException e) {
      throw new IllegalArgumentException("ppob unavailable");
    }
  }

  private Map<String, Object> postForm(String path, MultiValueMap<String, String> form) {
    String url = baseUrl.replaceAll("/+$", "") + path;
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(apiKey);
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
    headers.setAccept(List.of(MediaType.APPLICATION_JSON));
    try {
      ResponseEntity<Map> resp = rest.exchange(url, HttpMethod.POST, new HttpEntity<>(form, headers), Map.class);
      Map<String, Object> body = resp.getBody() == null ? Map.of() : resp.getBody();
      if (Boolean.FALSE.equals(body.get("success"))) {
        throw new IllegalArgumentException(asString(body.get("message")));
      }
      return body;
    } catch (RestClientException e) {
      throw new IllegalArgumentException("ppob unavailable");
    }
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> firstDataItem(Map<String, Object> resp) {
    if (resp == null) throw new IllegalArgumentException("invalid response");
    Object success = resp.get("success");
    if (Boolean.FALSE.equals(success)) {
      throw new IllegalArgumentException(asString(resp.get("message")));
    }
    Object dataObj = resp.get("data");
    if (dataObj instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> map) {
      return (Map<String, Object>) map;
    }
    if (dataObj instanceof Map<?, ?> map) {
      return (Map<String, Object>) map;
    }
    throw new IllegalArgumentException("product not found");
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

  private static String encode(String v) {
    try {
      return java.net.URLEncoder.encode(v == null ? "" : v, java.nio.charset.StandardCharsets.UTF_8);
    } catch (Exception e) {
      return "";
    }
  }

  public record PrepaidProduct(String code, String name, int price) {}

  public record PostpaidBill(String orderId, String productName, int amount, String customerName) {}

  public String safeJson(Object v) {
    try {
      return mapper.writeValueAsString(v);
    } catch (Exception e) {
      return "{}";
    }
  }
}

