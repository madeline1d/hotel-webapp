/* staff.js — Staff Order Management page.
   Uses the SAME order data as the customer page (getOrders / updateOrderStatus
   in script.js), so status changes appear in customer Order Tracking. */

let staffLoggedIn = false;

function fmtTime(iso) {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function orderCard(o) {
  const items = o.items.map((i) =>
    `<li><span>${i.qty} × ${esc(i.name)}</span><span>${money(i.subtotal)}</span></li>`).join("");
  const actions = allowedActions(o).map((a) =>
    `<button class="btn small ${a.primary ? "primary next-btn" : ""} ${a.danger ? "danger" : ""}"
       data-move="${esc(o.number)}" data-to="${a.to}" ${a.danger ? 'data-needs-confirm="1"' : ""}>${esc(a.label)}</button>`).join("");
  return `
    <article class="order-card" data-order="${esc(o.number)}">
      <div class="oc-head">
        <strong class="oc-num">${esc(o.number)}</strong>
        <span class="status-pill">${esc(statusLabel(o.status))}</span>
      </div>
      <div class="oc-cust"><strong>${esc(o.customer.name)}</strong> · ${esc(o.customer.phone)}</div>
      <div class="muted">${esc(o.orderType)}</div>
      <div class="oc-pay ${o.status === "CANCELLED" && o.payment.status === "unpaid" ? "refunded" : esc(o.payment.status)}">${esc(paymentText(o))}</div>
      <div class="muted">Ordered: ${esc(fmtTime(o.createdAt))}</div>
      <ul class="oc-items">${items}</ul>
      ${o.notes ? `<div class="oc-notes">Note: ${esc(o.notes)}</div>` : ""}
      <div class="oc-total"><span>Total</span><strong>${money(o.total)}</strong></div>
      ${actions ? `<div class="oc-actions">${actions}</div>` : ""}
    </article>`;
}

function renderBoard() {
  if (!staffLoggedIn) { $("board").innerHTML = ""; return; }
  const q = $("board-search").value.trim().toLowerCase();
  const orders = getOrders()
    .filter((o) => !q || [o.number, o.customer.name, o.customer.phone].join(" ").toLowerCase().includes(q))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  $("board").innerHTML = BOARD_STAGES.map((st) => {
    const list = orders.filter((o) => stageOf(o.status) === st.key);
    return `
      <section class="board-col" data-stage="${st.key}">
        <h3>${esc(st.label)} <span class="badge">${list.length}</span></h3>
        ${list.length ? list.map(orderCard).join("") : '<p class="empty small-empty">No orders</p>'}
      </section>`;
  }).join("");
}

function showLogin() {
  staffLoggedIn = false;
  $("board").innerHTML = "";                 // remove all customer data from the page
  $("board-search").value = "";
  $("board-screen").classList.add("hidden");
  $("logout-btn").classList.add("hidden");
  $("login-screen").classList.remove("hidden");
  $("pin-input").value = "";
  $("login-error").classList.add("hidden");
  $("pin-input").focus();
}
function showBoard() {
  staffLoggedIn = true;
  $("login-screen").classList.add("hidden");
  $("board-screen").classList.remove("hidden");
  $("logout-btn").classList.remove("hidden");
  renderBoard();
}

function initStaff() {
  $("staff-biz-name").textContent = BUSINESS.name;
  document.title = BUSINESS.name + " — Staff";

  $("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("pin-input").value === STAFF_PIN) showBoard();
    else {
      $("board").innerHTML = "";
      $("login-error").classList.remove("hidden");
      $("pin-input").value = "";
    }
  });
  $("logout-btn").addEventListener("click", showLogin);
  $("refresh-btn").addEventListener("click", renderBoard);
  $("board-search").addEventListener("input", renderBoard);

  $("board").addEventListener("click", (e) => {
    const b = e.target.closest("[data-move]");
    if (!b || !staffLoggedIn) return;
    // Reject / Cancel need a second tap to avoid mistakes.
    if (b.dataset.needsConfirm && !b.classList.contains("armed")) {
      b.classList.add("armed");
      b.dataset.originalLabel = b.textContent;
      b.textContent = "Tap again to confirm";
      setTimeout(() => { if (b.isConnected) { b.classList.remove("armed"); b.textContent = b.dataset.originalLabel; } }, 3000);
      return;
    }
    updateOrderStatus(b.dataset.move, b.dataset.to);
    renderBoard();
  });

  // New customer orders (placed in another tab) appear automatically.
  window.addEventListener("storage", (e) => { if (e.key === STORAGE_ORDERS) renderBoard(); });

  showLogin();
}

document.addEventListener("DOMContentLoaded", initStaff);
