const fs = require("fs");
const path = require("path");
const cors = require("cors");
const chalk = require("chalk");
const express = require("express");
const secure = require("ssl-express-www");
const {
    latencyTracker,
    getAverages,
    countApiRequest,
    requestStats
} = require("./metrics");

const app = express();
const PORT = process.env.PORT || 8080 || 5000 || 3000;

app.use(latencyTracker);
app.get("/metrics/latency", (req, res) => {
    res.json(getAverages());
});
app.use(countApiRequest);
app.get("/metrics/countapirequest", requestStats)

app.enable("trust proxy");
app.set("json spaces", 2);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(secure);
app.use("/", express.static(path.join(__dirname, "public")));
app.use("/src", express.static(path.join(__dirname, "src")));

const settingsPath = path.join(__dirname, "./src/settings.json");
const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));

app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && typeof data === "object") {
            const responseData = {
                status: data.status,
                creator: settings.apiSettings.creator || "Created by Hanz Pedia",
                ...data
            };
            return originalJson.call(this, responseData);
        }
        return originalJson.call(this, data);
    };
    next();
});

let totalRoutes = 0;
const apiFolder = path.join(__dirname, "./src/api");
fs.readdirSync(apiFolder).forEach(subfolder => {
    const subfolderPath = path.join(apiFolder, subfolder);
    if (fs.statSync(subfolderPath).isDirectory()) {
        fs.readdirSync(subfolderPath).forEach(file => {
            const filePath = path.join(subfolderPath, file);
            if (path.extname(file) === ".js") {
                require(filePath)(app);
                totalRoutes++;
                console.log(
                    chalk
                        .bgHex("#FFFF99")
                        .hex("#333")
                        .bold(` Loaded Route: ${path.basename(file)} `)
                );
            }
        });
    }
});
console.log(chalk.bgHex("#90EE90").hex("#333").bold(" Load Complete! ✓ "));
console.log(
    chalk
        .bgHex("#90EE90")
        .hex("#333")
        .bold(` Total Routes Loaded: ${totalRoutes} `)
);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "hanzweb.html"));
});

app.get("/restapi", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "hanzapi.html"));
});

app.get("/store", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "hanzpedia.html"));
});

app.listen(PORT, () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
});

module.exports = app;
