(function () {
    const navLinks = [
        { key: "intro", label: "Introducere", href: "index.html" },
        { key: "map", label: "Harta", href: "map.html" },
        { key: "about-analytics", label: "Analiza Avansata", href: "about-analytics.html" }
    ];

    document.addEventListener("DOMContentLoaded", () => {
        const current = document.body.dataset.page || "intro";
        const header = document.createElement("header");
        header.className = "site-header";

        const linksMarkup = navLinks
            .map(
                (link) =>
                    `<a href="${link.href}" class="${link.key === current ? "active" : ""}">${link.label}</a>`
            )
            .join("");

        header.innerHTML = `
            <div class="container header-inner">
                <a class="brand" href="index.html">
                    <img src="assets/Poza_logo.png" alt="Sigla LoveLinux++" />
                    <div class="brand-text">
                        <span class="eyebrow">LoveLinux++</span>
                    </div>
                </a>
                <nav class="nav-links">
                    ${linksMarkup}
                </nav>
            </div>
        `;

        document.body.prepend(header);
    });
})();
