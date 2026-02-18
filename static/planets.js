/**
 * AMAS — Planets Page
 * Visualização dos planetas do sistema solar
 */

let selectedLat = -25.9692;
let selectedLon = 32.5732;
let planetsData = null;
let domeCanvas, domeCtx;

document.addEventListener("DOMContentLoaded", () => {
    initDome();
    loadProvinces();
    fetchPlanets();
    fetchProvincesOverview();
    setInterval(fetchPlanets, 30000);
    setInterval(fetchProvincesOverview, 30000);
});

// ========================
// PROVINCE SELECTOR
// ========================
async function loadProvinces() {
    const res = await fetch("/api/provinces");
    const provinces = await res.json();
    const select = document.getElementById("planet-province-select");
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

    select.addEventListener("change", () => {
        const opt = select.selectedOptions[0];
        selectedLat = parseFloat(opt.dataset.lat);
        selectedLon = parseFloat(opt.dataset.lon);
        fetchPlanets();
    });
}

// ========================
// FETCH DATA
// ========================
async function fetchPlanets() {
    try {
        const res = await fetch(`/api/planets/positions?lat=${selectedLat}&lon=${selectedLon}`);
        const data = await res.json();
        planetsData = data;
        drawDome(data);
        renderCards(data);
    } catch (err) {
        console.error("Erro:", err);
    }
}

async function fetchProvincesOverview() {
    try {
        const res = await fetch("/api/planets/all-provinces");
        const data = await res.json();
        renderProvincesTable(data);
    } catch (err) {
        console.error("Erro:", err);
    }
}

// ========================
// SKY DOME (Polar projection)
// ========================
function initDome() {
    domeCanvas = document.getElementById("skyDome");
    if (!domeCanvas) return;
    domeCtx = domeCanvas.getContext("2d");

    const resize = () => {
        const container = domeCanvas.parentElement;
        const size = Math.min(container.clientWidth - 48, 520);
        const dpr = window.devicePixelRatio || 1;
        domeCanvas.width = size * dpr;
        domeCanvas.height = size * dpr;
        domeCanvas.style.width = size + "px";
        domeCanvas.style.height = size + "px";
        domeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (planetsData) drawDome(planetsData);
    };
    resize();
    window.addEventListener("resize", resize);
}

