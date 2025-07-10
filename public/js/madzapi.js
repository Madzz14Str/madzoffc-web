document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    const navMenu = document.getElementById("navMenu");

    if (hamburger && navMenu) {
        const closeMenu = () => {
            hamburger.classList.remove("open");
            navMenu.classList.remove("active");
            hamburger.setAttribute("aria-expanded", "false");
        };

        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("open");
            navMenu.classList.toggle("active");
            const expanded = hamburger.classList.contains("open");
            hamburger.setAttribute("aria-expanded", expanded.toString());
        });

        navMenu
            .querySelectorAll("a")
            .forEach(link => link.addEventListener("click", closeMenu));
    }

    const toggle = document.getElementById("themeToggle");
    if (toggle) {
        const saved = localStorage.getItem("theme");
        if (saved === "dark") {
            document.body.classList.add("dark-mode");
            toggle.checked = true;
        }

        toggle.addEventListener("change", () => {
            const isDark = toggle.checked;
            document.body.classList.toggle("dark-mode", isDark);
            localStorage.setItem("theme", isDark ? "dark" : "light");
        });
    }

    const renderApis = (data, filter = "") => {
        const container = document.getElementById("docapi");
        container.innerHTML = "";

        data.categories.forEach(category => {
            const matchedItems = category.items.filter(api => {
                const text = `${api.name} ${api.desc}`.toLowerCase();
                return text.includes(filter.toLowerCase());
            });

            if (matchedItems.length > 0) {
                const kelompokApi = document.createElement("h2");
                kelompokApi.textContent = category.name;
                container.appendChild(kelompokApi);

                matchedItems.forEach(api => {
                    const wrap = document.createElement("div");
                    wrap.className = "api-item";

                    wrap.innerHTML = `
                    <strong>${api.name}</strong> – <span class= "api-status ${api.status === "online" ? "online" : "down"}">${api.status}</span>
                    <br>
                    <code>${api.desc}</code>
                `;

                    const btn = document.createElement("button");
                    btn.textContent = "TRY";
                    btn.className = "btn-test";
                    btn.addEventListener("click", () => {
                        navigator.clipboard.writeText(api.path);
                        alert(`Endpoint disalin:\n${api.path}`);
                    });

                    wrap.appendChild(btn);
                    container.appendChild(wrap);
                });
            }
        });
    };

    (async () => {
        try {
            const reqq = await fetch("/metrics/countapirequest");
            if (!reqq.ok) throw new Error(reqq.status);
            const datareq = await reqq.json();
            document.getElementById("dayreq").textContent = datareq.today;
            document.getElementById("monthreq").textContent = datareq.thisMonth;

            const litency = await fetch("/metrics/latency");
            if (!litency.ok) throw new Error(litency.status);
            const jsonn = await litency.json();
            const datak = jsonn.__overall ?? 0;
            const sec = (datak / 1000).toFixed(2);
            document.getElementById(
                "latency"
            ).textContent = `${sec}s ${datak}ms`;

            const json = await fetch("/src/settings.json");
            if (!json.ok) throw new Error(json.status);
            const data = await json.json();

            renderApis(data);

            const searchInput = document.getElementById("searchApi");
            searchInput.addEventListener("input", () => {
                const keyword = searchInput.value.trim();
                renderApis(data, keyword);
            });

            document.getElementById("namapi").textContent = data.name;
            document.getElementById("versiapi").textContent = data.version;
            document.getElementById("statusapi").textContent =
                data.header.status;
            document.getElementById("dev").textContent =
                data.apiSettings.creator;
        } catch (error) {
            console.error(error);
        }
    })();
});
