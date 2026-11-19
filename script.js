/* script.js — customer ordering logic. Content lives in content.js. */

const STORAGE_ORDERS = "hotel_orders";
const STORAGE_COUNTER = "hotel_order_counter";
const STORAGE_CART = "hotel_cart";

/* ---------- Storage (structured so a staff page can read/write the same data) ---------- */
function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch (e) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}
/* Upgrade orders saved by earlier versions of this app to the current structure. */
function normaliseOrder(o) {
  if (!o.payment) {
    const prepaid = o.paymentMethod !== PAY_AT_HOTEL;
    o.payment = { method: o.paymentMethod, prepaid, status: prepaid ? "paid" : "unpaid", paidAt: prepaid ? o.createdAt : null, reference: "" };
  }
  const legacy = { CONFIRMED: o.payment.prepaid ? "PAID" : "PAY_AT_HOTEL", PAYMENT_PENDING: "PAY_AT_HOTEL" };
  if (legacy[o.status]) o.status = legacy[o.status];
  return o;
}
const getOrders = () => loadJSON(STORAGE_ORDERS, []).map(normaliseOrder);
const saveOrders = (o) => saveJSON(STORAGE_ORDERS, o);

function nextOrderNumber() {
  const n = (loadJSON(STORAGE_COUNTER, 0) || 0) + 1;
  saveJSON(STORAGE_COUNTER, n);
  return "#" + String(n).padStart(3, "0");
}

/* ---------- State ---------- */
let cart = loadJSON(STORAGE_CART, {});        // { productId: qty }
let activeCategory = CATEGORIES[0].id;
let pendingOrderInfo = null;                  // form data awaiting confirmation
let lastOrderNumber = null;

const $ = (id) => document.getElementById(id);
const money = (n) => BUSINESS.currency + " " + Number(n).toFixed(2);
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
const statusLabel = (key) => (ORDER_STATUSES.find((s) => s.key === key) || {}).label || key;
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const PLACEHOLDER_IMG =
  "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e7e2d6"/><text x="200" y="158" font-size="22" text-anchor="middle" fill="#9a9384" font-family="sans-serif">No image</text></svg>');
function imgTag(src, alt) {
  return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">`;
}

/* ---------- Cart logic ---------- */
function cartItems() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ product: findProduct(id), qty }))
    .filter((x) => x.product && x.qty > 0);
}
function cartTotal() {
  return cartItems().reduce((sum, x) => sum + x.product.price * x.qty, 0);
}
function cartCount() {
  return cartItems().reduce((sum, x) => sum + x.qty, 0);
}
function persistCart() { saveJSON(STORAGE_CART, cart); }
function addToCart(id) { cart[id] = (cart[id] || 0) + 1; persistCart(); renderCart(); }
function changeQty(id, delta) {
  const q = (cart[id] || 0) + delta;
  if (q <= 0) delete cart[id]; else cart[id] = q;
  persistCart(); renderCart();
}
function removeFromCart(id) { delete cart[id]; persistCart(); renderCart(); }
function clearCart() { cart = {}; persistCart(); renderCart(); }

/* ---------- Rendering ---------- */
function renderHeader() {
  $("biz-name").textContent = BUSINESS.name;
  $("biz-tagline").textContent = BUSINESS.tagline;
  document.title = BUSINESS.name + " — Order Online";
  $("footer-info").textContent = `${BUSINESS.name} · ${BUSINESS.address} · ${BUSINESS.phone}`;
}

function renderTabs() {
  $("category-tabs").innerHTML = CATEGORIES.map(
    (c) => `<button class="tab ${c.id === activeCategory ? "active" : ""}" data-cat="${esc(c.id)}">${esc(c.name)}</button>`
  ).join("");
}

function renderProducts() {
  const list = PRODUCTS.filter((p) => p.category === activeCategory);
  $("product-grid").innerHTML = list.length
    ? list.map((p) => `
      <article class="card" data-product="${esc(p.id)}">
        ${imgTag(p.image, p.name)}
        <div class="card-body">
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.description)}</p>
          <div class="card-foot">
            <span class="price">${money(p.price)}</span>
            <button class="btn primary small" data-add="${esc(p.id)}">Add to Cart</button>
          </div>
        </div>
      </article>`).join("")
    : '<p class="empty">No products in this category yet.</p>';
}

