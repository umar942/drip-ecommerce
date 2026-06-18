/**
 * Smoke-test all API endpoints against localhost:8080
 * Run: npx tsx scripts/test-api.ts
 */

const BASE = "http://localhost:8080/api";

type Result = { method: string; path: string; status: number; ok: boolean; note?: string };

const results: Result[] = [];

async function req(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, data };
}

function record(method: string, path: string, status: number, expected: number | number[], note?: string) {
  const ok = Array.isArray(expected) ? expected.includes(status) : status === expected;
  results.push({ method, path, status, ok, note });
  const icon = ok ? "✓" : "✗";
  console.log(`${icon} ${method.padEnd(6)} ${path} → ${status}${note ? ` (${note})` : ""}`);
}

async function main() {
  console.log("\n=== API Smoke Tests ===\n");

  // Health
  const health = await req("GET", "/healthz");
  record("GET", "/healthz", health.status, 200);

  // Public: categories & products
  const categories = await req("GET", "/categories");
  record("GET", "/categories", categories.status, 200);
  const cats = categories.data as Array<{ id: number }>;

  const products = await req("GET", "/products");
  record("GET", "/products", products.status, 200);
  const productList = products.data as { products: Array<{ id: number }> };
  const productId = productList.products[0]?.id ?? 1;

  const featured = await req("GET", "/products/featured");
  record("GET", "/products/featured", featured.status, 200);

  const product = await req("GET", `/products/${productId}`);
  record("GET", `/products/${productId}`, product.status, 200);

  const related = await req("GET", `/products/${productId}/related`);
  record("GET", `/products/${productId}/related`, related.status, 200);

  // Auth: login as admin
  const login = await req("POST", "/auth/login", {
    email: "admin@drip.store",
    password: "password",
  });
  record("POST", "/auth/login", login.status, 200);
  if (login.status !== 200) {
    console.error("\nAdmin login failed — run `pnpm seed` first.\n");
    process.exit(1);
  }
  const adminToken = (login.data as { token: string }).token;

  const me = await req("GET", "/auth/me", undefined, adminToken);
  record("GET", "/auth/me", me.status, 200);

  // Register test user (may 400 if exists)
  const testEmail = `testuser_${Date.now()}@example.com`;
  const register = await req("POST", "/auth/register", {
    name: "Test User",
    email: testEmail,
    password: "testpass123",
  });
  record("POST", "/auth/register", register.status, 201);
  const userToken = (register.data as { token: string }).token;
  const userId = (register.data as { user: { id: number } }).user.id;

  const logout = await req("POST", "/auth/logout");
  record("POST", "/auth/logout", logout.status, 200);

  // Cart (user)
  const cart = await req("GET", "/cart", undefined, userToken);
  record("GET", "/cart", cart.status, 200);

  const addCart = await req(
    "POST",
    "/cart/items",
    { productId, quantity: 1, size: "M", color: "Black" },
    userToken,
  );
  record("POST", "/cart/items", addCart.status, 201);
  const cartData = addCart.data as { items: Array<{ id: number }> };
  const cartItemId = cartData.items[0]?.id;

  if (cartItemId) {
    const updateCart = await req("PATCH", `/cart/items/${cartItemId}`, { quantity: 2 }, userToken);
    record("PATCH", `/cart/items/${cartItemId}`, updateCart.status, 200);
  }

  // Wishlist (user)
  const wishlist = await req("GET", "/wishlist", undefined, userToken);
  record("GET", "/wishlist", wishlist.status, 200);

  const addWish = await req("POST", "/wishlist", { productId }, userToken);
  record("POST", "/wishlist", addWish.status, 201);

  const delWish = await req("DELETE", `/wishlist/${productId}`, undefined, userToken);
  record("DELETE", `/wishlist/${productId}`, delWish.status, 204);

  // Addresses
  const addAddr = await req(
    "POST",
    `/users/${userId}/addresses`,
    {
      line1: "123 Test St",
      city: "NYC",
      state: "NY",
      country: "US",
      zip: "10001",
      label: "Home",
      isDefault: true,
    },
    userToken,
  );
  record("POST", `/users/${userId}/addresses`, addAddr.status, 201);
  const addressId = (addAddr.data as { id: number }).id;

  const addresses = await req("GET", `/users/${userId}/addresses`, undefined, userToken);
  record("GET", `/users/${userId}/addresses`, addresses.status, 200);

  // Orders (user)
  const createOrder = await req(
    "POST",
    "/orders",
    { addressId, paymentMethod: "card" },
    userToken,
  );
  record("POST", "/orders", createOrder.status, 201);
  const orderId = (createOrder.data as { id: number }).id;

  const orders = await req("GET", "/orders", undefined, userToken);
  record("GET", "/orders", orders.status, 200);

  const order = await req("GET", `/orders/${orderId}`, undefined, userToken);
  record("GET", `/orders/${orderId}`, order.status, 200);

  // Admin endpoints
  const stats = await req("GET", "/admin/stats", undefined, adminToken);
  record("GET", "/admin/stats", stats.status, 200);

  const recentOrders = await req("GET", "/admin/recent-orders", undefined, adminToken);
  record("GET", "/admin/recent-orders", recentOrders.status, 200);

  const users = await req("GET", "/users", undefined, adminToken);
  record("GET", "/users", users.status, 200);

  const userDetail = await req("GET", `/users/${userId}`, undefined, adminToken);
  record("GET", `/users/${userId}`, userDetail.status, 200);

  const patchOrder = await req(
    "PATCH",
    `/orders/${orderId}/status`,
    { status: "processing" },
    adminToken,
  );
  record("PATCH", `/orders/${orderId}/status`, patchOrder.status, 200);

  // Admin: create category & product
  const slug = `test-cat-${Date.now()}`;
  const newCat = await req(
    "POST",
    "/categories",
    { name: "Test Category", slug, description: "Test" },
    adminToken,
  );
  record("POST", "/categories", newCat.status, 201);
  const catId = (newCat.data as { id: number }).id;

  const newProd = await req(
    "POST",
    "/products",
    {
      title: "API Test Product",
      price: 49.99,
      category: "Test Category",
      categoryId: catId,
      stock: 10,
      images: [],
      sizes: ["M"],
      colors: ["Black"],
    },
    adminToken,
  );
  record("POST", "/products", newProd.status, 201);
  const newProdId = (newProd.data as { id: number }).id;

  const patchProd = await req(
    "PATCH",
    `/products/${newProdId}`,
    { title: "API Test Product Updated", price: 59.99 },
    adminToken,
  );
  record("PATCH", `/products/${newProdId}`, patchProd.status, 200);

  // Cleanup
  const delProd = await req("DELETE", `/products/${newProdId}`, undefined, adminToken);
  record("DELETE", `/products/${newProdId}`, delProd.status, 204);

  const delCat = await req("DELETE", `/categories/${catId}`, undefined, adminToken);
  record("DELETE", `/categories/${catId}`, delCat.status, 204);

  const clearCart = await req("DELETE", "/cart", undefined, userToken);
  record("DELETE", "/cart", clearCart.status, 200);

  // Summary
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== Results: ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length > 0) {
    console.log("\nFailed:");
    failed.forEach((f) => console.log(`  ${f.method} ${f.path} → ${f.status}`));
    process.exit(1);
  }
  console.log("\nAll APIs working.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
