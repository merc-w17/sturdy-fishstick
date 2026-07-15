const THEME_KEY = "inventory_theme";
const themeToggle = document.getElementById("theme-toggle");

themeToggle.addEventListener("click", toggleTheme);

(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  themeToggle.textContent = saved === "light" ? "\u2600" : "\u263E";
})();

function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute("data-theme") === "light";
  html.setAttribute("data-theme", isLight ? "dark" : "light");
  themeToggle.textContent = isLight ? "\u263E" : "\u2600";
  localStorage.setItem(THEME_KEY, isLight ? "dark" : "light");
}

const SUPABASE_URL = "https://vbplazrbewalokmwtzhu.supabase.co";
const SUPABASE_KEY = "sb_publishable_56EGwF-4b_R128n9hvRy1Q_ioVbBVes";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

form.addEventListener("submit", handleSubmit);
cancelBtn.addEventListener("click", cancelEdit);
searchInput.addEventListener("input", renderProducts);

window.addEventListener("pageshow", renderProducts);

async function handleSubmit(e) {
  e.preventDefault();
  const data = {
    name: nameInput.value.trim(),
    category: categoryInput.value.trim(),
    price: parseFloat(priceInput.value),
    quantity: parseInt(quantityInput.value, 10),
  };
  const editId = editIdInput.value;
  if (editId) {
    await supabase.from("products").update(data).eq("id", editId);
  } else {
    await supabase.from("products").insert(data);
  }
  form.reset();
  editIdInput.value = "";
  formTitle.textContent = "Add Product";
  submitBtn.textContent = "Add Product";
  cancelBtn.hidden = true;
  renderProducts();
}

function cancelEdit() {
  form.reset();
  editIdInput.value = "";
  formTitle.textContent = "Add Product";
  submitBtn.textContent = "Add Product";
  cancelBtn.hidden = true;
}

async function editProduct(id) {
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  if (!data) return;
  editIdInput.value = data.id;
  nameInput.value = data.name;
  categoryInput.value = data.category;
  priceInput.value = data.price;
  quantityInput.value = data.quantity;
  formTitle.textContent = "Edit Product";
  submitBtn.textContent = "Update Product";
  cancelBtn.hidden = false;
  nameInput.focus();
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  await supabase.from("products").delete().eq("id", id);
  renderProducts();
}

async function renderProducts() {
  const query = searchInput.value.toLowerCase();
  let supabaseQuery = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,category.ilike.%${query}%`);
  }
  const { data: products } = await supabaseQuery;
  productList.innerHTML = "";
  if (!products) return;
  products.forEach((p) => {
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
  emptyMsg.style.display = products.length === 0 ? "block" : "none";
  const totalItems = products.reduce((s, p) => s + p.quantity, 0);
  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  statsEl.textContent = `${products.length} item types \u00B7 ${totalItems} units \u20B1${totalValue.toFixed(2)} total value`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

renderProducts();