function renderCart() {
  $("cart-count").textContent = cartCount();
  const items = cartItems();
  $("cart-items").innerHTML = items.length
    ? items.map(({ product: p, qty }) => `
      <div class="cart-line" data-line="${esc(p.id)}">
        ${imgTag(p.image, p.name)}
        <div class="info">
          <strong>${esc(p.name)}</strong>
          <span class="muted">${money(p.price)}</span>
          <div class="qty">
            <button data-dec="${esc(p.id)}" aria-label="Decrease">−</button>
            <span class="qty-val">${qty}</span>
            <button data-inc="${esc(p.id)}" aria-label="Increase">+</button>
          </div>
        </div>
        <div>
          <strong>${money(p.price * qty)}</strong><br>
          <button class="remove" data-remove="${esc(p.id)}">Remove</button>
        </div>
      </div>`).join("")
    : '<p class="empty">Your cart is empty.</p>';
  $("cart-total").textContent = money(cartTotal());
  $("checkout-btn").disabled = items.length === 0;
  $("checkout-btn").style.opacity = items.length ? 1 : 0.5;
}

/* ---------- Drawer / modal ---------- */
function openCart() { $("cart-drawer").classList.remove("hidden"); $("overlay").classList.remove("hidden"); }
function closeCart() { $("cart-drawer").classList.add("hidden"); $("overlay").classList.add("hidden"); }

function showStep(step) {
  $("checkout-form").classList.toggle("hidden", step !== "form");
  $("checkout-summary").classList.toggle("hidden", step !== "summary");
  $("checkout-payment").classList.toggle("hidden", step !== "payment");
  $("checkout-success").classList.toggle("hidden", step !== "success");
  $("modal-title").textContent = { form: "Checkout", summary: "Order Summary", payment: "Payment", success: "Order Placed" }[step];
}
function openCheckout() {
  if (!cartItems().length) return;
  closeCart();
  showStep("form");
  $("form-error").classList.add("hidden");
  $("checkout-modal").classList.remove("hidden");
}
function closeCheckout() { $("checkout-modal").classList.add("hidden"); }

function renderSummary(info) {
  const lines = cartItems().map(({ product: p, qty }) =>
    `<div class="sum-line"><span>${qty} × ${esc(p.name)}</span><span>${money(p.price * qty)}</span></div>`).join("");
  $("summary-body").innerHTML = `
    ${lines}
    <div class="sum-line sum-total"><span>Total</span><span>${money(cartTotal())}</span></div>
    <div class="sum-details">
      <div><span>Name</span><strong>${esc(info.name)}</strong></div>
      <div><span>Contact</span><strong>${esc(info.phone)}</strong></div>
      <div><span>Order type</span><strong>${esc(info.orderType)}</strong></div>
      <div><span>Payment</span><strong>${esc(info.paymentMethod)}</strong></div>
      ${info.notes ? `<div><span>Notes</span><strong>${esc(info.notes)}</strong></div>` : ""}
    </div>
    <p class="muted">${isPrepaid(info.paymentMethod)
      ? "You will pay now. Your order is then sent to the hotel for confirmation. If the hotel cannot accept it, you will get a full refund."
      : "No payment now. Your order is sent to the hotel for confirmation and you pay at the front desk."}</p>`;
  $("place-order").textContent = isPrepaid(info.paymentMethod) ? "Proceed to Payment" : "Place Order";
}
const isPrepaid = (method) => method !== PAY_AT_HOTEL;

function renderPayment(info) {
  $("pay-amount").textContent = money(cartTotal());
  $("pay-method").textContent = info.paymentMethod;
  $("pay-now").textContent = "Pay " + money(cartTotal());
  $("pay-now").disabled = false;
}

