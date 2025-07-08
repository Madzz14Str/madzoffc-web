// metrics.js
const latStore = {};
const API_PREFIX = "/api";

function latencyTracker(req, res, next) {
    const urlPath = req.originalUrl.split("?")[0];
    if (!urlPath.startsWith(API_PREFIX)) return next();

    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const end = process.hrtime.bigint();
        const ms = Number(end - start) / 1e6; // to ms

        const endpoint = urlPath;

        if (!latStore[endpoint]) latStore[endpoint] = [];
        latStore[endpoint].push(ms);
        if (latStore[endpoint].length > 100) latStore[endpoint].shift();
    });

    next();
}

function getAverages() {
    const result = {};
    let totalSum = 0,
        totalCnt = 0;

    for (const [endpoint, arr] of Object.entries(latStore)) {
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        result[endpoint] = Math.round(avg);
        totalSum += arr.reduce((a, b) => a + b, 0);
        totalCnt += arr.length;
    }

    result.__overall = totalCnt ? Math.round(totalSum / totalCnt) : 0;
    return result;
}

let todayCount = 0;
let monthCount = 0;
let lastDay = new Date().getDate();
let lastMonth = new Date().getMonth();

function countApiRequest(req, res, next) {
    if (!req.originalUrl.startsWith(API_PREFIX)) return next();

    const now = new Date();
    const day = now.getDate();
    const mo = now.getMonth();

    if (day !== lastDay) {
        todayCount = 0;
        lastDay = day;
    }
    if (mo !== lastMonth) {
        monthCount = 0;
        lastMonth = mo;
    }

    todayCount++;
    monthCount++;

    next();
}

function requestStats(req, res) {
    res.json({ today: todayCount, thisMonth: monthCount });
}

module.exports = { latencyTracker, getAverages, countApiRequest, requestStats };
