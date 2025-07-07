// lib/gitclone.js
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
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

function formatSize (bytes) {
  if (!bytes || isNaN(bytes)) return 'Unknown';
  const unit = ['B','KB','MB','GB','TB'];
  let i = 0;
  while (bytes >= 1024 && i < unit.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(i ? 2 : 0)} ${unit[i]}`;
}

async function mediafireDl (url) {
  if (!/^https?:\/\/(www\.)?mediafire\.com\//i.test(url))
    throw new Error('URL bukan MediaFire');

  /* 1. ambil HTML halaman */
  const { data: html } = await axios.get(url, {
    headers:{ 'User-Agent':'Mozilla/5.0' }
  });
  const $ = cheerio.load(html);

  /* 2. cari direct-link */
  const direct =
      $('#downloadButton').attr('href')
   || $('#download_link').attr('href')
   || /(?<=kNO\s*=\s*")[^"]+/.exec(html)?.[0]
   || /"downloadUrl":"([^"]+)"/.exec(html)?.[1];

  if (!direct) throw new Error('Direct link tidak ditemukan (file dihapus?)');

  /* 3. HEAD ke direct-link untuk ukuran presisi */
  let contentLength = null;
  try {
    const head = await axios.head(direct, { maxRedirects: 5 });
    contentLength = parseInt(head.headers['content-length']);
  } catch {/* biarkan null jika gagal */ }

  /* 4. nama & tipe file */
  const file_name =
        $('.download_file_title, div.filename').first().text().trim()
     || path.basename(direct.split('?')[0]);
  const mime_type =
        $('ul.details li:contains("Type")').text().replace(/.*?:/, '').trim()
     || path.extname(file_name).slice(1) || 'unknown';

  return {
    file_name,
    file_size: formatSize(contentLength), // “873 KB” atau “9.12 MB”
    mime_type,
    direct_url: direct
  };
}

module.exports = { getZipUrl, downloadZip, mediafireDl };
