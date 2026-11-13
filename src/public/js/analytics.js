console.log("Analytics frontend javascript file");

const data = window.__DASHBOARD__;
const ink = "rgba(248, 250, 252, 0.6)";
const grid = "rgba(248, 250, 252, 0.08)";
const accent = "#f5c332";

Chart.defaults.color = ink;
Chart.defaults.font.family = "system-ui, sans-serif";

const won = (v) => "₩" + Number(v).toLocaleString("ko-KR");

new Chart(document.getElementById("dailyChart"), {
  type: "line",
  data: {
    labels: data.daily.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: "Tushum",
        data: data.daily.map((d) => d.revenue),
        borderColor: accent,
        backgroundColor: "rgba(245, 195, 50, 0.12)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  },
  options: {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${won(ctx.parsed.y)} · ${data.daily[ctx.dataIndex].orderCount} ta buyurtma`,
        },
      },
    },
    scales: {
      x: { grid: { color: grid } },
      y: { grid: { color: grid }, ticks: { callback: (v) => won(v) } },
    },
  },
});

new Chart(document.getElementById("hourlyChart"), {
  type: "bar",
  data: {
    labels: data.hourly.map((h) => `${h.hour}`),
    datasets: [
      {
        label: "Buyurtmalar",
        data: data.hourly.map((h) => h.orderCount),
        backgroundColor: "rgba(79, 70, 229, 0.8)",
        borderRadius: 4,
      },
    ],
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, title: { display: true, text: "soat (KST)" } },
      y: { grid: { color: grid }, ticks: { precision: 0 } },
    },
  },
});
