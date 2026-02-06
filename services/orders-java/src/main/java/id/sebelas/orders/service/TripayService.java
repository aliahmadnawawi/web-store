package id.sebelas.orders.service;

import id.sebelas.orders.CheckoutController;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

@Service
public class TripayService {
  @Value("${TRIPAY_API_KEY:}")
  private String apiKey;

  @Value("${TRIPAY_MERCHANT_CODE:}")
  private String merchantCode;

  @Value("${TRIPAY_PRIVATE_KEY:}")
  private String privateKey;

  @Value("${TRIPAY_BASE_URL:https://www.tripay.co.id/api}")
  private String baseUrl;

  @Value("${TRIPAY_CALLBACK_URL:https://api.sebelasindonesia.app/webhook/tripay}")
  private String callbackUrl;

  @Value("${TRIPAY_RETURN_URL:https://sebelasindonesia.app/payment/return}")
  private String returnUrl;

  private final RestTemplate rest = new RestTemplate();

  public Map<String, Object> createPayment(String invoiceCode, int amount, CheckoutController.GuestCheckoutRequest request) {
    loadEnvFallback();
    String signature = sign(merchantCode + invoiceCode + amount, privateKey);

    MultiValueMap<String, String> payload = new LinkedMultiValueMap<>();
    payload.add("method", request.paymentMethod);
    payload.add("merchant_ref", invoiceCode);
    payload.add("amount", String.valueOf(amount));
    payload.add("customer_name", request.customerName);
    payload.add("customer_email", request.contact.contains("@") ? request.contact : "guest@sebelas.id");
    payload.add("customer_phone", request.contact.contains("@") ? "" : request.contact);
    payload.add("order_items[0][name]", "Digital Product");
    payload.add("order_items[0][price]", String.valueOf(amount));
    payload.add("order_items[0][quantity]", "1");
    payload.add("callback_url", callbackUrl);
    payload.add("return_url", returnUrl);
    payload.add("expired_time", String.valueOf(Instant.now().getEpochSecond() + 24 * 60 * 60));
    payload.add("signature", signature);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
    if (apiKey != null && !apiKey.isBlank()) {
      headers.setBearerAuth(apiKey);
    } else {
      headers.set("Authorization", "Bearer ");
    }

    return rest.postForObject(baseUrl + "/transaction/create", new HttpEntity<>(payload, headers), Map.class);
  }

  private void loadEnvFallback() {
    Dotenv dotenv = Dotenv.configure()
      .directory(System.getProperty("user.dir"))
      .ignoreIfMissing()
      .load();
    String envApiKey = dotenv.get("TRIPAY_API_KEY");
    String envPrivateKey = dotenv.get("TRIPAY_PRIVATE_KEY");
    String envMerchant = dotenv.get("TRIPAY_MERCHANT_CODE");
    String envBaseUrl = dotenv.get("TRIPAY_BASE_URL");
    String envCallback = dotenv.get("TRIPAY_CALLBACK_URL");
    String envReturn = dotenv.get("TRIPAY_RETURN_URL");

    if (envApiKey != null && !envApiKey.isBlank()) apiKey = envApiKey;
    if (envPrivateKey != null && !envPrivateKey.isBlank()) privateKey = envPrivateKey;
    if (envMerchant != null && !envMerchant.isBlank()) merchantCode = envMerchant;
    if (envBaseUrl != null && !envBaseUrl.isBlank()) baseUrl = envBaseUrl;
    if (envCallback != null && !envCallback.isBlank()) callbackUrl = envCallback;
    if (envReturn != null && !envReturn.isBlank()) returnUrl = envReturn;
  }

  private String sign(String data, String key) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (Exception e) {
      return "";
    }
  }
}
