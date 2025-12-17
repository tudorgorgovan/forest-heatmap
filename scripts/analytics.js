(function () {
    // logica pentru calculul sporului de lucru
    const contextCard = document.getElementById("context-analysis-card");
    const contextContainer = document.getElementById("context-results");
    const emptyState = document.getElementById("empty-state");

    try {
        const storedCompanies = localStorage.getItem("zebra_context_companies");
        if (storedCompanies && contextCard && contextContainer) {
            const companies = JSON.parse(storedCompanies);

            if (companies.length > 0) {
                // ascunde empty state, arata analiza
                if (emptyState) emptyState.style.display = "none";
                contextCard.style.display = "block";

                const items = companies.map(company => {
                    // calcul scor performanta bazat pe volum si numar transporturi
                    const transportCount = company.transport_count || 0;
                    const volume = Math.round(company.total_volume || 0);

                    // scor 0-100%, volum mai mare si mai multe transporturi = bonus mai mare
                    const volumeScore = Math.min((volume / 100), 50); // max 50 puncte din volum
                    const transportScore = Math.min((transportCount / 2), 50); // max 50 puncte din transporturi
                    const performanceScore = Math.round(volumeScore + transportScore);

                    // determina nivelul bonusului
                    let bonusTier = "Standard";
                    let bonusMultiplier = 1.0;
                    let tierColor = "#94a3b8"; // gri
                    let tierBg = "rgba(148, 163, 184, 0.1)";
                    let tierIcon = "📊";

                    if (performanceScore >= 80) {
                        bonusTier = "Excelent";
                        bonusMultiplier = 2.5;
                        tierColor = "#10b981"; // verde
                        tierBg = "rgba(16, 185, 129, 0.15)";
                        tierIcon = "🏆";
                    } else if (performanceScore >= 60) {
                        bonusTier = "Foarte Bun";
                        bonusMultiplier = 2.0;
                        tierColor = "#22c55e"; // verde deschis
                        tierBg = "rgba(34, 197, 94, 0.15)";
                        tierIcon = "⭐";
                    } else if (performanceScore >= 40) {
                        bonusTier = "Bun";
                        bonusMultiplier = 1.5;
                        tierColor = "#eab308"; // galben
                        tierBg = "rgba(234, 179, 8, 0.15)";
                        tierIcon = "✓";
                    }

                    const borderColor = `${tierColor}40`; // adauga transparenta
                    const bgColor = tierBg;

                    const companyName = company.name || "Companie Anonima";


                    return '<div class="feature-item" style="border: 1px solid ' + borderColor + '; background: ' + bgColor + '; padding:15px; border-radius:12px;">' +
                        '<div class="feature-info" style="flex:1; margin-bottom:10px;">' +
                        '<span class="feature-name" style="font-size:1rem; font-weight:600;">' + companyName + '</span>' +
                        '<span class="feature-status" style="color:var(--landing-text-secondary); font-weight:400; display:block; margin-top:5px;">' +
                        '<i class="fa-solid fa-truck"></i> ' + transportCount + ' transporturi • ' +
                        '<i class="fa-solid fa-cube"></i> ' + volume + ' m³' +
                        '</span>' +
                        '</div>' +
                        '<div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">' +
                        '<span class="risk-badge-high" style="background:' + tierBg + '; color:' + tierColor + '; padding:8px 14px; border-radius:6px; font-weight:700; font-size:0.85rem;">' +
                        tierIcon + ' ' + bonusTier + ' (' + performanceScore + '%)' +
                        '</span>' +
                        '</div>' +
                        '</div>';
                });

                contextContainer.innerHTML = items.join('');
            } else {
                // arata empty state daca nu sunt companii
                if (emptyState) emptyState.style.display = "block";
                if (contextCard) contextCard.style.display = "none";
            }
        } else {
            // arata empty state daca nu sunt date
            if (emptyState) emptyState.style.display = "block";
            if (contextCard) contextCard.style.display = "none";
        }
    } catch (e) {
        console.error("Eroare la citire date:", e);
        if (emptyState) emptyState.style.display = "block";
        if (contextCard) contextCard.style.display = "none";
    }

})();
