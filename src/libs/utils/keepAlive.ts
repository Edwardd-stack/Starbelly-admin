/**
 * Render Free 15 daqiqa tashqi so'rov bo'lmasa serverni uxlatadi.
 * Server o'zining ochiq manziliga (RENDER_EXTERNAL_URL) har 10 daqiqada /health so'rovi yuboradi —
 * so'rov Render'ning tashqi proksisidan o'tgani uchun "faollik" deb hisoblanadi.
 * Faqat production'da va Render'da ishlaydi (RENDER_EXTERNAL_URL'ni Render o'zi beradi).
 */
const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 daqiqa

export const startKeepAlive = () => {
  const baseUrl = process.env.RENDER_EXTERNAL_URL;
  if (process.env.NODE_ENV !== "production" || !baseUrl) return;

  const ping = async () => {
    try {
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) console.log(`keepAlive: /health ${res.status}`);
    } catch (err) {
      console.log("keepAlive: ping failed", (err as Error).message);
    }
  };

  setInterval(ping, KEEP_ALIVE_INTERVAL).unref();
  console.info(`keepAlive: pinging ${baseUrl}/health every 10 minutes`);
};
