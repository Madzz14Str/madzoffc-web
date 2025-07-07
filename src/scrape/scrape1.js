// lib/gitclone.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");

const streamPipeline = promisify(pipeline);

/* ── menghasilkan URL ZIP di GitHub ───────────────────────────── */
function getZipUrl(input, branch = "main") {
    const m = input
        .trim()
        .match(
            /(?:https?:\/\/github\.com\/)?([^/\s]+)\/([^/\s]+?)(?:\.git|\/)?$/i
        );
    if (!m) throw new Error("repo tidak valid");
    const owner = m[1];
    const repo = m[2];
    return [
        `https://codeload.github.com/${owner}/${repo}/zip/${branch}`,
        `${owner}/${repo}`
    ];
}

/* ── download zip ke file ─────────────────────────────────────── */
async function downloadZip(repo, branch = "main", dest = "./tmp") {
    const [zipUrl, slug] = getZipUrl(repo, branch);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const filePath = path.join(dest, `${slug.replace("/", "-")}-${branch}.zip`);
    const res = await axios.get(zipUrl, { responseType: "stream" }).catch(e => {
        throw new Error("repo / branch tidak ditemukan");
    });

    const size = +res.headers["content-length"] || 0;
    await streamPipeline(res.data, fs.createWriteStream(filePath));
    return { filePath, size, slug, branch };
}

module.exports = { getZipUrl, downloadZip };
