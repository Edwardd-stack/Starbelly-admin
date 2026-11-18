console.log("Reservations frontend javascript file");

const toast = document.getElementById("toast");
const liveStatus = document.getElementById("live-status");

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
};

document.addEventListener("click", async (e) => {
  const button = e.target.closest(".status-btn");
  if (!button) return;
  const row = button.closest("tr");
  const status = button.dataset.status;
  if (status === "CANCEL" && !confirm("Cancel this reservation?")) return;

  try {
    await axios.post(`/admin/reservation/${row.dataset.id}`, { reservationStatus: status });
    window.location.reload();
  } catch (err) {
    console.log(err);
    alert("Could not change the status!");
  }
});

const socket = io({ withCredentials: true });
socket.on("connect", () => {
  liveStatus.textContent = "Live";
  liveStatus.classList.add("on");
});
socket.on("disconnect", () => {
  liveStatus.textContent = "Offline";
  liveStatus.classList.remove("on");
});
socket.on("reservation:new", (r) => {
  showToast(`New reservation: ${r.reservationDate} ${r.timeSlot}, ${r.guestCount} guests — click to refresh`);
  toast.onclick = () => window.location.reload();
});