function drawDome(data) {
    if (!domeCtx) return;
    const ctx = domeCtx;
    const size = parseFloat(domeCanvas.style.width);
    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 - 40;

    ctx.clearRect(0, 0, size, size);

    // Background
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R + 30);
    bgGrad.addColorStop(0, "#0b1628");
    bgGrad.addColorStop(0.7, "#0f1f3d");
    bgGrad.addColorStop(1, "#111827");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // Stars
    for (let i = 0; i < 80; i++) {
        const a = (i * 137.508) * Math.PI / 180;
        const r = Math.sqrt(i / 80) * (R + 20);
        const sx = cx + Math.cos(a) * r;
        const sy = cy + Math.sin(a) * r;
        ctx.beginPath();
        ctx.arc(sx, sy, (i % 4 === 0) ? 1.2 : 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.1 + (i % 5) * 0.08})`;
        ctx.fill();
    }

    // Altitude circles
    ctx.strokeStyle = "rgba(99, 102, 241, 0.12)";
    ctx.lineWidth = 1;
    [0, 30, 60].forEach((alt) => {
        const r = R * (1 - alt / 90);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.setLineDash(alt === 0 ? [] : [4, 4]);
        ctx.stroke();
    });
    ctx.setLineDash([]);

    // Horizon circle (bold)
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Altitude labels
    ctx.font = "10px 'Space Grotesk', monospace";
    ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
    ctx.textAlign = "left";
    ctx.fillText("90° (Zénite)", cx + 4, cy + 12);
    ctx.fillText("60°", cx + R * (1 - 60 / 90) + 4, cy + 12);
    ctx.fillText("30°", cx + R * (1 - 30 / 90) + 4, cy + 12);
    ctx.fillText("0° Horizonte", cx + R + 4, cy + 4);

    // Cardinal directions
    ctx.font = "bold 14px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cardinals = [
        { label: "N", angle: -90 },
        { label: "E", angle: 0 },
        { label: "S", angle: 90 },
        { label: "W", angle: 180 },
    ];
    cardinals.forEach((c) => {
        const a = c.angle * Math.PI / 180;
        const x = cx + Math.cos(a) * (R + 22);
        const y = cy + Math.sin(a) * (R + 22);
        ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
        ctx.fillText(c.label, x, y);
    });

    // Cross lines
    ctx.beginPath();
    ctx.moveTo(cx - R, cy);
    ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R);
    ctx.lineTo(cx, cy + R);
    ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw planets
    ctx.textBaseline = "alphabetic";
    data.planets.forEach((p) => {
        const alt = p.altitude;
        const az = p.azimuth;

        // Polar projection: distance from center = (90 - alt) / 90 * R
        const r = Math.max(0, (90 - alt) / 90) * R;
        // Azimuth: 0=N (up), 90=E (right), etc. Convert to canvas angle
        const angle = (az - 90) * Math.PI / 180;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;

        const isAbove = alt > 0;
        const bodyR = isAbove ? 8 : 5;

        // Only draw if within or near dome
        if (r > R + 30) return;

        // Glow
        if (isAbove) {
            const glow = ctx.createRadialGradient(px, py, 0, px, py, 25);
            glow.addColorStop(0, p.color + "40");
            glow.addColorStop(1, "transparent");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(px, py, 25, 0, Math.PI * 2);
            ctx.fill();
        }

        // Body
        ctx.beginPath();
        ctx.arc(px, py, bodyR, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = isAbove ? 1 : 0.3;
        ctx.fill();

        // Ring
        ctx.beginPath();
        ctx.arc(px, py, bodyR + 2, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Label
        ctx.font = "bold 11px 'Space Grotesk', sans-serif";
        ctx.fillStyle = p.color;
        ctx.globalAlpha = isAbove ? 1 : 0.4;
        ctx.textAlign = "center";
        ctx.fillText(p.name, px, py - bodyR - 6);
        ctx.globalAlpha = 1;
    });

    // Legend box
    const legX = 8;
    const legY = size - 40;
    ctx.fillStyle = "rgba(10, 14, 26, 0.7)";
    ctx.fillRect(legX, legY, 200, 32);
    ctx.font = "10px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(legX + 10, legY + 16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText("Visível", legX + 20, legY + 20);
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.arc(legX + 80, legY + 16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#64748b";
    ctx.fillText("Abaixo horizonte", legX + 90, legY + 20);
}

// ========================
// PLANET CARDS
// ========================
function renderCards(data) {
    const grid = document.getElementById("planets-grid");
    if (!grid) return;
    grid.innerHTML = "";

    data.planets.forEach((p) => {
        const card = document.createElement("div");
        card.className = "planet-card" + (p.above_horizon ? "" : " below-horizon");
        card.style.setProperty("--planet-color", p.color);

        // Build status message
        let statusMsg = "";
        if (p.above_horizon) {
            if (p.set !== "--:--") {
                statusMsg = `Visível agora — pôr às ${p.set}`;
            } else {
                statusMsg = "Visível agora (não se põe hoje)";
            }
        } else {
            if (p.rise !== "--:--") {
                statusMsg = `Abaixo do horizonte — nasce às ${p.rise}`;
            } else if (p.set !== "--:--") {
                statusMsg = `Abaixo do horizonte — já se pôs às ${p.set}`;
            } else {
                statusMsg = "Não visível hoje";
            }
        }

        // Duration info
        const durationText = p.visible_duration || "--";

        // Visibility period
        let periodHtml = "";
        if (p.rise !== "--:--" || p.set !== "--:--") {
            const riseLabel = p.rise !== "--:--" ? `▲ Nasce: ${p.rise}` : (p.up_at_midnight ? "▲ Já estava acima" : "");
            const setLabel = p.set !== "--:--" ? `▼ Põe-se: ${p.set}` : "▼ Não se põe hoje";

            periodHtml = `
                <div class="planet-period">
                    <div class="period-bar">
                        <div class="period-label rise-label">${riseLabel}</div>
                        <div class="period-track">
                            <div class="period-fill" style="background:${p.color}"></div>
                        </div>
                        <div class="period-label set-label">${setLabel}</div>
                    </div>
                    <div class="period-text">Tempo visível hoje: <strong>${durationText}</strong></div>
                </div>
            `;
        } else if (p.up_at_midnight) {
            periodHtml = `
                <div class="planet-period">
                    <div class="period-text">Visível durante todo o dia: <strong>~24h</strong></div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="planet-card-header">
                <div class="planet-icon" style="background:${p.color}20; border-color:${p.color}; color:${p.color};">
                    ${p.symbol}
                </div>
                <div>
                    <div class="planet-name" style="color:${p.color}">${p.name}</div>
                    <div class="planet-desc">${p.description}</div>
                </div>
            </div>
            <div class="planet-visibility-badge ${p.above_horizon ? 'visible' : 'not-visible'}">
                ${p.above_horizon ? '●' : '○'} ${statusMsg}
            </div>
            ${periodHtml}
            <div class="planet-data-grid">
                <div class="planet-data-item">
                    <span class="pd-label">Altitude actual</span>
                    <span class="pd-value">${p.altitude.toFixed(2)}°</span>
                </div>
                <div class="planet-data-item">
                    <span class="pd-label">Azimute actual</span>
                    <span class="pd-value">${p.azimuth.toFixed(1)}° ${p.cardinal}</span>
                </div>
                <div class="planet-data-item">
                    <span class="pd-label">Nascer (hoje)</span>
                    <span class="pd-value rise-time">${p.rise}</span>
                </div>
                <div class="planet-data-item">
                    <span class="pd-label">Pôr (hoje)</span>
                    <span class="pd-value set-time">${p.set}</span>
                </div>
                <div class="planet-data-item full-width">
                    <span class="pd-label">Tempo visível hoje</span>
                    <span class="pd-value duration-time">${durationText}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ========================
// PROVINCES TABLE
// ========================
function renderProvincesTable(data) {
    const tbody = document.getElementById("prov-planets-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const planetIds = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"];

    Object.entries(data.provinces).forEach(([name, prov]) => {
        const tr = document.createElement("tr");
        let cells = `<td>${name}</td>`;

        planetIds.forEach((pid) => {
            const planet = prov.planets.find((p) => p.id === pid);
            if (planet) {
                const dotClass = planet.above_horizon ? "up" : "down";
                const altText = `${planet.altitude > 0 ? "+" : ""}${planet.altitude.toFixed(1)}°`;
                const title = `${planet.name}: ${altText} ${planet.cardinal}`;
                cells += `<td>
                    <span class="visibility-dot ${dotClass}" title="${title}"></span>
                    <span class="alt-text ${dotClass}">${altText}</span>
                </td>`;
            } else {
                cells += `<td>-</td>`;
            }
        });

        tr.innerHTML = cells;
        tbody.appendChild(tr);
    });
}
