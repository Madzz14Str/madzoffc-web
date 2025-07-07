// metrics.js
const latStore = {};               // { "/api/search/npm": [45,30], ... }
const API_PREFIX = '/api';         // ubah jika prefix-mu berbeda

function latencyTracker(req, res, next) {
  // ➜ Filter: abaikan request yang tidak mengandung /api
  const urlPath = req.originalUrl.split('?')[0];   // buang query string  
  if (!urlPath.startsWith(API_PREFIX)) return next();

  // —––   MULAI MENGHITUNG   —––
  const start = process.hrtime.bigint();           // nanosecond

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms  = Number(end - start) / 1e6;         // to ms

    // Gunakan hanya path tanpa query agar konsisten
    const endpoint = urlPath;                      // contoh: /api/search/npm

    if (!latStore[endpoint]) latStore[endpoint] = [];
    latStore[endpoint].push(ms);
    if (latStore[endpoint].length > 100) latStore[endpoint].shift(); // simpan 100 terakhir
  });

  next();
}

function getAverages() {
  const result = {};
  let totalSum = 0, totalCnt = 0;

  for (const [endpoint, arr] of Object.entries(latStore)) {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    result[endpoint] = Math.round(avg);
    totalSum += arr.reduce((a, b) => a + b, 0);
    totalCnt += arr.length;
  }

  result.__overall = totalCnt ? Math.round(totalSum / totalCnt) : 0;
  return result;
}

module.exports = { latencyTracker, getAverages };