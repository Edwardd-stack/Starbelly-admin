console.log("Kitchen frontend javascript file");

const grid = document.getElementById("order-grid");
const emptyState = document.getElementById("empty-state");
const liveStatus = document.getElementById("live-status");
const toast = document.getElementById("toast");

const formatWon = (n) => "₩" + Number(n).toLocaleString("ko-KR");
const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
};

const refreshEmpty = () => {
  emptyState.style.display = grid.children.length ? "none" : "";
};

const renderCard = (order) => {
  const items = (order.orderItems || [])
    .map((item) => {
      const product = (order.productData || []).find((p) => p._id === item.productId);
      return `<li><span>${escapeHtml(product ? product.productName : "Product")}</span><b>× ${item.itemQuantity}</b></li>`;
    })
    .join("");
  const time = new Date(order.updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  const card = document.createElement("div");
  card.className = "glass-card is-new";
  card.dataset.orderId = order._id;
  card.innerHTML = `
    <div class="card-top">
      <span class="card-id">#${order._id.slice(-6).toUpperCase()}</span>
      <span class="card-time">${time}</span>
    </div>
    <div class="board-sub" style="margin-bottom: 10px">${escapeHtml(order.memberData ? order.memberData.memberNick : "")}</div>
    <ul>${items}</ul>
    <div class="card-foot">
      <b>${formatWon(order.orderTotal)}</b>
      <button class="btn-pill btn-ok finish-btn" data-order-id="${order._id}">Tayyor</button>
    </div>`;
  return card;
};

// Tayyor tugmasi: PROCESS -> FINISH (mijozga ball beriladi)
grid.addEventListener("click", async (e) => {
  const button = e.target.closest(".finish-btn");
  if (!button) return;
  button.disabled = true;
  try {
    await axios.post(`/admin/order/${button.dataset.orderId}/finish`);
    const card = button.closest(".glass-card");
    card.style.transition = "opacity 0.3s, transform 0.3s";
    card.style.opacity = "0";
    card.style.transform = "scale(0.95)";
    setTimeout(() => {
      card.remove();
      refreshEmpty();
    }, 300);
  } catch (err) {
    console.log(err);
    button.disabled = false;
    alert("Buyurtmani yakunlab bo'lmadi!");
  }
});

// Real-time
const socket = io({ withCredentials: true });
socket.on("connect", () => {
  liveStatus.textContent = "Live";
  liveStatus.classList.add("on");
});
socket.on("disconnect", () => {
  liveStatus.textContent = "Offline";
  liveStatus.classList.remove("on");
});
socket.on("order:new", (order) => {
  if (grid.querySelector(`[data-order-id="${order._id}"]`)) return;
  grid.appendChild(renderCard(order));
  refreshEmpty();
  showToast("Yangi buyurtma keldi!");
});
socket.on("reservation:new", (r) => {
  showToast(`Yangi bron: ${r.reservationDate} ${r.timeSlot}, ${r.guestCount} kishi`);
});