/* ---------- Orders ---------- */
function placeOrder(info, paymentRef) {
  const items = cartItems().map(({ product: p, qty }) => ({
    id: p.id, name: p.name, price: p.price, qty, subtotal: p.price * qty,
  }));
  if (!items.length) return null;
  const now = new Date().toISOString();
  const order = {
    number: nextOrderNumber(),
    customer: { name: info.name, phone: info.phone },
    orderType: info.orderType,
    paymentMethod: info.paymentMethod,
    payment: {
      method: info.paymentMethod,
      prepaid: isPrepaid(info.paymentMethod),
      status: isPrepaid(info.paymentMethod) ? "paid" : "unpaid",   // paid | unpaid | refunded
      paidAt: isPrepaid(info.paymentMethod) ? now : null,
      reference: paymentRef || "",
    },
    notes: info.notes || "",
    items,
    total: items.reduce((s, i) => s + i.subtotal, 0),
    status: ORDER_STATUSES[0].key,           // "NEW" = Pending Confirmation
    statusHistory: [{ status: ORDER_STATUSES[0].key, at: now }],
    createdAt: now,
    updatedAt: now,
  };
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  return order;
}

/* ---------- Status rules (shared with the staff page) ---------- */
/* Which status changes staff may make from each status. */
function allowedActions(order) {
  const paid = order.payment && order.payment.status === "paid";
  switch (order.status) {
    case "NEW": return [
      { to: order.payment.prepaid ? "PAID" : "PAY_AT_HOTEL", label: "Confirm", primary: true },
      { to: "CANCELLED", label: paid ? "Reject (refund)" : "Reject", danger: true }];
    case "PAY_AT_HOTEL": return [
      { to: "PAID", label: "Mark as Paid", primary: true },
      { to: "CANCELLED", label: "Cancel", danger: true }];
    case "PAID": return [
      { to: "CHECKED_IN", label: "Check In", primary: true },
      { to: "CANCELLED", label: "Cancel (refund)", danger: true }];
    case "CHECKED_IN": return [{ to: "CHECKED_OUT", label: "Check Out", primary: true }];
    case "CANCELLED": return paid ? [{ to: "REFUNDED", label: "Mark as Refunded", primary: true }] : [];
    default: return [];
  }
}

/* Change an order's status (only if allowed). Writes to the same storage customer tracking reads. */
function updateOrderStatus(number, newStatus) {
  const orders = getOrders();
  const order = orders.find((o) => o.number === number);
  if (!order || !allowedActions(order).some((a) => a.to === newStatus)) return null;
  const now = new Date().toISOString();
  order.status = newStatus;
  if (newStatus === "PAID" && order.payment.status !== "paid") { order.payment.status = "paid"; order.payment.paidAt = now; }
  if (newStatus === "REFUNDED") { order.payment.status = "refunded"; order.payment.refundedAt = now; }
  order.statusHistory = (order.statusHistory || []).concat({ status: newStatus, at: now });
  order.updatedAt = now;
  saveOrders(orders);
  return order;
}
const stageOf = (statusKey) => (ORDER_STATUSES.find((s) => s.key === statusKey) || {}).stage || statusKey;

/* Steps shown to the customer, based on how they paid and whether the order was cancelled. */
function statusPath(order) {
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    const wasPaid = order.payment.status === "paid" || order.payment.status === "refunded";
    return wasPaid ? ["NEW", "CANCELLED", "REFUNDED"] : ["NEW", "CANCELLED"];
  }
  return order.payment.prepaid
    ? ["NEW", "PAID", "CHECKED_IN", "CHECKED_OUT"]
    : ["NEW", "PAY_AT_HOTEL", "PAID", "CHECKED_IN", "CHECKED_OUT"];
}
function paymentText(order) {
  const p = order.payment;
  if (p.status === "refunded") return `Refunded (${p.method})`;
  if (p.status === "paid") return `Paid – ${p.method}${p.reference ? " · Ref " + p.reference : ""}`;
  return order.status === "CANCELLED" ? "Not charged" : "Pay at hotel (unpaid)";
}

function normaliseNumber(input) {
  const digits = String(input).replace(/[^0-9]/g, "");
  return digits ? "#" + digits.padStart(3, "0") : "";
}
function findOrder(input) {
  const n = normaliseNumber(input);
  return getOrders().find((o) => o.number === n) || null;
}

