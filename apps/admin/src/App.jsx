import { useEffect, useMemo, useRef, useState } from "react";

const pageSize = 50;

const buildQuery = (base, params) => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${base}?${query}` : base;
};

export default function App() {
  const suggested = useMemo(() => {
    if (typeof window === "undefined") {
      return { api: "https://api.sebelasindonesia.app", orders: "https://orders.sebelasindonesia.app" };
    }
    const host = window.location.hostname || "";
    if (host.startsWith("admin.")) {
      const base = host.slice("admin.".length);
      return { api: `https://api.${base}`, orders: `https://orders.${base}` };
    }
    return { api: "https://api.sebelasindonesia.app", orders: "https://orders.sebelasindonesia.app" };
  }, []);

  const [apiUrl, setApiUrl] = useState(localStorage.getItem("adminApiUrl") || suggested.api);
  const [ordersApiUrl, setOrdersApiUrl] = useState(localStorage.getItem("ordersApiUrl") || suggested.orders);
  const [adminKey, setAdminKey] = useState(localStorage.getItem("adminKey") || "");
  const [adminRole, setAdminRole] = useState(localStorage.getItem("adminRole") || "editor");
  const [adminUser, setAdminUser] = useState(localStorage.getItem("adminUser") || "admin");
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem("adminLoggedIn") === "true");
  const [lockVisible, setLockVisible] = useState(localStorage.getItem("adminLoggedIn") !== "true");
  const [loginError, setLoginError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Belum login");

  const [loginApiUrl, setLoginApiUrl] = useState(apiUrl);
  const [loginOrdersApiUrl, setLoginOrdersApiUrl] = useState(ordersApiUrl);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [metrics, setMetrics] = useState({ totalProducts: 0, totalCategories: 0, totalStocksAvailable: 0, lowStockSku: [] });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);

  const [productMap, setProductMap] = useState({});
  const [stocksCache, setStocksCache] = useState([]);
  const [ordersCache, setOrdersCache] = useState([]);

  const [paging, setPaging] = useState({
    products: { page: 1, q: "" },
    categories: { page: 1, q: "" },
    stocks: { page: 1, q: "" },
    audit: { page: 1, q: "", source: "catalog" },
    users: { page: 1, q: "" }
  });

  const canEdit = useMemo(() => adminRole !== "viewer", [adminRole]);

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [editCategory, setEditCategory] = useState(null);

  const [productForm, setProductForm] = useState({
    categoryId: "",
    name: "",
    slug: "",
    price: "",
    status: "ACTIVE",
    type: "ACCOUNT",
    description: "",
    image: ""
  });
  const [editProduct, setEditProduct] = useState(null);

  const [stockProductId, setStockProductId] = useState("");
  const [stockPayloads, setStockPayloads] = useState("");
  const [editStock, setEditStock] = useState(null);
  const [stockFilterProductId, setStockFilterProductId] = useState("");

  const [ordersLimit, setOrdersLimit] = useState("100");
  const [deliveryDetail, setDeliveryDetail] = useState("{}");

  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("editor");

  const api = (path, options = {}) =>
    fetch(apiUrl + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": adminKey,
        "X-Admin-User": adminUser || "admin",
        ...(options.headers || {})
      }
    });

  const testConnection = async () => {
    try {
      const res = await api("/admin/metrics");
      if (!res.ok) throw new Error("not ok");
      setConnectionStatus("Connected");
      setLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
      setLockVisible(false);
      setLoginError("");
      await loadAll();
    } catch {
      setConnectionStatus("Failed");
      setLoggedIn(false);
      localStorage.setItem("adminLoggedIn", "false");
      setLockVisible(true);
      setLoginError("Koneksi gagal. Pastikan `ADMIN_API_KEY` benar.");
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem("adminApiUrl", apiUrl);
    localStorage.setItem("ordersApiUrl", ordersApiUrl);
    if (adminKey) localStorage.setItem("adminKey", adminKey);
    testConnection();
  };

  const handleLogin = async () => {
    if (!loginApiUrl || !loginUsername || !loginPassword) return;
    try {
      const res = await fetch(loginApiUrl + "/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const raw = await res.text();
      let data = {};
      try { data = JSON.parse(raw || "{}"); } catch { data = {}; }
      if (!res.ok) {
        throw new Error(data.error || data.message || "Login gagal");
      }
      setApiUrl(loginApiUrl);
      setOrdersApiUrl(loginOrdersApiUrl);
      setAdminKey(data.adminKey || "");
      setAdminRole(data.role || "editor");
      setAdminUser(loginUsername);
      localStorage.setItem("adminApiUrl", loginApiUrl);
      localStorage.setItem("ordersApiUrl", loginOrdersApiUrl);
      localStorage.setItem("adminKey", data.adminKey || "");
      localStorage.setItem("adminRole", data.role || "editor");
      localStorage.setItem("adminUser", loginUsername);
      setLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
      setLockVisible(false);
      setLoginError("");
      await testConnection();
    } catch (e) {
      setLoginError(e?.message || "Login gagal");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setLockVisible(true);
    setConnectionStatus("Logout");
    localStorage.setItem("adminLoggedIn", "false");
    window.location.reload();
  };

  const loadMetrics = async () => {
    const res = await api("/admin/metrics");
    if (!res.ok) return;
    const data = await res.json();
    setMetrics({
      totalProducts: data.totalProducts || 0,
      totalCategories: data.totalCategories || 0,
      totalStocksAvailable: data.totalStocksAvailable || 0,
      lowStockSku: data.lowStockSku || []
    });
  };

  const loadCategories = async () => {
    const { page, q } = paging.categories;
    const offset = (page - 1) * pageSize;
    const res = await api(buildQuery("/admin/categories", { limit: pageSize, offset, q }));
    if (!res.ok) return;
    const data = await res.json();
    setCategories(data.data || []);
  };

  const loadProducts = async () => {
    const { page, q } = paging.products;
    const offset = (page - 1) * pageSize;
    const res = await api(buildQuery("/admin/products", { limit: pageSize, offset, q }));
    if (!res.ok) return;
    const data = await res.json();
    const list = data.data || [];
    setProducts(list);
    const map = list.reduce((acc, p) => {
      acc[String(p.id)] = p.name;
      return acc;
    }, {});
    setProductMap(map);
  };

  const loadStocks = async () => {
    const { page, q } = paging.stocks;
    const offset = (page - 1) * pageSize;
    const path = buildQuery("/admin/stocks", {
      productId: stockFilterProductId || undefined,
      limit: pageSize,
      offset,
      q
    });
    const res = await api(path);
    if (!res.ok) return;
    const data = await res.json();
    const list = data.data || [];
    setStocks(list);
    setStocksCache(list);
  };

  const loadOrders = async () => {
    const limit = ordersLimit || "100";
    const res = await fetch(ordersApiUrl + "/admin/invoices?limit=" + limit, {
      headers: { "X-Admin-Key": adminKey, "X-Admin-User": adminUser || "admin" }
    });
    if (!res.ok) return;
    const data = await res.json();
    const list = data.data || [];
    setOrders(list);
    setOrdersCache(list);
  };

  const loadAuditLogs = async () => {
    const { page, q, source } = paging.audit;
    const offset = (page - 1) * pageSize;
    if (source === "orders") {
      const res = await fetch(buildQuery(ordersApiUrl + "/admin/audit-logs", { limit: pageSize, offset, q }), {
        headers: { "X-Admin-Key": adminKey, "X-Admin-User": adminUser || "admin" }
      });
      if (!res.ok) return;
      const data = await res.json();
      setAuditLogs(data.data || []);
      return;
    }
    const res = await api(buildQuery("/admin/audit-logs", { limit: pageSize, offset, q }));
    if (!res.ok) return;
    const data = await res.json();
    setAuditLogs(data.data || []);
  };

  const loadUsers = async () => {
    const { page, q } = paging.users;
    const offset = (page - 1) * pageSize;
    const res = await api(buildQuery("/admin/users", { limit: pageSize, offset, q }));
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.data || []);
  };

  const loadAll = async () => {
    await Promise.all([loadMetrics(), loadCategories(), loadProducts(), loadStocks(), loadOrders(), loadAuditLogs(), loadUsers()]);
  };

  useEffect(() => {
    if (adminKey && loggedIn) {
      testConnection();
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    loadProducts();
  }, [paging.products.page, paging.products.q]);

  useEffect(() => {
    if (!loggedIn) return;
    loadCategories();
  }, [paging.categories.page, paging.categories.q]);

  useEffect(() => {
    if (!loggedIn) return;
    loadStocks();
  }, [paging.stocks.page, paging.stocks.q, stockFilterProductId]);

  useEffect(() => {
    if (!loggedIn) return;
    loadAuditLogs();
  }, [paging.audit.page, paging.audit.q, paging.audit.source]);

  useEffect(() => {
    if (!loggedIn) return;
    loadUsers();
  }, [paging.users.page, paging.users.q]);

  const exportStocks = () => {
    const csv = [
      ["id", "productId", "status", "invoiceId", "payload"].join(","),
      ...stocksCache.map((s) => [s.id, s.productId, s.status, s.invoiceId || "", (s.payload || "").replace(/,/g, " ")].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stocks.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportOrders = () => {
    const csv = [
      ["invoiceCode", "status", "amount", "contact", "productId", "createdAt"].join(","),
      ...ordersCache.map((o) => [o.invoiceCode, o.status, o.amount, o.contact || "", o.productId || "", o.createdAt || ""].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={lockVisible ? "admin-locked" : ""}>
      <div id="lockOverlay" className={`d-flex align-items-center justify-content-center ${lockVisible ? "visible" : ""}`}>
        <div className="card w-100" style={{ maxWidth: 480 }}>
          <div className="card-body">
            <h3 className="card-title">Login Admin</h3>
            <p className="text-secondary">Masukkan API URL, username, dan password.</p>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Admin API URL</label>
                <input className="form-control" value={loginApiUrl} onChange={(e) => setLoginApiUrl(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label">Orders API URL</label>
                <input className="form-control" value={loginOrdersApiUrl} onChange={(e) => setLoginOrdersApiUrl(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label">Username</label>
                <input className="form-control" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
              <div className="col-12">
                <button className="btn btn-primary w-100" onClick={handleLogin}>Login</button>
              </div>
              <div className="col-12">
                <div className={`text-danger small ${loginError ? "" : "d-none"}`}>{loginError}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page">
        <header className="navbar navbar-expand-md navbar-light d-print-none">
          <div className="container-xl">
            <a className="navbar-brand">Sebelas Admin</a>
            <div className="navbar-nav flex-row order-md-last">
              <div className="nav-item dropdown">
                <a href="#" className="nav-link d-flex lh-1 text-reset p-0">
                  <span className="avatar avatar-sm">11</span>
                  <div className="d-none d-xl-block ps-2">
                    <div>{adminUser || "admin"}</div>
                    <div className="mt-1 small text-secondary">
                      <span className="badge bg-blue-lt">{adminRole}</span>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <h2 className="page-title">Dashboard</h2>
                  <div className="text-secondary">Kelola katalog, stok, dan PPOB</div>
                </div>
              </div>
            </div>

            <div className="row row-deck row-cards">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h3 className="card-title">Koneksi Admin API</h3>
                    <div className="row g-3 align-items-end">
                      <div className="col-12 col-md-4">
                        <label className="form-label">Admin API URL</label>
                        <input className="form-control" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label">Orders API URL</label>
                        <input className="form-control" value={ordersApiUrl} onChange={(e) => setOrdersApiUrl(e.target.value)} />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label">Admin Key</label>
                        <input type="password" className="form-control" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} />
                      </div>
                      <div className="col-12">
                        <button className="btn btn-primary w-100" onClick={handleSaveConfig}>Login</button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={`badge ${connectionStatus === "Connected" ? "bg-green" : "bg-secondary"}`}>{connectionStatus}</span>
                      <button className="btn btn-sm btn-outline-danger ms-2" onClick={handleLogout}>Logout</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-12">
                <ul className="nav nav-tabs" data-bs-toggle="tabs">
                  <li className="nav-item">
                    <a href="#tab-dashboard" className="nav-link active" data-bs-toggle="tab">Dashboard</a>
                  </li>
                  <li className="nav-item">
                    <a href="#tab-products" className="nav-link" data-bs-toggle="tab">Produk</a>
                  </li>
                  <li className="nav-item">
                    <a href="#tab-categories" className="nav-link" data-bs-toggle="tab">Kategori</a>
                  </li>
                  <li className="nav-item">
                    <a href="#tab-stocks" className="nav-link" data-bs-toggle="tab">Stok</a>
                  </li>
                  <li className="nav-item">
                    <a href="#tab-orders" className="nav-link" data-bs-toggle="tab">Orders</a>
                  </li>
                  <li className="nav-item">
                    <a href="#tab-audit" className="nav-link" data-bs-toggle="tab">Audit Log</a>
                  </li>
                  <li className="nav-item">
                    <a href="#tab-users" className="nav-link" data-bs-toggle="tab">Admin Users</a>
                  </li>
                </ul>
                <div className="tab-content">
                  <div id="tab-dashboard" className="card tab-pane active show">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <div className="card card-sm">
                            <div className="card-body">
                              <div className="text-secondary">Total Produk</div>
                              <div className="h2 mb-0">{metrics.totalProducts}</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="card card-sm">
                            <div className="card-body">
                              <div className="text-secondary">Total Kategori</div>
                              <div className="h2 mb-0">{metrics.totalCategories}</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="card card-sm">
                            <div className="card-body">
                              <div className="text-secondary">Stok Tersedia</div>
                              <div className="h2 mb-0">{metrics.totalStocksAvailable}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card mt-3">
                        <div className="card-header">
                          <h3 className="card-title">Low Stock</h3>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-vcenter card-table">
                            <thead>
                              <tr>
                                <th>Product ID</th>
                                <th>Available</th>
                              </tr>
                            </thead>
                            <tbody>
                              {metrics.lowStockSku.map((row) => (
                                <tr key={row.productId}>
                                  <td>{row.productId}</td>
                                  <td>{row.available}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id="tab-products" className="card tab-pane">
                    <div className="card-body">
                      <div className="d-flex gap-2 align-items-center mb-3">
                        <input className="form-control form-control-sm" placeholder="Search" value={paging.products.q} onChange={(e) => setPaging((p) => ({ ...p, products: { ...p.products, q: e.target.value, page: 1 } }))} />
                        <button className="btn btn-sm btn-outline-primary" onClick={() => { loadProducts(); }}>Refresh</button>
                      </div>

                      {canEdit && (
                        <div className="card mb-3">
                          <div className="card-header"><h3 className="card-title">Tambah Produk</h3></div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-12 col-md-2">
                                <input className="form-control" placeholder="Category ID" value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} />
                              </div>
                              <div className="col-12 col-md-4">
                                <input className="form-control" placeholder="Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                              </div>
                              <div className="col-12 col-md-3">
                                <input className="form-control" placeholder="Slug" value={productForm.slug} onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })} />
                              </div>
                              <div className="col-12 col-md-3">
                                <input className="form-control" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                              </div>
                              <div className="col-12 col-md-3">
                                <select className="form-select" value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}>
                                  <option>ACTIVE</option>
                                  <option>INACTIVE</option>
                                </select>
                              </div>
                              <div className="col-12 col-md-3">
                                <select className="form-select" value={productForm.type} onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}>
                                  <option>ACCOUNT</option>
                                  <option>FILE</option>
                                  <option>SERVICE</option>
                                  <option>PPOB</option>
                                </select>
                              </div>
                              <div className="col-12 col-md-6">
                                <input className="form-control" placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} />
                              </div>
                              <div className="col-12">
                                <textarea className="form-control" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                              </div>
                              <div className="col-12">
                                <button
                                  className="btn btn-primary"
                                  onClick={async () => {
                                    const payload = {
                                      categoryId: parseInt(productForm.categoryId || "0", 10),
                                      name: productForm.name,
                                      slug: productForm.slug,
                                      price: parseInt(productForm.price || "0", 10),
                                      status: productForm.status,
                                      type: productForm.type,
                                      description: productForm.description,
                                      image: productForm.image
                                    };
                                    if (!payload.categoryId || !payload.name || !payload.slug) return;
                                    await api("/admin/products", { method: "POST", body: JSON.stringify(payload) });
                                    setProductForm({ categoryId: "", name: "", slug: "", price: "", status: "ACTIVE", type: "ACCOUNT", description: "", image: "" });
                                    loadProducts();
                                  }}
                                >Tambah</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {editProduct && canEdit && (
                        <div className="card mb-3">
                          <div className="card-header"><h3 className="card-title">Edit Produk</h3></div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-12 col-md-2">
                                <input className="form-control" value={editProduct.categoryId || ""} onChange={(e) => setEditProduct({ ...editProduct, categoryId: e.target.value })} />
                              </div>
                              <div className="col-12 col-md-4">
                                <input className="form-control" value={editProduct.name || ""} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} />
                              </div>
                              <div className="col-12 col-md-3">
                                <input className="form-control" value={editProduct.slug || ""} onChange={(e) => setEditProduct({ ...editProduct, slug: e.target.value })} />
                              </div>
                              <div className="col-12 col-md-3">
                                <input className="form-control" value={editProduct.price || 0} onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })} />
                              </div>
                              <div className="col-12 col-md-3">
                                <select className="form-select" value={editProduct.status || "ACTIVE"} onChange={(e) => setEditProduct({ ...editProduct, status: e.target.value })}>
                                  <option>ACTIVE</option>
                                  <option>INACTIVE</option>
                                </select>
                              </div>
                              <div className="col-12 col-md-3">
                                <select className="form-select" value={editProduct.type || "ACCOUNT"} onChange={(e) => setEditProduct({ ...editProduct, type: e.target.value })}>
                                  <option>ACCOUNT</option>
                                  <option>FILE</option>
                                  <option>SERVICE</option>
                                  <option>PPOB</option>
                                </select>
                              </div>
                              <div className="col-12 col-md-6">
                                <input className="form-control" value={editProduct.image || ""} onChange={(e) => setEditProduct({ ...editProduct, image: e.target.value })} />
                              </div>
                              <div className="col-12">
                                <textarea className="form-control" value={editProduct.description || ""} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} />
                              </div>
                              <div className="col-12">
                                <button
                                  className="btn btn-primary me-2"
                                  onClick={async () => {
                                    const payload = {
                                      categoryId: parseInt(editProduct.categoryId || "0", 10),
                                      name: editProduct.name,
                                      slug: editProduct.slug,
                                      price: parseInt(editProduct.price || "0", 10),
                                      status: editProduct.status || "ACTIVE",
                                      type: editProduct.type || "ACCOUNT",
                                      description: editProduct.description || "",
                                      image: editProduct.image || ""
                                    };
                                    await api("/admin/products/" + editProduct.id, { method: "PUT", body: JSON.stringify(payload) });
                                    setEditProduct(null);
                                    loadProducts();
                                  }}
                                >Simpan</button>
                                <button className="btn btn-outline-secondary" onClick={() => setEditProduct(null)}>Batal</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="table-responsive">
                        <table className="table table-vcenter card-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Nama</th>
                              <th>Slug</th>
                              <th>Harga</th>
                              <th>Status</th>
                              <th className="text-end">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((p) => (
                              <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{p.name}</td>
                                <td>{p.slug}</td>
                                <td>Rp {p.price}</td>
                                <td>{p.status}</td>
                                <td className="text-end">
                                  {canEdit ? (
                                    <>
                                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setEditProduct(p)}>Edit</button>
                                      <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (!confirm("Hapus produk ini?")) return; await api("/admin/products/" + p.id, { method: "DELETE" }); loadProducts(); }}>Hapus</button>
                                    </>
                                  ) : (
                                    <span className="text-muted">Viewer</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="d-flex align-items-center gap-2 mt-3">
                        <button className="btn btn-sm btn-outline-primary" disabled={paging.products.page <= 1} onClick={() => { setPaging((p) => ({ ...p, products: { ...p.products, page: p.products.page - 1 } })); loadProducts(); }}>Prev</button>
                        <span className="text-muted small">{paging.products.page}</span>
                        <button className="btn btn-sm btn-outline-primary" disabled={products.length < pageSize} onClick={() => { setPaging((p) => ({ ...p, products: { ...p.products, page: p.products.page + 1 } })); loadProducts(); }}>Next</button>
                      </div>
                    </div>
                  </div>

                  <div id="tab-categories" className="card tab-pane">
                    <div className="card-body">
                      <div className="d-flex gap-2 align-items-center mb-3">
                        <input className="form-control form-control-sm" placeholder="Search" value={paging.categories.q} onChange={(e) => setPaging((p) => ({ ...p, categories: { ...p.categories, q: e.target.value, page: 1 } }))} />
                        <button className="btn btn-sm btn-outline-primary" onClick={() => loadCategories()}>Refresh</button>
                      </div>

                      {canEdit && (
                        <div className="card mb-3">
                          <div className="card-header"><h3 className="card-title">Tambah Kategori</h3></div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-12 col-md-4">
                                <input className="form-control" placeholder="Name" value={catName} onChange={(e) => setCatName(e.target.value)} />
                              </div>
                              <div className="col-12 col-md-4">
                                <input className="form-control" placeholder="Slug" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
                              </div>
                              <div className="col-12 col-md-4">
                                <input className="form-control" placeholder="Icon" value={catIcon} onChange={(e) => setCatIcon(e.target.value)} />
                              </div>
                              <div className="col-12">
                                <button className="btn btn-primary" onClick={async () => { if (!catName || !catSlug) return; await api("/admin/categories", { method: "POST", body: JSON.stringify({ name: catName, slug: catSlug, icon: catIcon }) }); setCatName(""); setCatSlug(""); setCatIcon(""); loadCategories(); }}>Tambah</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {editCategory && canEdit && (
                        <div className="card mb-3">
                          <div className="card-header"><h3 className="card-title">Edit Kategori</h3></div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-12 col-md-4">
                                <input className="form-control" value={editCategory.name} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} />
                              </div>
                              <div className="col-12 col-md-4">
                                <input className="form-control" value={editCategory.slug} onChange={(e) => setEditCategory({ ...editCategory, slug: e.target.value })} />
                              </div>
                              <div className="col-12 col-md-4">
                                <input className="form-control" value={editCategory.icon || ""} onChange={(e) => setEditCategory({ ...editCategory, icon: e.target.value })} />
                              </div>
                              <div className="col-12">
                                <button className="btn btn-primary me-2" onClick={async () => { await api("/admin/categories/" + editCategory.id, { method: "PUT", body: JSON.stringify({ name: editCategory.name, slug: editCategory.slug, icon: editCategory.icon }) }); setEditCategory(null); loadCategories(); }}>Simpan</button>
                                <button className="btn btn-outline-secondary" onClick={() => setEditCategory(null)}>Batal</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="table-responsive">
                        <table className="table table-vcenter card-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Nama</th>
                              <th>Slug</th>
                              <th>Icon</th>
                              <th className="text-end">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categories.map((cat) => (
                              <tr key={cat.id}>
                                <td>{cat.id}</td>
                                <td>{cat.name}</td>
                                <td>{cat.slug}</td>
                                <td>{cat.icon || "-"}</td>
                                <td className="text-end">
                                  {canEdit ? (
                                    <>
                                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setEditCategory(cat)}>Edit</button>
                                      <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (!confirm("Hapus kategori ini?")) return; await api("/admin/categories/" + cat.id, { method: "DELETE" }); loadCategories(); }}>Hapus</button>
                                    </>
                                  ) : (
                                    <span className="text-muted">Viewer</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="d-flex align-items-center gap-2 mt-3">
                        <button className="btn btn-sm btn-outline-primary" disabled={paging.categories.page <= 1} onClick={() => { setPaging((p) => ({ ...p, categories: { ...p.categories, page: p.categories.page - 1 } })); loadCategories(); }}>Prev</button>
                        <span className="text-muted small">{paging.categories.page}</span>
                        <button className="btn btn-sm btn-outline-primary" disabled={categories.length < pageSize} onClick={() => { setPaging((p) => ({ ...p, categories: { ...p.categories, page: p.categories.page + 1 } })); loadCategories(); }}>Next</button>
                      </div>
                    </div>
                  </div>

                  <div id="tab-stocks" className="card tab-pane">
                    <div className="card-body">
                      <div className="row g-3 align-items-end mb-3">
                        <div className="col-12 col-md-3">
                          <label className="form-label">Filter Product ID</label>
                          <input className="form-control" value={stockFilterProductId} onChange={(e) => setStockFilterProductId(e.target.value)} />
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label">Search</label>
                          <input className="form-control" value={paging.stocks.q} onChange={(e) => setPaging((p) => ({ ...p, stocks: { ...p.stocks, q: e.target.value, page: 1 } }))} />
                        </div>
                        <div className="col-12 col-md-2">
                          <button className="btn btn-outline-primary w-100" onClick={() => loadStocks()}>Refresh</button>
                        </div>
                        <div className="col-12 col-md-2">
                          <button className="btn btn-outline-secondary w-100" onClick={exportStocks}>Export CSV</button>
                        </div>
                      </div>

                      {canEdit && (
                        <div className="card mb-3">
                          <div className="card-header"><h3 className="card-title">Import Stok</h3></div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-12 col-md-3">
                                <input className="form-control" placeholder="Product ID" value={stockProductId} onChange={(e) => setStockProductId(e.target.value)} />
                              </div>
                              <div className="col-12">
                                <textarea className="form-control" rows="4" placeholder="payload per line" value={stockPayloads} onChange={(e) => setStockPayloads(e.target.value)} />
                              </div>
                              <div className="col-12">
                                <button className="btn btn-primary" onClick={async () => { const productId = parseInt(stockProductId || "0", 10); const payloads = stockPayloads.split("\n").map((l) => l.trim()).filter(Boolean); if (!productId || payloads.length === 0) return; await api("/admin/stocks/import", { method: "POST", body: JSON.stringify({ productId, payloads }) }); setStockPayloads(""); loadStocks(); loadMetrics(); }}>Import</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {editStock && canEdit && (
                        <div className="card mb-3">
                          <div className="card-header"><h3 className="card-title">Edit Stok</h3></div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-12 col-md-3">
                                <input className="form-control" value={editStock.id} readOnly />
                              </div>
                              <div className="col-12 col-md-3">
                                <select className="form-select" value={editStock.status} onChange={(e) => setEditStock({ ...editStock, status: e.target.value })}>
                                  <option>AVAILABLE</option>
                                  <option>SOLD</option>
                                </select>
                              </div>
                              <div className="col-12 col-md-6">
                                <input className="form-control" placeholder="Invoice ID" value={editStock.invoiceId || ""} onChange={(e) => setEditStock({ ...editStock, invoiceId: e.target.value })} />
                              </div>
                              <div className="col-12">
                                <textarea className="form-control" value={editStock.payload || ""} onChange={(e) => setEditStock({ ...editStock, payload: e.target.value })} />
                              </div>
                              <div className="col-12">
                                <button className="btn btn-primary me-2" onClick={async () => { await api("/admin/stocks/" + editStock.id, { method: "PUT", body: JSON.stringify({ status: editStock.status, invoiceId: editStock.invoiceId, payload: editStock.payload }) }); setEditStock(null); loadStocks(); }}>Simpan</button>
                                <button className="btn btn-outline-secondary" onClick={() => setEditStock(null)}>Batal</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="table-responsive">
                        <table className="table table-vcenter card-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Product ID</th>
                              <th>Status</th>
                              <th>Invoice ID</th>
                              <th>Payload</th>
                              <th className="text-end">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stocks.map((s) => (
                              <tr key={s.id}>
                                <td>{s.id}</td>
                                <td>{s.productId}</td>
                                <td>{s.status}</td>
                                <td>{s.invoiceId || "-"}</td>
                                <td className="text-truncate" style={{ maxWidth: 240 }}>{s.payload}</td>
                                <td className="text-end">
                                  {canEdit ? (
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => setEditStock(s)}>Edit</button>
                                  ) : (
                                    <span className="text-muted">Viewer</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="d-flex align-items-center gap-2 mt-3">
                        <button className="btn btn-sm btn-outline-primary" disabled={paging.stocks.page <= 1} onClick={() => { setPaging((p) => ({ ...p, stocks: { ...p.stocks, page: p.stocks.page - 1 } })); loadStocks(); }}>Prev</button>
                        <span className="text-muted small">{paging.stocks.page}</span>
                        <button className="btn btn-sm btn-outline-primary" disabled={stocks.length < pageSize} onClick={() => { setPaging((p) => ({ ...p, stocks: { ...p.stocks, page: p.stocks.page + 1 } })); loadStocks(); }}>Next</button>
                      </div>
                    </div>
                  </div>

                  <div id="tab-orders" className="card tab-pane">
                    <div className="card-body">
                      <div className="d-flex gap-2 align-items-center mb-3">
                        <input className="form-control form-control-sm" value={ordersLimit} onChange={(e) => setOrdersLimit(e.target.value)} />
                        <button className="btn btn-sm btn-outline-primary" onClick={loadOrders}>Refresh</button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={exportOrders}>Export CSV</button>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-vcenter card-table">
                          <thead>
                            <tr>
                              <th>Invoice</th>
                              <th>Status</th>
                              <th>Amount</th>
                              <th>Contact</th>
                              <th>Product</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((o) => (
                              <tr key={o.invoiceCode}>
                                <td>
                                  <a
                                    href="#"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      const res = await fetch(ordersApiUrl + "/admin/deliveries/" + o.invoiceCode, {
                                        headers: { "X-Admin-Key": adminKey, "X-Admin-User": adminUser || "admin" }
                                      });
                                      const data = await res.json();
                                      setDeliveryDetail(JSON.stringify(data, null, 2));
                                    }}
                                  >
                                    {o.invoiceCode}
                                  </a>
                                </td>
                                <td><span className={`badge ${o.status === "PAID" ? "bg-green" : "bg-yellow"}`}>{o.status}</span></td>
                                <td>Rp {o.amount}</td>
                                <td>{o.contact || "-"}</td>
                                <td>{productMap[String(o.productId)] || "-"} <span className="text-muted">#{o.productId || "-"}</span></td>
                                <td>{o.createdAt || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="card mt-3">
                        <div className="card-header"><h3 className="card-title">Delivery Detail</h3></div>
                        <div className="card-body">
                          <pre className="pre-wrap">{deliveryDetail}</pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id="tab-audit" className="card tab-pane">
                    <div className="card-body">
                      <div className="d-flex gap-2 align-items-center mb-3">
                        <select className="form-select form-select-sm" value={paging.audit.source} onChange={(e) => setPaging((p) => ({ ...p, audit: { ...p.audit, source: e.target.value, page: 1 } }))}>
                          <option value="catalog">Catalog</option>
                          <option value="orders">Orders</option>
                        </select>
                        <input className="form-control form-control-sm" placeholder="Search" value={paging.audit.q} onChange={(e) => setPaging((p) => ({ ...p, audit: { ...p.audit, q: e.target.value, page: 1 } }))} />
                        <button className="btn btn-sm btn-outline-primary" onClick={loadAuditLogs}>Refresh</button>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-vcenter card-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Actor</th>
                              <th>Role</th>
                              <th>Action</th>
                              <th>Entity</th>
                              <th>Entity ID</th>
                              <th>Meta</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLogs.map((a) => (
                              <tr key={a.id}>
                                <td>{a.id}</td>
                                <td>{a.actor}</td>
                                <td>{a.role}</td>
                                <td>{a.action}</td>
                                <td>{a.entity}</td>
                                <td>{a.entityId || "-"}</td>
                                <td className="text-truncate" style={{ maxWidth: 220 }}>{a.meta || "-"}</td>
                                <td>{a.createdAt || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="d-flex align-items-center gap-2 mt-3">
                        <button className="btn btn-sm btn-outline-primary" disabled={paging.audit.page <= 1} onClick={() => { setPaging((p) => ({ ...p, audit: { ...p.audit, page: p.audit.page - 1 } })); loadAuditLogs(); }}>Prev</button>
                        <span className="text-muted small">{paging.audit.page}</span>
                        <button className="btn btn-sm btn-outline-primary" disabled={auditLogs.length < pageSize} onClick={() => { setPaging((p) => ({ ...p, audit: { ...p.audit, page: p.audit.page + 1 } })); loadAuditLogs(); }}>Next</button>
                      </div>
                    </div>
                  </div>

                  <div id="tab-users" className="card tab-pane">
                    <div className="card-body">
                      {canEdit && (
                        <div className="card mb-3">
                          <div className="card-header"><h3 className="card-title">Tambah Admin User</h3></div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-12 col-md-4">
                                <input className="form-control" placeholder="Username" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                              </div>
                              <div className="col-12 col-md-4">
                                <input type="password" className="form-control" placeholder="Password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
                              </div>
                              <div className="col-12 col-md-2">
                                <select className="form-select" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                                  <option value="editor">editor</option>
                                  <option value="viewer">viewer</option>
                                </select>
                              </div>
                              <div className="col-12 col-md-2">
                                <button className="btn btn-primary w-100" onClick={async () => { if (!newUserName || !newUserPassword) return; await api("/admin/users", { method: "POST", body: JSON.stringify({ username: newUserName, password: newUserPassword, role: newUserRole }) }); setNewUserName(""); setNewUserPassword(""); setNewUserRole("editor"); loadUsers(); }}>Tambah</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="card">
                        <div className="card-header">
                          <h3 className="card-title">Daftar Admin Users</h3>
                          <div className="ms-auto d-flex gap-2 align-items-center">
                            <input className="form-control form-control-sm" placeholder="Search" value={paging.users.q} onChange={(e) => setPaging((p) => ({ ...p, users: { ...p.users, q: e.target.value, page: 1 } }))} />
                            <button className="btn btn-sm btn-outline-primary" disabled={paging.users.page <= 1} onClick={() => { setPaging((p) => ({ ...p, users: { ...p.users, page: p.users.page - 1 } })); loadUsers(); }}>Prev</button>
                            <span className="text-muted small">{paging.users.page}</span>
                            <button className="btn btn-sm btn-outline-primary" disabled={users.length < pageSize} onClick={() => { setPaging((p) => ({ ...p, users: { ...p.users, page: p.users.page + 1 } })); loadUsers(); }}>Next</button>
                            <button className="btn btn-sm btn-outline-primary" onClick={loadUsers}>Refresh</button>
                          </div>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-vcenter card-table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((u) => (
                                <tr key={u.id}>
                                  <td>{u.id}</td>
                                  <td>{u.username}</td>
                                  <td>{u.role}</td>
                                  <td>{u.createdAt || "-"}</td>
                                  <td className="text-end">
                                    {canEdit ? (
                                      <>
                                        <button className="btn btn-sm btn-outline-primary me-1" onClick={async () => { const role = prompt("Role (editor/viewer):", u.role || "editor"); if (!role) return; await api("/admin/users/" + u.id, { method: "PUT", body: JSON.stringify({ role }) }); loadUsers(); }}>Edit</button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (!confirm("Hapus user ini?")) return; await api("/admin/users/" + u.id, { method: "DELETE" }); loadUsers(); }}>Hapus</button>
                                      </>
                                    ) : (
                                      <span className="text-muted">Viewer</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
