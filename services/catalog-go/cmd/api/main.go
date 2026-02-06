package main

import (
  "context"
  "database/sql"
  "encoding/xml"
  "encoding/json"
  "net/http"
  "net/url"
  "os"
  "strings"
  "strconv"
  "time"

  "github.com/gin-contrib/cors"
  "github.com/gin-gonic/gin"
  "github.com/go-playground/validator/v10"
  "github.com/joho/godotenv"
  _ "github.com/go-sql-driver/mysql"
  "github.com/redis/go-redis/v9"
  "golang.org/x/time/rate"
)

type Product struct {
  ID    string `json:"id" validate:"required"`
  Name  string `json:"name" validate:"required"`
  Price int    `json:"price" validate:"min=0"`
  Slug  string `json:"slug"`
  Image string `json:"image"`
}

var validate = validator.New()

func main() {
  _ = godotenv.Load()

  r := gin.New()
  r.Use(gin.Logger(), gin.Recovery())
  r.Use(cors.New(cors.Config{
    AllowOrigins: []string{"*"},
    AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders: []string{"Authorization", "Content-Type"},
  }))

  r.Use(rateLimitMiddleware(10, 20))

  db := openMySQL()
  cache := redis.NewClient(&redis.Options{Addr: os.Getenv("REDIS_ADDR")})
  ppobBase := strings.TrimRight(getEnv("TRIPAY_PPOB_BASE_URL", "https://tripay.id/api-sandbox"), "/")
  ppobKey := os.Getenv("TRIPAY_PPOB_API_KEY")

  r.GET("/health", func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"status": "ok"})
  })

  r.GET("/ppob/prepaid/categories", func(c *gin.Context) {
    proxyTripay(c, ppobBase, ppobKey, "/v2/pembelian/category")
  })
  r.GET("/ppob/prepaid/operators", func(c *gin.Context) {
    proxyTripay(c, ppobBase, ppobKey, "/v2/pembelian/operator")
  })
  r.GET("/ppob/prepaid/products", func(c *gin.Context) {
    proxyTripay(c, ppobBase, ppobKey, "/v2/pembelian/produk")
  })
  r.GET("/ppob/prepaid/product-check", func(c *gin.Context) {
    proxyTripay(c, ppobBase, ppobKey, "/v2/pembelian/produk/cek")
  })
  r.GET("/ppob/postpaid/categories", func(c *gin.Context) {
    proxyTripay(c, ppobBase, ppobKey, "/v2/pembayaran/category")
  })
  r.GET("/ppob/postpaid/operators", func(c *gin.Context) {
    proxyTripay(c, ppobBase, ppobKey, "/v2/pembayaran/operator")
  })
  r.GET("/ppob/postpaid/products", func(c *gin.Context) {
    proxyTripay(c, ppobBase, ppobKey, "/v2/pembayaran/produk")
  })

  r.GET("/categories", func(c *gin.Context) {
    rows, err := db.Query("SELECT id, name, slug, icon FROM categories ORDER BY name")
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "db"})
      return
    }
    defer rows.Close()

    type Cat struct {
      ID int64 `json:"id"`
      Name string `json:"name"`
      Slug string `json:"slug"`
      Icon string `json:"icon"`
    }

    cats := []Cat{}
    for rows.Next() {
      var cat Cat
      _ = rows.Scan(&cat.ID, &cat.Name, &cat.Slug, &cat.Icon)
      cats = append(cats, cat)
    }
    c.JSON(http.StatusOK, gin.H{"data": cats})
  })

  r.GET("/products", func(c *gin.Context) {
    ctx := context.Background()
    cached, err := cache.Get(ctx, "products:list").Result()
    if err == nil {
      var items []Product
      _ = json.Unmarshal([]byte(cached), &items)
      c.JSON(http.StatusOK, gin.H{"data": items, "cached": true})
      return
    }

    rows, err := db.Query("SELECT id, name, price, slug, image_url FROM products WHERE status='ACTIVE' LIMIT 50")
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "db"})
      return
    }
    defer rows.Close()

    items := []Product{}
    for rows.Next() {
      var id int64
      var p Product
      _ = rows.Scan(&id, &p.Name, &p.Price, &p.Slug, &p.Image)
      p.ID = formatID(id)
      items = append(items, p)
    }

    raw, _ := json.Marshal(items)
    _ = cache.Set(ctx, "products:list", raw, 2*time.Minute).Err()

    c.JSON(http.StatusOK, gin.H{"data": items, "cached": false})
  })

  r.GET("/products/:slug", func(c *gin.Context) {
    slug := c.Param("slug")
    row := db.QueryRow("SELECT id, name, price, slug, image_url FROM products WHERE slug = ?", slug)
    var id int64
    var p Product
    if err := row.Scan(&id, &p.Name, &p.Price, &p.Slug, &p.Image); err != nil {
      c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
      return
    }
    p.ID = formatID(id)
    c.JSON(http.StatusOK, gin.H{"data": p})
  })

  r.POST("/products", func(c *gin.Context) {
    var payload Product
    if err := c.ShouldBindJSON(&payload); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }
    if err := validate.Struct(payload); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed"})
      return
    }
    c.JSON(http.StatusCreated, gin.H{"data": payload})
  })

  r.POST("/stock/import", func(c *gin.Context) {
    c.JSON(http.StatusAccepted, gin.H{"message": "CSV import queued"})
  })

  r.POST("/stock/allocate", func(c *gin.Context) {
    type Req struct {
      ProductID string `json:"productId" validate:"required"`
      InvoiceID string `json:"invoiceId" validate:"required"`
    }
    var req Req
    if err := c.ShouldBindJSON(&req); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }
    if err := validate.Struct(req); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed"})
      return
    }

    productID, err := strconv.ParseInt(req.ProductID, 10, 64)
    if err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid productId"})
      return
    }

    tx, err := db.Begin()
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "tx"})
      return
    }
    defer tx.Rollback()

    var stockID int64
    var payload string
    row := tx.QueryRow("SELECT id, payload FROM stocks WHERE product_id = ? AND status='AVAILABLE' LIMIT 1 FOR UPDATE", productID)
    if err := row.Scan(&stockID, &payload); err != nil {
      c.JSON(http.StatusConflict, gin.H{"error": "out of stock"})
      return
    }

    _, err = tx.Exec("UPDATE stocks SET status='SOLD', sold_at=NOW(), invoice_id=? WHERE id=?", req.InvoiceID, stockID)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
      return
    }

    if err := tx.Commit(); err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
      return
    }

    c.JSON(http.StatusOK, gin.H{"stockId": stockID, "payload": payload})
  })

  r.GET("/feed.xml", func(c *gin.Context) {
    rows, err := db.Query("SELECT id, name, description, slug, price, image_url FROM products WHERE status='ACTIVE' LIMIT 500")
    if err != nil {
      c.XML(http.StatusInternalServerError, gin.H{"error": "db"})
      return
    }
    defer rows.Close()

    type Item struct {
      ID string `xml:"g:id"`
      Title string `xml:"g:title"`
      Description string `xml:"g:description"`
      Link string `xml:"g:link"`
      Image string `xml:"g:image_link"`
      Availability string `xml:"g:availability"`
      Price string `xml:"g:price"`
      IdentifierExists string `xml:"g:identifier_exists"`
    }

    items := []Item{}
    for rows.Next() {
      var id int64
      var name, desc, slug, image string
      var price int
      _ = rows.Scan(&id, &name, &desc, &slug, &price, &image)
      items = append(items, Item{
        ID: formatID(id),
        Title: name,
        Description: desc,
        Link: "https://sebelasindonesia.app/product/" + slug,
        Image: image,
        Availability: "in stock",
        Price: strconv.Itoa(price) + " IDR",
        IdentifierExists: "false",
      })
    }

    type Channel struct {
      Title string `xml:"title"`
      Link string `xml:"link"`
      Description string `xml:"description"`
      Items []Item `xml:"item"`
    }

    type Feed struct {
      XMLName xml.Name `xml:"rss"`
      Version string `xml:"version,attr"`
      G string `xml:"xmlns:g,attr"`
      Channel Channel `xml:"channel"`
    }

    feed := Feed{
      Version: "2.0",
      G: "http://base.google.com/ns/1.0",
      Channel: Channel{
        Title: "Sebelas Indonesia Product Feed",
        Link: "https://sebelasindonesia.app",
        Description: "Automated product feed",
        Items: items,
      },
    }

    c.Header("Content-Type", "application/xml")
    c.Writer.WriteString(xml.Header)
    enc := xml.NewEncoder(c.Writer)
    enc.Indent("", "  ")
    _ = enc.Encode(feed)
  })

  port := os.Getenv("PORT")
  if port == "" {
    port = "8081"
  }

  _ = r.Run("0.0.0.0:" + port)
}

