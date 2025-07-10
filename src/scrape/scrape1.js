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

function formatSize(bytes) {
    if (!bytes || isNaN(bytes)) return "Unknown";
    const unit = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    while (bytes >= 1024 && i < unit.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(i ? 2 : 0)} ${unit[i]}`;
}

async function mediafireDl(url) {
    if (!/^https?:\/\/(www\.)?mediafire\.com\//i.test(url))
        throw new Error("URL bukan MediaFire");

    /* 1. ambil HTML halaman */
    const { data: html } = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const $ = cheerio.load(html);

    /* 2. cari direct-link */
    const direct =
        $("#downloadButton").attr("href") ||
        $("#download_link").attr("href") ||
        /(?<=kNO\s*=\s*")[^"]+/.exec(html)?.[0] ||
        /"downloadUrl":"([^"]+)"/.exec(html)?.[1];

    if (!direct) throw new Error("Direct link tidak ditemukan (file dihapus?)");

    /* 3. HEAD ke direct-link untuk ukuran presisi */
    let contentLength = null;
    try {
        const head = await axios.head(direct, { maxRedirects: 5 });
        contentLength = parseInt(head.headers["content-length"]);
    } catch {
        /* biarkan null jika gagal */
    }

    /* 4. nama & tipe file */
    const file_name =
        $(".download_file_title, div.filename").first().text().trim() ||
        path.basename(direct.split("?")[0]);
    const mime_type =
        $('ul.details li:contains("Type")').text().replace(/.*?:/, "").trim() ||
        path.extname(file_name).slice(1) ||
        "unknown";

    return {
        file_name,
        file_size: formatSize(contentLength), // “873 KB” atau “9.12 MB”
        mime_type,
        direct_url: direct
    };
}

async function tiktokDl(url) {
    return new Promise(async (resolve, reject) => {
        try {
            let data = [];
            function formatNumber(integer) {
                let numb = parseInt(integer);
                return Number(numb).toLocaleString().replace(/,/g, ".");
            }

            function formatDate(n, locale = "en") {
                let d = new Date(n);
                return d.toLocaleDateString(locale, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric"
                });
            }

            let domain = "https://www.tikwm.com/api/";
            let res = await (
                await axios.post(
                    domain,
                    {},
                    {
                        headers: {
                            Accept: "application/json, text/javascript, */*; q=0.01",
                            "Accept-Language":
                                "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                            "Content-Type":
                                "application/x-www-form-urlencoded; charset=UTF-8",
                            Origin: "https://www.tikwm.com",
                            Referer: "https://www.tikwm.com/",
                            "Sec-Ch-Ua":
                                '"Not)A;Brand" ;v="24" , "Chromium" ;v="116"',
                            "Sec-Ch-Ua-Mobile": "?1",
                            "Sec-Ch-Ua-Platform": "Android",
                            "Sec-Fetch-Dest": "empty",
                            "Sec-Fetch-Mode": "cors",
                            "Sec-Fetch-Site": "same-origin",
                            "User-Agent":
                                "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
                            "X-Requested-With": "XMLHttpRequest"
                        },
                        params: {
                            url: url,
                            count: 12,
                            cursor: 0,
                            web: 1,
                            hd: 1
                        }
                    }
                )
            ).data.data;
            if (res?.duration == 0) {
                res.images.map(v => {
                    data.push({ type: "photo", url: v });
                });
            } else {
                data.push(
                    {
                        type: "watermark",
                        url:
                            "https://www.tikwm.com" + res?.wmplay ||
                            "/undefined"
                    },
                    {
                        type: "nowatermark",
                        url: "https://www.tikwm.com" + res?.play || "/undefined"
                    },
                    {
                        type: "nowatermark_hd",
                        url:
                            "https://www.tikwm.com" + res?.hdplay ||
                            "/undefined"
                    }
                );
            }
            let json = {
                status: true,
                title: res.title,
                taken_at: formatDate(res.create_time).replace("1970", ""),
                region: res.region,
                id: res.id,
                durations: res.duration,
                duration: res.duration + " Seconds",
                cover: "https://www.tikwm.com" + res.cover,
                size_wm: res.wm_size,
                size_nowm: res.size,
                size_nowm_hd: res.hd_size,
                data: data,
                music_info: {
                    id: res.music_info.id,
                    title: res.music_info.title,
                    author: res.music_info.author,
                    album: res.music_info.album ? res.music_info.album : null,
                    url:
                        "https://www.tikwm.com" + res.music ||
                        res.music_info.play
                },
                stats: {
                    views: formatNumber(res.play_count),
                    likes: formatNumber(res.digg_count),
                    comment: formatNumber(res.comment_count),
                    share: formatNumber(res.share_count),
                    download: formatNumber(res.download_count)
                },
                author: {
                    id: res.author.id,
                    fullname: res.author.unique_id,
                    nickname: res.author.nickname,
                    avatar: "https://www.tikwm.com" + res.author.avatar
                }
            };
            resolve(json);
        } catch (e) {}
    });
}

module.exports = { getZipUrl, downloadZip, mediafireDl, tiktokDl };
