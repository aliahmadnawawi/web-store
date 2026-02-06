package id.sebelas.orders;

import id.sebelas.orders.model.Wishlist;
import id.sebelas.orders.repo.WishlistRepo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/wishlist")
public class WishlistController {
  private final WishlistRepo wishlistRepo;

  public WishlistController(WishlistRepo wishlistRepo) {
    this.wishlistRepo = wishlistRepo;
  }

  @GetMapping("/{userId}")
  public Map<String, Object> getWishlist(@PathVariable("userId") String userId) {
    try {
      return Map.of("items", wishlistRepo.findByUserId(UUID.fromString(userId)));
    } catch (IllegalArgumentException e) {
      return Map.of("error", "invalid userId");
    }
  }

  @PostMapping
  public Map<String, Object> add(@Valid @RequestBody WishlistRequest request) {
    try {
      Wishlist w = new Wishlist();
      w.setUserId(UUID.fromString(request.userId));
      w.setProductId(request.productId);
      wishlistRepo.save(w);
      return Map.of("status", "ok");
    } catch (IllegalArgumentException e) {
      return Map.of("error", "invalid userId");
    }
  }

  public static class WishlistRequest {
    @NotBlank
    public String userId;

    @NotBlank
    public String productId;
  }
}
