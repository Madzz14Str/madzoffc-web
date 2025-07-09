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

            const container = document.getElementById("docapi");
            data.categories.forEach(category => {
                const kelompokApi = document.createElement("h2");
                kelompokApi.textContent = category.name;
                container.appendChild(kelompokApi);
                category.items.forEach(api => {
                    const apii = document.createElement("h3");
                    apii.textContent = api.name;
                    container.appendChild(apii);
                });
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
