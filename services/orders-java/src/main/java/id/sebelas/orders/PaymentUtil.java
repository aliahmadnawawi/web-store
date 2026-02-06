package id.sebelas.orders;

import java.security.SecureRandom;

public class PaymentUtil {
  private static final SecureRandom random = new SecureRandom();

  public static int addUniqueCode(int amount) {
    int unique = 100 + random.nextInt(900);
    return amount + unique;
  }
}
