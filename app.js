const STORAGE_KEY = "inventory_products";
const form = document.getElementById("product-form");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const priceInput = document.getElementById("price");
const quantityInput = document.getElementById("quantity");
const editIdInput = document.getElementById("edit-id");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const productList = document.getElementById("product-list");
const emptyMsg = document.getElementById("empty-msg");
const searchInput = document.getElementById("search");
const statsEl = document.getElementById("stats");

const THEME_KEY = "inventory_theme";
const themeToggle = document.getElementById("theme-toggle");

let products = loadProducts();

form.addEventListener("submit", handleSubmit);
cancelBtn.addEventListener("click", cancelEdit);
searchInput.addEventListener("input", renderProducts);
themeToggle.addEventListener("click", toggleTheme);

function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute("data-theme") === "light";
  html.setAttribute("data-theme", isLight ? "dark" : "light");
  themeToggle.textContent = isLight ? "\u263E" : "\u2600";
  localStorage.setItem(THEME_KEY, isLight ? "dark" : "light");
}

(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  themeToggle.textContent = saved === "light" ? "\u2600" : "\u263E";
})();

function loadProducts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function handleSubmit(e) {
  e.preventDefault();
  const editId = editIdInput.value;
  const product = {
    id: editId || generateId(),
    name: nameInput.value.trim(),
    category: categoryInput.value.trim(),
    price: parseFloat(priceInput.value),
    quantity: parseInt(quantityInput.value, 10),
  };

  if (editId) {
    const idx = products.findIndex((p) => p.id === editId);
    if (idx !== -1) products[idx] = product;
  } else {
    products.push(product);
  }

  saveProducts();
  renderProducts();
  form.reset();
  editIdInput.value = "";
  formTitle.textContent = "Add Product";
  submitBtn.textContent = "Add Product";
  cancelBtn.hidden = true;
}

function cancelEdit() {
  form.reset();
  editIdInput.value = "";
  formTitle.textContent = "Add Product";
  submitBtn.textContent = "Add Product";
  cancelBtn.hidden = true;
}

function editProduct(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  editIdInput.value = p.id;
  nameInput.value = p.name;
  categoryInput.value = p.category;
  priceInput.value = p.price;
  quantityInput.value = p.quantity;
  formTitle.textContent = "Edit Product";
  submitBtn.textContent = "Update Product";
  cancelBtn.hidden = false;
  nameInput.focus();
}

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  products = products.filter((p) => p.id !== id);
  saveProducts();
  renderProducts();
}

function renderProducts() {
  const query = searchInput.value.toLowerCase();
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
  );

  productList.innerHTML = "";

  filtered.forEach((p) => {
    const tr = document.createElement("tr");
    const total = (p.price * p.quantity).toFixed(2);
    const qtyClass = p.quantity < 5 ? "low-stock" : "";
    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>\u20B1${p.price.toFixed(2)}</td>
      <td class="${qtyClass}">${p.quantity}</td>
      <td>\u20B1${total}</td>
      <td class="actions">
        <button class="btn btn-edit" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    `;
    productList.appendChild(tr);
  });

  emptyMsg.style.display = filtered.length === 0 ? "block" : "none";

  const totalItems = products.reduce((s, p) => s + p.quantity, 0);
  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  statsEl.textContent = `${products.length} item types \u00B7 ${totalItems} units \u00B1${totalValue.toFixed(2)} total value`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

renderProducts();
