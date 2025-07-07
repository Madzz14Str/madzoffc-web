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
            const json = await fetch("/src/settings.json");
            if (!json.ok) throw new Error(json.status);
            const data = await json.json();
            console.log(data)

            document.getElementById("namapi").textContent = data.name ?? 'Madoppc';
            document.getElementById("versiapi").textContent = data.version;
            document.getElementById("statusapi").textContent = data.header.status;
        } catch (error) {
            console.error(error);
        }
    })();
});
