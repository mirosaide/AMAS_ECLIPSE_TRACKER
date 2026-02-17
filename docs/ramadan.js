/**
 * AMAS — Ramadão Page
 * Horários de jejum para Moçambique
 */

const API_BASE = window.API_BASE || ""; // set to backend base URL when deployed

document.addEventListener("DOMContentLoaded", () => {
    loadProvinceSelectors();
    loadTodayData();
});

// ========================
// PROVINCE SELECTORS
// ========================
async function loadProvinceSelectors() {
    const res = await fetch(`${API_BASE}/api/provinces`);
    const provinces = await res.json();

    const selects = [
        document.getElementById("ram-province-select"),
        document.getElementById("ram-district-province"),
    ];

    selects.forEach((select) => {
        if (!select) return;
        select.innerHTML = "";
        provinces.forEach((p) => {
            const opt = document.createElement("option");
            opt.value = p.name;
            opt.textContent = p.name;
            opt.dataset.lat = p.lat;
            opt.dataset.lon = p.lon;
            select.appendChild(opt);
        });
    });

    // Auto-load month for first province
    const monthSelect = document.getElementById("ram-province-select");
    if (monthSelect) {
        monthSelect.addEventListener("change", () => loadMonthData());
        loadMonthData();
    }
}

// ========================
// TODAY — ALL PROVINCES
// ========================
async function loadTodayData() {
    const tbody = document.getElementById("today-tbody");
    const dateEl = document.getElementById("today-date");
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/api/ramadan/today`);
        const data = await res.json();

        const today = new Date();
        const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        if (dateEl) dateEl.textContent = today.toLocaleDateString("pt-MZ", opts);

        tbody.innerHTML = "";

        Object.entries(data).forEach(([name, d]) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="col-province">${name}</td>
                <td class="fajr-cell">${d.fajr}</td>
                <td class="sunrise-cell">${d.sunrise}</td>
                <td class="sunset-cell">${d.sunset}</td>
                <td class="isha-cell">${d.isha}</td>
                <td class="moonrise-cell">${d.moonrise}</td>
                <td class="moonset-cell">${d.moonset}</td>
                <td class="fast-cell">${d.fast_duration}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:var(--accent-eclipse);padding:1rem;">Erro ao carregar dados: ${err.message}</td></tr>`;
    }
}

// ========================
// MONTH CALENDAR
// ========================
async function loadMonthData() {
    const select = document.getElementById("ram-province-select");
    const tbody = document.getElementById("month-tbody");
    if (!select || !tbody) return;

    const opt = select.selectedOptions[0];
    if (!opt) return;

    const lat = opt.dataset.lat;
    const lon = opt.dataset.lon;

    tbody.innerHTML = `
        <tr><td colspan="10" style="text-align:center;padding:2rem;">
            <div class="loading-spinner"></div>
            <p style="margin-top:0.5rem;color:var(--text-muted);">A calcular horários para ${opt.textContent}... (pode demorar ~30s)</p>
        </td></tr>
    `;

    try {
        const res = await fetch(`${API_BASE}/api/ramadan/month?lat=${lat}&lon=${lon}`);
        const days = await res.json();

        const today = new Date().toISOString().split("T")[0];
        tbody.innerHTML = "";

        days.forEach((d) => {
            const tr = document.createElement("tr");

            if (d.date === today) tr.classList.add("today-row");
            if (d.day_of_week === "Sexta") tr.classList.add("friday-row");

            const weekdayClass = d.day_of_week === "Sexta" ? "weekday-cell sexta" : "weekday-cell";

            tr.innerHTML = `
                <td class="day-cell">${d.ramadan_day || "-"}</td>
                <td class="date-cell">${formatDate(d.date)}</td>
                <td class="${weekdayClass}">${d.day_of_week}</td>
                <td class="fajr-cell">${d.fajr}</td>
                <td class="sunrise-cell">${d.sunrise}</td>
                <td class="sunset-cell">${d.sunset}</td>
                <td class="isha-cell">${d.isha}</td>
                <td class="moonrise-cell">${d.moonrise}</td>
                <td class="moonset-cell">${d.moonset}</td>
                <td class="fast-cell">${d.fast_duration}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="10" style="color:var(--accent-eclipse);padding:1rem;">Erro: ${err.message}</td></tr>`;
    }
}

// ========================
// DISTRICTS
// ========================
async function loadDistrictData() {
    const select = document.getElementById("ram-district-province");
    const wrapper = document.getElementById("district-table-wrapper");
    const btn = document.getElementById("btn-load-districts");
    if (!select || !wrapper) return;

    const province = select.value;
    btn.disabled = true;
    btn.textContent = "A calcular...";

    wrapper.innerHTML = `
        <div style="text-align:center;padding:2rem;">
            <div class="loading-spinner"></div>
            <p style="margin-top:0.5rem;color:var(--text-muted);">A calcular horários para distritos de ${province}...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE}/api/ramadan/province/${encodeURIComponent(province)}`);
        const data = await res.json();

        if (data.error) {
            wrapper.innerHTML = `<p style="color:var(--accent-eclipse);padding:1rem;">${data.error}</p>`;
            return;
        }

        let html = `<table class="ramadan-table">
            <thead>
                <tr>
                    <th class="col-province">Distrito</th>
                    <th>Fajr<br><small>(Suhoor)</small></th>
                    <th>Nascer Sol</th>
                    <th>Pôr do Sol<br><small>(Iftar)</small></th>
                    <th>Isha</th>
                    <th>Nascer Lua</th>
                    <th>Pôr Lua</th>
                    <th>Jejum</th>
                </tr>
            </thead>
            <tbody>`;

        Object.entries(data.districts).forEach(([name, d]) => {
            html += `
                <tr>
                    <td class="col-province">${name}</td>
                    <td class="fajr-cell">${d.fajr}</td>
                    <td class="sunrise-cell">${d.sunrise}</td>
                    <td class="sunset-cell">${d.sunset}</td>
                    <td class="isha-cell">${d.isha}</td>
                    <td class="moonrise-cell">${d.moonrise}</td>
                    <td class="moonset-cell">${d.moonset}</td>
                    <td class="fast-cell">${d.fast_duration}</td>
                </tr>
            `;
        });

        html += "</tbody></table>";
        wrapper.innerHTML = html;
    } catch (err) {
        wrapper.innerHTML = `<p style="color:var(--accent-eclipse);padding:1rem;">Erro: ${err.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.textContent = "Ver Distritos";
    }
}

// ========================
// HELPERS
// ========================
function formatDate(dateStr) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}`;
}