function renderTracking(order, input) {
  const box = $("track-result");
  if (!order) {
    box.innerHTML = `<p class="error">No order found for "${esc(input)}". Please check the number and try again.</p>`;
    return;
  }
  const path = statusPath(order);
  const idx = path.indexOf(order.status);
  const steps = path.map((k, i) =>
    `<li class="${i < idx ? "done" : i === idx ? "current done" : ""}">${esc(statusLabel(k))}</li>`).join("");
  const items = order.items.map((i) => `${i.qty} × ${esc(i.name)}`).join(", ");
  box.innerHTML = `
    <div class="track-card">
      <div class="track-head">
        <strong>Order ${esc(order.number)}</strong>
        <span class="status-pill" id="track-status">${esc(statusLabel(order.status))}</span>
      </div>
      <div class="muted">${esc(order.customer.name)} · ${esc(order.orderType)}</div>
      <div class="muted" id="track-payment">Payment: ${esc(paymentText(order))}</div>
      <ul class="steps">${steps}</ul>
      <div class="muted">${items}</div>
      <div><strong>Total: ${money(order.total)}</strong></div>
    </div>`;
}

/* ---------- Events ---------- */
function init() {
  renderHeader();
  renderTabs();
  renderProducts();
  renderCart();

  $("f-type").innerHTML = ORDER_TYPES.map((t) => `<option>${esc(t)}</option>`).join("");
  $("f-payment").innerHTML = PAYMENT_METHODS.map((t) => `<option>${esc(t)}</option>`).join("");

  $("category-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    activeCategory = b.dataset.cat;
    renderTabs(); renderProducts();
  });
  $("product-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    addToCart(b.dataset.add);
    b.textContent = "Added ✓";
    setTimeout(() => { b.textContent = "Add to Cart"; }, 800);
  });
  $("cart-items").addEventListener("click", (e) => {
    const t = e.target;
    if (t.dataset.inc) changeQty(t.dataset.inc, 1);
    else if (t.dataset.dec) changeQty(t.dataset.dec, -1);
    else if (t.dataset.remove) removeFromCart(t.dataset.remove);
  });

  $("cart-btn").addEventListener("click", openCart);
  $("cart-close").addEventListener("click", closeCart);
  $("overlay").addEventListener("click", closeCart);
  $("checkout-btn").addEventListener("click", openCheckout);
  $("modal-close").addEventListener("click", closeCheckout);

  $("checkout-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const info = {
      name: $("f-name").value.trim(),
      phone: $("f-phone").value.trim(),
      orderType: $("f-type").value,
      paymentMethod: $("f-payment").value,
      notes: $("f-notes").value.trim(),
    };
    const err = $("form-error");
    if (!info.name) { err.textContent = "Please enter your name."; err.classList.remove("hidden"); return; }
    if (!/^[+\d][\d\s\-()]{6,}$/.test(info.phone)) { err.textContent = "Please enter a valid contact number."; err.classList.remove("hidden"); return; }
    err.classList.add("hidden");
    pendingOrderInfo = info;
    renderSummary(info);
    showStep("summary");
  });
  $("summary-back").addEventListener("click", () => showStep("form"));
  function finishOrder(paymentRef) {
    const order = placeOrder(pendingOrderInfo, paymentRef);
    if (!order) return;
    lastOrderNumber = order.number;
    clearCart();
    $("success-number").textContent = order.number;
    $("success-status").textContent = statusLabel(order.status);
    $("success-payment").textContent = paymentText(order);
    $("checkout-form").reset();
    showStep("success");
  }
  $("place-order").addEventListener("click", () => {
    if (isPrepaid(pendingOrderInfo.paymentMethod)) { renderPayment(pendingOrderInfo); showStep("payment"); }
    else finishOrder("");
  });
  $("pay-back").addEventListener("click", () => showStep("summary"));
  $("pay-now").addEventListener("click", () => {
    // DEMO payment: simulates a successful payment. Replace with a real payment gateway later.
    const btn = $("pay-now");
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "Processing…";
    setTimeout(() => finishOrder("PAY-" + Date.now().toString(36).toUpperCase()), 700);
  });
  $("success-done").addEventListener("click", closeCheckout);
  $("success-track").addEventListener("click", () => {
    closeCheckout();
    $("track-input").value = lastOrderNumber;
    renderTracking(findOrder(lastOrderNumber), lastOrderNumber);
    $("track").scrollIntoView();
  });

  $("track-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("track-input").value;
    renderTracking(findOrder(v), v);
  });

  // Live update: if staff change an order in another tab, refresh the tracking result.
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_ORDERS) return;
    const v = $("track-input").value;
    if (v && $("track-result").innerHTML) renderTracking(findOrder(v), v);
  });
}

// Only start the customer page on the customer page (staff.html also loads this file).
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("product-grid")) init();
});
