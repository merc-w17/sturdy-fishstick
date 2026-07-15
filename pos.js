const SUPABASE_URL = "https://vbplazrbewalokmwtzhu.supabase.co";
const SUPABASE_KEY = "sb_publishable_56EGwF-4b_R128n9hvRy1Q_ioVbBVes";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const THEME_KEY = "inventory_theme";
const themeToggle = document.getElementById("theme-toggle");
const searchInput = document.getElementById("search");
const productGrid = document.getElementById("product-grid");
const emptyProducts = document.getElementById("empty-products");
const cartItems = document.getElementById("cart-items");
const emptyCart = document.getElementById("empty-cart");
const cartFooter = document.getElementById("cart-footer");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const completeBtn = document.getElementById("complete-btn");
const clearBtn = document.getElementById("clear-btn");

let products = [];
let cart = [];

themeToggle.addEventListener("click", toggleTheme);
searchInput.addEventListener("input", renderProducts);
completeBtn.addEventListener("click", completeSale);
clearBtn.addEventListener("click", clearCart);

(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  themeToggle.textContent = saved === "light" ? "\u2600" : "\u263E";
})();

function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute("data-theme") === "light";
  html.setAttribute("data-theme", isLight ? "dark" : "light");
  themeToggle.textContent = isLight ? "\u263E" : "\u2600";
  localStorage.setItem(THEME_KEY, isLight ? "dark" : "light");
}

window.addEventListener("pageshow", () => {
  renderProducts();
  renderCart();
});

async function renderProducts() {
  const query = searchInput.value.toLowerCase();
  let supabaseQuery = supabase.from("products").select("*").order("name", { ascending: true });
  if (query) {
    supabaseQuery = supabaseQuery.or("name.ilike.%{query}%,category.ilike.%{query}%".replace(/{query}/g, query));
  }
  const { data } = await supabaseQuery;
  products = data || [];
  productGrid.innerHTML = "";
  products.forEach((p) => {
    const div = document.createElement("div");
    const outOfStock = p.quantity <= 0;
    div.className = "product-card" + (outOfStock ? " out-of-stock" : "");
    div.innerHTML = `
      <div class="p-name">${escapeHtml(p.name)}</div>
      <div class="p-category">${escapeHtml(p.category)}</div>
      <div class="p-price">\u20B1${p.price.toFixed(2)}</div>
      <div class="p-stock">${p.quantity} in stock</div>
    `;
    if (!outOfStock) {
      div.addEventListener("click", () => addToCart(p));
    }
    productGrid.appendChild(div);
  });
  emptyProducts.style.display = products.length === 0 ? "block" : "none";
}

function addToCart(product) {
  const existing = cart.find((c) => c.id === product.id);
  const productData = products.find((p) => p.id === product.id);
  const maxQty = productData ? productData.quantity : 0;
  if (existing) {
    if (existing.qty < maxQty) existing.qty++;
  } else {
    if (maxQty > 0) cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  const productData = products.find((p) => p.id === id);
  const maxQty = productData ? productData.quantity : 0;
  item.qty = Math.max(1, Math.min(maxQty, item.qty + delta));
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function renderCart() {
  cartItems.innerHTML = "";
  cart.forEach((item) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    const total = (item.price * item.qty).toFixed(2);
    div.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-price">\u20B1${item.price.toFixed(2)} each</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" data-id="${item.id}" data-dir="-1">&minus;</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" data-id="${item.id}" data-dir="1">&plus;</button>
      </div>
      <div class="cart-item-total">\u20B1${total}</div>
      <button class="cart-item-remove" data-id="${item.id}">Remove</button>
    `;
    cartItems.appendChild(div);
  });
  cartItems.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => changeQty(btn.dataset.id, parseInt(btn.dataset.dir, 10)));
  });
  cartItems.querySelectorAll(".cart-item-remove").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.id));
  });
  const hasItems = cart.length > 0;
  emptyCart.style.display = hasItems ? "none" : "block";
  cartFooter.hidden = !hasItems;
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const totalVal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  cartCount.textContent = totalQty;
  cartTotal.textContent = "\u20B1" + totalVal.toFixed(2);
}

async function completeSale() {
  if (cart.length === 0) return;
  if (!confirm("Complete this sale?")) return;
  for (const item of cart) {
    const productData = products.find((p) => p.id === item.id);
    if (productData) {
      const newQty = Math.max(0, productData.quantity - item.qty);
      await supabase.from("products").update({ quantity: newQty }).eq("id", item.id);
    }
  }
  cart = [];
  renderCart();
  renderProducts();
  alert("Sale completed!");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

renderProducts();
renderCart();