func openMySQL() *sql.DB {
  dsn := os.Getenv("MYSQL_DSN")
  if dsn == "" {
    dsn = "sebelas:sebelas@tcp(localhost:3306)/sebelas_catalog?parseTime=true"
  }
  db, _ := sql.Open("mysql", dsn)
  db.SetMaxOpenConns(10)
  db.SetMaxIdleConns(5)
  db.SetConnMaxLifetime(5 * time.Minute)
  return db
}

func formatID(id int64) string {
  return strconv.FormatInt(id, 10)
}

func rateLimitMiddleware(rps int, burst int) gin.HandlerFunc {
  limiter := rate.NewLimiter(rate.Limit(rps), burst)

  return func(c *gin.Context) {
    if !limiter.Allow() {
      c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit"})
      return
    }
    c.Next()
  }
}

func getEnv(key string, fallback string) string {
  val := os.Getenv(key)
  if val == "" {
    return fallback
  }
  return val
}

func proxyTripay(c *gin.Context, baseURL string, apiKey string, path string) {
  if apiKey == "" {
    c.JSON(http.StatusServiceUnavailable, gin.H{"error": "ppob api key missing"})
    return
  }

  query := c.Request.URL.Query()
  endpoint, _ := url.Parse(baseURL + path)
  endpoint.RawQuery = query.Encode()

  req, err := http.NewRequest(http.MethodGet, endpoint.String(), nil)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "request"})
    return
  }
  req.Header.Set("Authorization", "Bearer "+apiKey)
  req.Header.Set("Accept", "application/json")

  client := &http.Client{Timeout: 20 * time.Second}
  resp, err := client.Do(req)
  if err != nil {
    c.JSON(http.StatusBadGateway, gin.H{"error": "tripay"})
    return
  }
  defer resp.Body.Close()

  c.Status(resp.StatusCode)
  c.Header("Content-Type", "application/json")
  _, _ = c.Writer.ReadFrom(resp.Body)
}
