package main

import (
  "context"
  "database/sql"
  "encoding/xml"
  "encoding/json"
  "net/http"
  "net/url"
  "os"
  "crypto/subtle"
  "golang.org/x/crypto/bcrypt"
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
    AllowHeaders: []string{"Authorization", "Content-Type", "X-Admin-Key", "X-Admin-User"},
  }))

  r.Use(rateLimitMiddleware(10, 20))

  db := openMySQL()
  cache := redis.NewClient(&redis.Options{Addr: os.Getenv("REDIS_ADDR")})
  ppobBase := strings.TrimRight(getEnv("TRIPAY_PPOB_BASE_URL", "https://tripay.id/api-sandbox"), "/")
  ppobKey := os.Getenv("TRIPAY_PPOB_API_KEY")
  adminKey := os.Getenv("ADMIN_API_KEY")
  adminRole := getEnv("ADMIN_ROLE", "editor")
  lowStockThreshold := getEnvInt("LOW_STOCK_THRESHOLD", 5)

  r.GET("/health", func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"status": "ok"})
  })

  r.POST("/admin/login", func(c *gin.Context) {
    var body struct {
      Username string `json:"username"`
      Password string `json:"password"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }
    var id int64
    var hash, role string
    err := db.QueryRow("SELECT id, password_hash, role FROM admin_users WHERE username = ? LIMIT 1", body.Username).Scan(&id, &hash, &role)
    if err == nil {
      if bcrypt.CompareHashAndPassword([]byte(hash), []byte(body.Password)) != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
        return
      }
      c.JSON(http.StatusOK, gin.H{"adminKey": adminKey, "role": role})
      return
    }

    expectedUser := os.Getenv("ADMIN_USERNAME")
    expectedPass := os.Getenv("ADMIN_PASSWORD")
    if expectedUser == "" || expectedPass == "" {
      c.JSON(http.StatusServiceUnavailable, gin.H{"error": "admin credentials not configured"})
      return
    }
    if body.Username != expectedUser || body.Password != expectedPass {
      c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
      return
    }
    c.JSON(http.StatusOK, gin.H{"adminKey": adminKey, "role": adminRole})
  })

  admin := r.Group("/admin")
  admin.Use(adminAuth(adminKey, adminRole))

  admin.GET("/metrics", func(c *gin.Context) {
    var totalProducts, totalCategories, totalStocks int64
    _ = db.QueryRow("SELECT COUNT(*) FROM products").Scan(&totalProducts)
    _ = db.QueryRow("SELECT COUNT(*) FROM categories").Scan(&totalCategories)
    _ = db.QueryRow("SELECT COUNT(*) FROM stocks WHERE status='AVAILABLE'").Scan(&totalStocks)

    rows, err := db.Query("SELECT product_id, COUNT(*) AS available FROM stocks WHERE status='AVAILABLE' GROUP BY product_id HAVING available < ?", lowStockThreshold)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "db"})
      return
    }
    defer rows.Close()
    lowStock := []gin.H{}
    for rows.Next() {
      var productID int64
      var count int64
      _ = rows.Scan(&productID, &count)
      lowStock = append(lowStock, gin.H{"productId": productID, "available": count})
    }

    c.JSON(http.StatusOK, gin.H{
      "totalProducts": totalProducts,
      "totalCategories": totalCategories,
      "totalStocksAvailable": totalStocks,
      "lowStockSku": lowStock,
    })
  })

  admin.GET("/categories", func(c *gin.Context) {
    q := strings.TrimSpace(c.Query("q"))
    limit := getQueryInt(c, "limit", 50)
    offset := getQueryInt(c, "offset", 0)
    sqlQuery := "SELECT id, name, slug, icon FROM categories"
    args := []interface{}{}
    if q != "" {
      sqlQuery += " WHERE name LIKE ? OR slug LIKE ?"
      like := "%" + q + "%"
      args = append(args, like, like)
    }
    sqlQuery += " ORDER BY id DESC LIMIT ? OFFSET ?"
    args = append(args, limit, offset)
    rows, err := db.Query(sqlQuery, args...)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "db"})
      return
    }
    defer rows.Close()
    items := []gin.H{}
    for rows.Next() {
      var id int64
      var name, slug, icon string
      _ = rows.Scan(&id, &name, &slug, &icon)
      items = append(items, gin.H{"id": id, "name": name, "slug": slug, "icon": icon})
    }
    c.JSON(http.StatusOK, gin.H{"data": items})
  })

  admin.POST("/categories", func(c *gin.Context) {
    var body struct {
      Name string `json:"name"`
      Slug string `json:"slug"`
      Icon string `json:"icon"`
    }
    if err := c.ShouldBindJSON(&body); err != nil || body.Name == "" || body.Slug == "" {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }
    res, err := db.Exec("INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)", body.Name, body.Slug, body.Icon)
    if err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "insert failed"})
      return
    }
    id, _ := res.LastInsertId()
    auditLog(db, adminActor(c), adminRole, "CREATE", "category", strconv.FormatInt(id, 10), "name="+body.Name)
    c.JSON(http.StatusCreated, gin.H{"id": id})
  })

  admin.PUT("/categories/:id", func(c *gin.Context) {
    var body struct {
      Name string `json:"name"`
      Slug string `json:"slug"`
      Icon string `json:"icon"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }
    id := c.Param("id")
    _, err := db.Exec("UPDATE categories SET name=?, slug=?, icon=? WHERE id=?", body.Name, body.Slug, body.Icon, id)
    if err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "update failed"})
      return
    }
    auditLog(db, adminActor(c), adminRole, "UPDATE", "category", id, "name="+body.Name)
    c.JSON(http.StatusOK, gin.H{"ok": true})
  })

  admin.DELETE("/categories/:id", func(c *gin.Context) {
    id := c.Param("id")
    _, err := db.Exec("DELETE FROM categories WHERE id=?", id)
    if err != nil {
      c.JSON(http.StatusConflict, gin.H{"error": "delete failed"})
      return
    }
    auditLog(db, adminActor(c), adminRole, "DELETE", "category", id, "")
    c.JSON(http.StatusOK, gin.H{"ok": true})
  })

  admin.GET("/products", func(c *gin.Context) {
    q := strings.TrimSpace(c.Query("q"))
    limit := getQueryInt(c, "limit", 50)
    offset := getQueryInt(c, "offset", 0)
    sqlQuery := "SELECT id, category_id, name, slug, description, price, status, type, image_url FROM products"
    args := []interface{}{}
    if q != "" {
      sqlQuery += " WHERE name LIKE ? OR slug LIKE ?"
      like := "%" + q + "%"
      args = append(args, like, like)
    }
    sqlQuery += " ORDER BY id DESC LIMIT ? OFFSET ?"
    args = append(args, limit, offset)
    rows, err := db.Query(sqlQuery, args...)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "db"})
      return
    }
    defer rows.Close()
    items := []gin.H{}
    for rows.Next() {
      var id, categoryID int64
      var name, slug, desc, status, ptype, image string
      var price int
      _ = rows.Scan(&id, &categoryID, &name, &slug, &desc, &price, &status, &ptype, &image)
      items = append(items, gin.H{
        "id": id,
        "categoryId": categoryID,
        "name": name,
        "slug": slug,
        "description": desc,
        "price": price,
        "status": status,
        "type": ptype,
        "image": image,
      })
    }
    c.JSON(http.StatusOK, gin.H{"data": items})
  })

  admin.POST("/products", func(c *gin.Context) {
    var body struct {
      CategoryID int64 `json:"categoryId"`
      Name string `json:"name"`
      Slug string `json:"slug"`
      Description string `json:"description"`
      Price int `json:"price"`
      Status string `json:"status"`
      Type string `json:"type"`
      Image string `json:"image"`
    }
    if err := c.ShouldBindJSON(&body); err != nil || body.CategoryID == 0 || body.Name == "" || body.Slug == "" {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }
    if body.Status == "" {
      body.Status = "ACTIVE"
    }
    if body.Type == "" {
      body.Type = "ACCOUNT"
    }
    res, err := db.Exec(
      "INSERT INTO products (category_id, name, slug, description, price, status, type, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      body.CategoryID, body.Name, body.Slug, body.Description, body.Price, body.Status, body.Type, body.Image,
    )
    if err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "insert failed"})
      return
    }
    id, _ := res.LastInsertId()
    auditLog(db, adminActor(c), adminRole, "CREATE", "product", strconv.FormatInt(id, 10), "name="+body.Name)
    c.JSON(http.StatusCreated, gin.H{"id": id})
  })

  admin.PUT("/products/:id", func(c *gin.Context) {
    var body struct {
      CategoryID int64 `json:"categoryId"`
      Name string `json:"name"`
      Slug string `json:"slug"`
      Description string `json:"description"`
      Price int `json:"price"`
      Status string `json:"status"`
      Type string `json:"type"`
      Image string `json:"image"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }
    id := c.Param("id")
    _, err := db.Exec(
      "UPDATE products SET category_id=?, name=?, slug=?, description=?, price=?, status=?, type=?, image_url=? WHERE id=?",
      body.CategoryID, body.Name, body.Slug, body.Description, body.Price, body.Status, body.Type, body.Image, id,
    )
    if err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "update failed"})
      return
    }
    auditLog(db, adminActor(c), adminRole, "UPDATE", "product", id, "name="+body.Name)
    c.JSON(http.StatusOK, gin.H{"ok": true})
  })

  admin.DELETE("/products/:id", func(c *gin.Context) {
    id := c.Param("id")
    _, err := db.Exec("DELETE FROM products WHERE id=?", id)
    if err != nil {
      c.JSON(http.StatusConflict, gin.H{"error": "delete failed"})
      return
    }
    auditLog(db, adminActor(c), adminRole, "DELETE", "product", id, "")
    c.JSON(http.StatusOK, gin.H{"ok": true})
  })

  admin.GET("/stocks", func(c *gin.Context) {
    productID := c.Query("productId")
    q := strings.TrimSpace(c.Query("q"))
    limit := getQueryInt(c, "limit", 50)
    offset := getQueryInt(c, "offset", 0)
    sqlQuery := "SELECT id, product_id, payload, status, invoice_id, sold_at FROM stocks"
    args := []interface{}{}
    where := []string{}
    if productID != "" {
      where = append(where, "product_id=?")
      args = append(args, productID)
    }
    if q != "" {
      where = append(where, "(payload LIKE ? OR invoice_id LIKE ?)")
      like := "%" + q + "%"
      args = append(args, like, like)
    }
    if len(where) > 0 {
      sqlQuery += " WHERE " + strings.Join(where, " AND ")
    }
    sqlQuery += " ORDER BY id DESC LIMIT ? OFFSET ?"
    args = append(args, limit, offset)
    rows, err := db.Query(sqlQuery, args...)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "db"})
      return
    }
    defer rows.Close()
    items := []gin.H{}
    for rows.Next() {
      var id, pid int64
      var payload, status, invoiceID string
      var soldAt sql.NullTime
      _ = rows.Scan(&id, &pid, &payload, &status, &invoiceID, &soldAt)
      item := gin.H{"id": id, "productId": pid, "payload": payload, "status": status, "invoiceId": invoiceID}
      if soldAt.Valid {
        item["soldAt"] = soldAt.Time
      }
      items = append(items, item)
    }
    c.JSON(http.StatusOK, gin.H{"data": items})
  })

  admin.POST("/stocks/import", func(c *gin.Context) {
    var body struct {
      ProductID int64 `json:"productId"`
      Payloads []string `json:"payloads"`
    }
    if err := c.ShouldBindJSON(&body); err != nil || body.ProductID == 0 || len(body.Payloads) == 0 {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }

    tx, err := db.Begin()
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "tx"})
      return
    }
    stmt, _ := tx.Prepare("INSERT INTO stocks (product_id, payload, status) VALUES (?, ?, 'AVAILABLE')")
    for _, payload := range body.Payloads {
      if strings.TrimSpace(payload) == "" {
        continue
      }
      _, _ = stmt.Exec(body.ProductID, strings.TrimSpace(payload))
    }
    _ = stmt.Close()
    if err := tx.Commit(); err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
      return
    }
    auditLog(db, adminActor(c), adminRole, "IMPORT", "stock", strconv.FormatInt(body.ProductID, 10), "count="+strconv.Itoa(len(body.Payloads)))
    c.JSON(http.StatusCreated, gin.H{"ok": true, "inserted": len(body.Payloads)})
  })

  admin.PUT("/stocks/:id", func(c *gin.Context) {
    var body struct {
      Status string `json:"status"`
      Payload string `json:"payload"`
      InvoiceID string `json:"invoiceId"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }
    id := c.Param("id")
    _, err := db.Exec("UPDATE stocks SET status=?, payload=?, invoice_id=? WHERE id=?", body.Status, body.Payload, body.InvoiceID, id)
    if err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "update failed"})
      return
    }
    auditLog(db, adminActor(c), adminRole, "UPDATE", "stock", id, "status="+body.Status)
    c.JSON(http.StatusOK, gin.H{"ok": true})
  })

  admin.GET("/audit-logs", func(c *gin.Context) {
    limit := getQueryInt(c, "limit", getEnvInt("AUDIT_LOG_LIMIT", 200))
    q := strings.TrimSpace(c.Query("q"))
    offset := getQueryInt(c, "offset", 0)
    sqlQuery := "SELECT id, actor, role, action, entity, entity_id, meta, created_at FROM audit_logs"
    args := []interface{}{}
    if q != "" {
      sqlQuery += " WHERE actor LIKE ? OR action LIKE ? OR entity LIKE ?"
      like := "%" + q + "%"
      args = append(args, like, like, like)
    }
    sqlQuery += " ORDER BY id DESC LIMIT ? OFFSET ?"
    args = append(args, limit, offset)
    rows, err := db.Query(sqlQuery, args...)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "db"})
      return
    }
    defer rows.Close()
    items := []gin.H{}
    for rows.Next() {
      var id int64
      var actor, role, action, entity, entityID, meta string
      var createdAt time.Time
      _ = rows.Scan(&id, &actor, &role, &action, &entity, &entityID, &meta, &createdAt)
      items = append(items, gin.H{
        "id": id,
        "actor": actor,
        "role": role,
        "action": action,
        "entity": entity,
        "entityId": entityID,
        "meta": meta,
        "createdAt": createdAt,
      })
    }
    c.JSON(http.StatusOK, gin.H{"data": items})
  })

  admin.GET("/users", func(c *gin.Context) {
    limit := getQueryInt(c, "limit", getEnvInt("AUDIT_LOG_LIMIT", 200))
    offset := getQueryInt(c, "offset", 0)
    q := strings.TrimSpace(c.Query("q"))
    sqlQuery := "SELECT id, username, role, created_at FROM admin_users"
    args := []interface{}{}
    if q != "" {
      sqlQuery += " WHERE username LIKE ?"
      like := "%" + q + "%"
      args = append(args, like)
    }
    sqlQuery += " ORDER BY id DESC LIMIT ? OFFSET ?"
    args = append(args, limit, offset)
    rows, err := db.Query(sqlQuery, args...)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "db"})
      return
    }
    defer rows.Close()
    items := []gin.H{}
    for rows.Next() {
      var id int64
      var username, role string
      var createdAt time.Time
      _ = rows.Scan(&id, &username, &role, &createdAt)
      items = append(items, gin.H{"id": id, "username": username, "role": role, "createdAt": createdAt})
    }
    c.JSON(http.StatusOK, gin.H{"data": items})
  })

  admin.POST("/users", func(c *gin.Context) {
    var body struct {
      Username string `json:"username"`
      Password string `json:"password"`
      Role string `json:"role"`
    }
    if err := c.ShouldBindJSON(&body); err != nil || body.Username == "" || body.Password == "" {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }
    if body.Role == "" {
      body.Role = "editor"
    }
    hash, _ := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
    res, err := db.Exec("INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)", body.Username, string(hash), body.Role)
    if err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "insert failed"})
      return
    }
    id, _ := res.LastInsertId()
    auditLog(db, adminActor(c), adminRole, "CREATE", "admin_user", strconv.FormatInt(id, 10), "username="+body.Username)
    c.JSON(http.StatusCreated, gin.H{"id": id})
  })

  admin.PUT("/users/:id", func(c *gin.Context) {
    var body struct {
      Password string `json:"password"`
      Role string `json:"role"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
      return
    }
    id := c.Param("id")
    if body.Password != "" {
      hash, _ := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
      _, _ = db.Exec("UPDATE admin_users SET password_hash=? WHERE id=?", string(hash), id)
    }
    if body.Role != "" {
      _, _ = db.Exec("UPDATE admin_users SET role=? WHERE id=?", body.Role, id)
    }
    auditLog(db, adminActor(c), adminRole, "UPDATE", "admin_user", id, "role="+body.Role)
    c.JSON(http.StatusOK, gin.H{"ok": true})
  })

  admin.DELETE("/users/:id", func(c *gin.Context) {
    id := c.Param("id")
    _, err := db.Exec("DELETE FROM admin_users WHERE id=?", id)
    if err != nil {
      c.JSON(http.StatusConflict, gin.H{"error": "delete failed"})
      return
    }
    auditLog(db, adminActor(c), adminRole, "DELETE", "admin_user", id, "")
    c.JSON(http.StatusOK, gin.H{"ok": true})
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

func getEnvInt(key string, fallback int) int {
  val := os.Getenv(key)
  if val == "" {
    return fallback
  }
  parsed, err := strconv.Atoi(val)
  if err != nil {
    return fallback
  }
  return parsed
}

func getQueryInt(c *gin.Context, key string, fallback int) int {
  raw := c.Query(key)
  if raw == "" {
    return fallback
  }
  parsed, err := strconv.Atoi(raw)
  if err != nil {
    return fallback
  }
  return parsed
}

func adminAuth(expected string, role string) gin.HandlerFunc {
  return func(c *gin.Context) {
    if expected == "" {
      c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "admin key not configured"})
      return
    }
    provided := c.GetHeader("X-Admin-Key")
    if subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) != 1 {
      c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
      return
    }
    if strings.ToLower(role) == "viewer" && c.Request.Method != http.MethodGet {
      c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "read-only"})
      return
    }
    c.Next()
  }
}

func adminActor(c *gin.Context) string {
  actor := c.GetHeader("X-Admin-User")
  if actor == "" {
    actor = getEnv("ADMIN_USERNAME", "admin")
  }
  return actor
}

func auditLog(db *sql.DB, actor string, role string, action string, entity string, entityID string, meta string) {
  if db == nil {
    return
  }
  _, _ = db.Exec(
    "INSERT INTO audit_logs (actor, role, action, entity, entity_id, meta) VALUES (?, ?, ?, ?, ?, ?)",
    actor, role, action, entity, entityID, meta,
  )
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
