/**
 * AMAS Eclipse Tracker
 * Associação Moçambicana de Astronomia
 * Real-time Sun & Moon position tracker for Mozambique
 */

// ========================
// STATE
// ========================
const state = {
    selectedProvince: "Maputo Cidade",
    selectedDistrict: null,
    currentData: null,
    allProvincesData: null,
    updateInterval: null,
    skyCanvas: null,
    skyCtx: null,
    map: null,
    mapGridLayer: null,
    mapMarkersLayer: null,
};

// ========================
// INITIALIZATION
// ========================
document.addEventListener("DOMContentLoaded", () => {
    initSkyCanvas();
    initEclipseMap();
    loadProvinces();
    updateClock();
    setInterval(updateClock, 1000);
    fetchAndUpdate();
    state.updateInterval = setInterval(fetchAndUpdate, 15000);
});

// ========================
// CLOCK
// ========================
function updateClock() {
    const now = new Date();
    const utc = new Date(now.toUTCString());
    const cat = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const timeEl = document.getElementById("clock-time");
    const dateEl = document.getElementById("clock-date");
    const utcEl = document.getElementById("clock-utc");

    if (timeEl) {
        timeEl.textContent = cat.toISOString().substr(11, 8);
    }
    if (dateEl) {
        const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        dateEl.textContent = now.toLocaleDateString("pt-MZ", opts);
    }
    if (utcEl) {
        utcEl.textContent = `UTC: ${utc.toISOString().substr(11, 8)} | CAT (UTC+2)`;
    }
}

// ========================
// DATA FETCHING
// ========================
async function fetchAndUpdate() {
    try {
        const [positionsRes, allProvRes] = await Promise.all([
            fetchPositions(),
            fetchAllProvinces(),
        ]);

        state.currentData = positionsRes;
        state.allProvincesData = allProvRes;

        updateSkyCanvas(positionsRes);
        updateSkyInfo(positionsRes);
        updateProvincesGrid(allProvRes);
        updateEclipseBanner(allProvRes);
        updateEclipseMap(allProvRes);
    } catch (err) {
        console.error("Erro ao buscar dados:", err);
    }
}

async function fetchPositions() {
    const prov = state.selectedProvince;
    const dist = state.selectedDistrict;

    let lat, lon;
    const provSelect = document.getElementById("province-select");
    const distSelect = document.getElementById("district-select");

    if (dist && distSelect && distSelect.value) {
        const opt = distSelect.selectedOptions[0];
        lat = opt.dataset.lat;
        lon = opt.dataset.lon;
    } else if (provSelect && provSelect.selectedOptions[0]) {
        const opt = provSelect.selectedOptions[0];
        lat = opt.dataset.lat;
        lon = opt.dataset.lon;
    }

    if (!lat || !lon) return null;

    const res = await fetch(`/api/positions?lat=${lat}&lon=${lon}`);
    return res.json();
}

async function fetchAllProvinces() {
    const res = await fetch("/api/all-provinces-positions");
    return res.json();
}

async function fetchProvinceDetails(province) {
    const res = await fetch(`/api/province-details/${encodeURIComponent(province)}`);
    return res.json();
}

// ========================
// PROVINCE/DISTRICT SELECTORS
// ========================
async function loadProvinces() {
    const res = await fetch("/api/provinces");
    const provinces = await res.json();

    const select = document.getElementById("province-select");
    if (!select) return;

    select.innerHTML = "";
    provinces.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.name;
        opt.textContent = p.name;
        opt.dataset.lat = p.lat;
        opt.dataset.lon = p.lon;
        if (p.name === state.selectedProvince) opt.selected = true;
        select.appendChild(opt);
    });

    select.addEventListener("change", () => {
        state.selectedProvince = select.value;
        state.selectedDistrict = null;
        loadDistricts(select.value);
        fetchAndUpdate();
    });

    loadDistricts(state.selectedProvince);
}

async function loadDistricts(province) {
    const res = await fetch(`/api/districts/${encodeURIComponent(province)}`);
    const districts = await res.json();

    const select = document.getElementById("district-select");
    if (!select) return;

    select.innerHTML = '<option value="">-- Todos os Distritos --</option>';
    districts.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.name;
        opt.textContent = d.name;
        opt.dataset.lat = d.lat;
        opt.dataset.lon = d.lon;
        select.appendChild(opt);
    });

    select.addEventListener("change", () => {
        state.selectedDistrict = select.value || null;
        fetchAndUpdate();
    });
}

// ========================
// SKY CANVAS VISUALIZATION
// ========================
function initSkyCanvas() {
    const canvas = document.getElementById("skyCanvas");
    if (!canvas) return;

    state.skyCanvas = canvas;
    state.skyCtx = canvas.getContext("2d");

    const resizeCanvas = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const cssW = rect.width - 48;
        const cssH = Math.max(420, Math.min(500, rect.width * 0.45));
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        canvas.style.width = cssW + "px";
        canvas.style.height = cssH + "px";
        state.skyCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (state.currentData) updateSkyCanvas(state.currentData);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
}

function updateSkyCanvas(data) {
    if (!data || !state.skyCtx) return;

    const ctx = state.skyCtx;
    const w = parseFloat(state.skyCanvas.style.width);
    const h = parseFloat(state.skyCanvas.style.height);

    const MARGIN_LEFT = 70;
    const MARGIN_RIGHT = 30;
    const MARGIN_TOP = 35;
    const MARGIN_BOTTOM = 40;

    const plotW = w - MARGIN_LEFT - MARGIN_RIGHT;
    const plotH = h - MARGIN_TOP - MARGIN_BOTTOM;
    const horizonY = MARGIN_TOP + plotH * 0.5;

    ctx.clearRect(0, 0, w, h);

    // === BACKGROUND: Sky zone (above horizon) ===
    const skyGrad = ctx.createLinearGradient(0, MARGIN_TOP, 0, horizonY);
    skyGrad.addColorStop(0, "#0b1628");
    skyGrad.addColorStop(0.5, "#0f1f3d");
    skyGrad.addColorStop(1, "#162a52");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(MARGIN_LEFT, MARGIN_TOP, plotW, horizonY - MARGIN_TOP);

    // === BACKGROUND: Ground zone (below horizon) ===
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, MARGIN_TOP + plotH);
    groundGrad.addColorStop(0, "#1a1a12");
    groundGrad.addColorStop(0.4, "#151510");
    groundGrad.addColorStop(1, "#0e0e0a");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(MARGIN_LEFT, horizonY, plotW, MARGIN_TOP + plotH - horizonY);

    // === Stars in sky zone ===
    const starSeed = 42;
    for (let i = 0; i < 50; i++) {
        const sx = MARGIN_LEFT + ((starSeed * (i + 1) * 7) % plotW);
        const sy = MARGIN_TOP + ((starSeed * (i + 1) * 13) % (horizonY - MARGIN_TOP - 10));
        const sr = (i % 4 === 0) ? 1.3 : 0.7;
        const alpha = 0.15 + (i % 5) * 0.1;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
    }

    // === ZONE LABELS ===
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.font = "bold 14px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("ACIMA DO HORIZONTE (Visível)", MARGIN_LEFT + plotW / 2, MARGIN_TOP + 22);
    ctx.fillText("ABAIXO DO HORIZONTE (Não Visível)", MARGIN_LEFT + plotW / 2, MARGIN_TOP + plotH - 10);
    ctx.restore();

    // === HORIZON LINE ===
    ctx.beginPath();
    ctx.moveTo(MARGIN_LEFT, horizonY);
    ctx.lineTo(MARGIN_LEFT + plotW, horizonY);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#6366f1";
    ctx.font = "bold 12px 'Space Grotesk', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("HORIZONTE  0°", MARGIN_LEFT + 8, horizonY - 6);

    // === ALTITUDE GRID LINES ===
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 0.8;
    const altitudes = [-60, -30, 30, 60, 90];
    altitudes.forEach((alt) => {
        const y = altToY(alt, horizonY, plotH);
        if (y < MARGIN_TOP || y > MARGIN_TOP + plotH) return;
        ctx.beginPath();
        ctx.moveTo(MARGIN_LEFT, y);
        ctx.lineTo(MARGIN_LEFT + plotW, y);
        ctx.strokeStyle = alt > 0 ? "rgba(99, 130, 200, 0.15)" : "rgba(150, 130, 80, 0.12)";
        ctx.stroke();
    });
    ctx.setLineDash([]);

    // === ALTITUDE AXIS LABELS ===
    ctx.font = "11px 'Space Grotesk', monospace";
    ctx.textAlign = "right";
    const allAlts = [-60, -30, 0, 30, 60, 90];
    allAlts.forEach((alt) => {
        const y = altToY(alt, horizonY, plotH);
        if (y < MARGIN_TOP - 5 || y > MARGIN_TOP + plotH + 5) return;
        ctx.fillStyle = alt === 0 ? "#6366f1" : (alt > 0 ? "rgba(148, 163, 184, 0.5)" : "rgba(148, 140, 120, 0.4)");
        ctx.fillText(`${alt > 0 ? "+" : ""}${alt}°`, MARGIN_LEFT - 8, y + 4);
    });

    // Axis title
    ctx.save();
    ctx.translate(14, MARGIN_TOP + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "10px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
    ctx.fillText("ALTITUDE", 0, 0);
    ctx.restore();

    // === CARDINAL DIRECTIONS (bottom) ===
    ctx.font = "bold 12px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    const cardinals = [
        { label: "N", az: 0 }, { label: "NE", az: 45 },
        { label: "E", az: 90 }, { label: "SE", az: 135 },
        { label: "S", az: 180 }, { label: "SW", az: 225 },
        { label: "W", az: 270 }, { label: "NW", az: 315 },
    ];
    cardinals.forEach((c) => {
        const x = azToX(c.az, MARGIN_LEFT, plotW);
        ctx.fillStyle = (c.label === "N" || c.label === "S" || c.label === "E" || c.label === "W")
            ? "rgba(148, 163, 184, 0.7)" : "rgba(148, 163, 184, 0.35)";
        ctx.fillText(c.label, x, MARGIN_TOP + plotH + 18);

        ctx.beginPath();
        ctx.moveTo(x, MARGIN_TOP + plotH);
        ctx.lineTo(x, MARGIN_TOP + plotH + 4);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    // Axis title
    ctx.font = "10px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
    ctx.fillText("AZIMUTE (Direcção)", MARGIN_LEFT + plotW / 2, MARGIN_TOP + plotH + 34);

    // === PLOT BORDERS ===
    ctx.strokeStyle = "rgba(99, 102, 241, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(MARGIN_LEFT, MARGIN_TOP, plotW, plotH);

    // === Helper: convert alt/az to pixel X,Y ===
    function altToY(alt, hY, pH) {
        return hY - (alt / 90) * (pH / 2);
    }
    function azToX(az, mL, pW) {
        return mL + ((az % 360) / 360) * pW;
    }
    function toXY(alt, az) {
        return {
            x: Math.max(MARGIN_LEFT + 5, Math.min(MARGIN_LEFT + plotW - 5, azToX(az, MARGIN_LEFT, plotW))),
            y: Math.max(MARGIN_TOP + 5, Math.min(MARGIN_TOP + plotH - 5, altToY(alt, horizonY, plotH)))
        };
    }

    // === Compute positions ===
    const sunAlt = data.sun.altitude;
    const sunAz = data.sun.azimuth;
    const sunRaw = toXY(sunAlt, sunAz);
    const sunAbove = sunAlt >= 0;
    const sunR = 18;

    const moonAlt = data.moon.altitude;
    const moonAz = data.moon.azimuth;
    const moonRaw = toXY(moonAlt, moonAz);
    const moonAbove = moonAlt >= 0;
    const moonR = 14;

    // Force minimum visual separation of 70px between centers
    const MIN_SEP = 70;
    let rawDx = moonRaw.x - sunRaw.x;
    let rawDy = moonRaw.y - sunRaw.y;
    let rawDist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

    const sunPos = { x: sunRaw.x, y: sunRaw.y };
    const moonPos = { x: moonRaw.x, y: moonRaw.y };

    if (rawDist < MIN_SEP && rawDist > 0) {
        const pushFactor = (MIN_SEP - rawDist) / 2;
        const normX = rawDx / rawDist;
        const normY = rawDy / rawDist;
        sunPos.x -= normX * pushFactor;
        sunPos.y -= normY * pushFactor;
        moonPos.x += normX * pushFactor;
        moonPos.y += normY * pushFactor;
    } else if (rawDist === 0) {
        sunPos.x -= MIN_SEP / 2;
        moonPos.x += MIN_SEP / 2;
    }

    // Clamp to plot area
    sunPos.x = Math.max(MARGIN_LEFT + sunR + 2, Math.min(MARGIN_LEFT + plotW - sunR - 2, sunPos.x));
    sunPos.y = Math.max(MARGIN_TOP + sunR + 2, Math.min(MARGIN_TOP + plotH - sunR - 2, sunPos.y));
    moonPos.x = Math.max(MARGIN_LEFT + moonR + 2, Math.min(MARGIN_LEFT + plotW - moonR - 2, moonPos.x));
    moonPos.y = Math.max(MARGIN_TOP + moonR + 2, Math.min(MARGIN_TOP + plotH - moonR - 2, moonPos.y));

    // === DATA PANELS on the sides (always visible, clear info) ===
    // Sun info panel — LEFT side
    const panelW = 155;
    const panelH = 80;
    const sunPanelX = MARGIN_LEFT + 8;
    const sunPanelY = MARGIN_TOP + plotH / 2 - panelH - 10;

    ctx.save();
    ctx.globalAlpha = sunAbove ? 0.92 : 0.7;
    ctx.fillStyle = "rgba(10, 14, 26, 0.85)";
    roundRect(ctx, sunPanelX, sunPanelY, panelW, panelH, 10);
    ctx.fill();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.5;
    roundRect(ctx, sunPanelX, sunPanelY, panelW, panelH, 10);
    ctx.stroke();

    // Sun icon in panel
    ctx.beginPath();
    ctx.arc(sunPanelX + 16, sunPanelY + 18, 8, 0, Math.PI * 2);
    const spGrad = ctx.createRadialGradient(sunPanelX + 15, sunPanelY + 17, 1, sunPanelX + 16, sunPanelY + 18, 8);
    spGrad.addColorStop(0, "#fef9c3");
    spGrad.addColorStop(1, "#f59e0b");
    ctx.fillStyle = spGrad;
    ctx.fill();
    for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(sunPanelX + 16 + Math.cos(a) * 10, sunPanelY + 18 + Math.sin(a) * 10);
        ctx.lineTo(sunPanelX + 16 + Math.cos(a) * 14, sunPanelY + 18 + Math.sin(a) * 14);
        ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    ctx.font = "bold 13px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.textAlign = "left";
    ctx.fillText("SOL", sunPanelX + 32, sunPanelY + 22);

    ctx.font = "11px 'Space Grotesk', monospace";
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`Alt:  ${sunAlt >= 0 ? "+" : ""}${sunAlt.toFixed(2)}°`, sunPanelX + 12, sunPanelY + 42);
    ctx.fillText(`Az:   ${sunAz.toFixed(2)}° ${data.sun.cardinal}`, sunPanelX + 12, sunPanelY + 57);
    ctx.font = "10px 'Inter', sans-serif";
    ctx.fillStyle = sunAbove ? "#4ade80" : "#f87171";
    ctx.fillText(sunAbove ? "Acima do horizonte" : "Abaixo do horizonte", sunPanelX + 12, sunPanelY + 72);
    ctx.restore();

    // Moon info panel — RIGHT side
    const moonPanelX = MARGIN_LEFT + plotW - panelW - 8;
    const moonPanelY = MARGIN_TOP + plotH / 2 - panelH - 10;

    ctx.save();
    ctx.globalAlpha = moonAbove ? 0.92 : 0.7;
    ctx.fillStyle = "rgba(10, 14, 26, 0.85)";
    roundRect(ctx, moonPanelX, moonPanelY, panelW, panelH, 10);
    ctx.fill();
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 1.5;
    roundRect(ctx, moonPanelX, moonPanelY, panelW, panelH, 10);
    ctx.stroke();

    // Moon icon in panel
    ctx.beginPath();
    ctx.arc(moonPanelX + 16, moonPanelY + 18, 7, 0, Math.PI * 2);
    const mpGrad = ctx.createRadialGradient(moonPanelX + 15, moonPanelY + 17, 1, moonPanelX + 16, moonPanelY + 18, 7);
    mpGrad.addColorStop(0, "#f1f5f9");
    mpGrad.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = mpGrad;
    ctx.fill();

    ctx.font = "bold 13px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#c4b5fd";
    ctx.textAlign = "left";
    ctx.fillText("LUA", moonPanelX + 32, moonPanelY + 22);

    ctx.font = "11px 'Space Grotesk', monospace";
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`Alt:  ${moonAlt >= 0 ? "+" : ""}${moonAlt.toFixed(2)}°`, moonPanelX + 12, moonPanelY + 42);
    ctx.fillText(`Az:   ${moonAz.toFixed(2)}° ${data.moon.cardinal}`, moonPanelX + 12, moonPanelY + 57);
    ctx.font = "10px 'Inter', sans-serif";
    ctx.fillStyle = moonAbove ? "#4ade80" : "#f87171";
    ctx.fillText(moonAbove ? "Acima do horizonte" : "Abaixo do horizonte", moonPanelX + 12, moonPanelY + 72);
    ctx.restore();

    // === Connector lines from panels to celestial bodies ===
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    // Sun connector
    ctx.beginPath();
    ctx.moveTo(sunPanelX + panelW, sunPanelY + panelH / 2);
    ctx.lineTo(sunPos.x, sunPos.y);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.3)";
    ctx.stroke();
    // Moon connector
    ctx.beginPath();
    ctx.moveTo(moonPanelX, moonPanelY + panelH / 2);
    ctx.lineTo(moonPos.x, moonPos.y);
    ctx.strokeStyle = "rgba(167, 139, 250, 0.3)";
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // === DRAW SUN (body only, no inline label) ===
    const sunGlow = ctx.createRadialGradient(sunPos.x, sunPos.y, 0, sunPos.x, sunPos.y, 60);
    sunGlow.addColorStop(0, sunAbove ? "rgba(251, 191, 36, 0.3)" : "rgba(251, 191, 36, 0.12)");
    sunGlow.addColorStop(1, "transparent");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunPos.x, sunPos.y, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sunPos.x, sunPos.y, sunR, 0, Math.PI * 2);
    const sunGrad = ctx.createRadialGradient(sunPos.x - 4, sunPos.y - 4, 2, sunPos.x, sunPos.y, sunR);
    sunGrad.addColorStop(0, "#fef9c3");
    sunGrad.addColorStop(0.4, "#fbbf24");
    sunGrad.addColorStop(1, "#f59e0b");
    ctx.fillStyle = sunGrad;
    ctx.globalAlpha = sunAbove ? 1 : 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = sunAbove ? "rgba(251, 191, 36, 0.5)" : "rgba(251, 191, 36, 0.2)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(sunPos.x + Math.cos(angle) * (sunR + 4), sunPos.y + Math.sin(angle) * (sunR + 4));
        ctx.lineTo(sunPos.x + Math.cos(angle) * (sunR + 12), sunPos.y + Math.sin(angle) * (sunR + 12));
        ctx.stroke();
    }

    // Highlight ring around sun
    ctx.beginPath();
    ctx.arc(sunPos.x, sunPos.y, sunR + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // "SOL" label above body
    ctx.font = "bold 11px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.textAlign = "center";
    ctx.fillText("SOL", sunPos.x, sunPos.y - sunR - 8);

    // === DRAW MOON (body only, no inline label) ===
    const moonGlow = ctx.createRadialGradient(moonPos.x, moonPos.y, 0, moonPos.x, moonPos.y, 45);
    moonGlow.addColorStop(0, moonAbove ? "rgba(196, 181, 253, 0.25)" : "rgba(196, 181, 253, 0.1)");
    moonGlow.addColorStop(1, "transparent");
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonPos.x, moonPos.y, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(moonPos.x, moonPos.y, moonR, 0, Math.PI * 2);
    const moonGrad = ctx.createRadialGradient(moonPos.x - 3, moonPos.y - 3, 1, moonPos.x, moonPos.y, moonR);
    moonGrad.addColorStop(0, "#f1f5f9");
    moonGrad.addColorStop(0.5, "#c4b5fd");
    moonGrad.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = moonGrad;
    ctx.globalAlpha = moonAbove ? 1 : 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.globalAlpha = moonAbove ? 0.25 : 0.12;
    ctx.fillStyle = "#6d28d9";
    ctx.beginPath(); ctx.arc(moonPos.x - 4, moonPos.y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonPos.x + 5, moonPos.y + 4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonPos.x + 1, moonPos.y + 6, 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Highlight ring around moon
    ctx.beginPath();
    ctx.arc(moonPos.x, moonPos.y, moonR + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(196, 181, 253, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // "LUA" label below body (opposite side from sun)
    ctx.font = "bold 11px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#c4b5fd";
    ctx.textAlign = "center";
    ctx.fillText("LUA", moonPos.x, moonPos.y + moonR + 16);

    // === SEPARATION LINE ===
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(sunPos.x, sunPos.y);
    ctx.lineTo(moonPos.x, moonPos.y);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // === SEPARATION BADGE — centered top ===
    const sepText = `Separação Sol–Lua: ${data.separation.toFixed(2)}°`;
    const eclipseText = data.eclipse.is_eclipse
        ? ` | ECLIPSE ${data.eclipse.type.toUpperCase()} ${(data.eclipse.magnitude * 100).toFixed(1)}%`
        : "";
    const fullSepText = sepText + eclipseText;
    ctx.font = "bold 12px 'Space Grotesk', monospace";
    const sepBadgeW = ctx.measureText(fullSepText).width + 24;
    const sepBadgeX = MARGIN_LEFT + plotW / 2 - sepBadgeW / 2;
    const sepBadgeY = MARGIN_TOP + plotH + 2;

    // Draw below plot area
    ctx.fillStyle = data.eclipse.is_eclipse ? "rgba(239, 68, 68, 0.15)" : "rgba(99, 102, 241, 0.12)";
    roundRect(ctx, sepBadgeX, sepBadgeY - 22, sepBadgeW, 20, 6);
    ctx.fill();
    ctx.strokeStyle = data.eclipse.is_eclipse ? "rgba(239, 68, 68, 0.5)" : "rgba(99, 102, 241, 0.3)";
    ctx.lineWidth = 1;
    roundRect(ctx, sepBadgeX, sepBadgeY - 22, sepBadgeW, 20, 6);
    ctx.stroke();
    ctx.fillStyle = data.eclipse.is_eclipse ? "#ef4444" : "#818cf8";
    ctx.textAlign = "center";
    ctx.fillText(fullSepText, MARGIN_LEFT + plotW / 2, sepBadgeY - 8);

    // === ECLIPSE OVERLAY ===
    if (data.eclipse && data.eclipse.is_eclipse) {
        const eclGlow = ctx.createRadialGradient(sunPos.x, sunPos.y, 0, sunPos.x, sunPos.y, 100);
        eclGlow.addColorStop(0, "rgba(239, 68, 68, 0.35)");
        eclGlow.addColorStop(0.5, "rgba(239, 68, 68, 0.1)");
        eclGlow.addColorStop(1, "transparent");
        ctx.fillStyle = eclGlow;
        ctx.beginPath();
        ctx.arc(sunPos.x, sunPos.y, 100, 0, Math.PI * 2);
        ctx.fill();
    }

    // === NIGHT MESSAGE ===
    if (!sunAbove && !moonAbove) {
        const msgY = horizonY - (plotH * 0.5) / 2;
        ctx.fillStyle = "rgba(10, 14, 26, 0.6)";
        roundRect(ctx, MARGIN_LEFT + plotW / 2 - 175, msgY - 18, 350, 36, 10);
        ctx.fill();
        ctx.font = "13px 'Inter', sans-serif";
        ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
        ctx.textAlign = "center";
        ctx.fillText("Sol e Lua abaixo do horizonte — período nocturno", MARGIN_LEFT + plotW / 2, msgY + 4);
    }
}

// Rounded rectangle helper
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ========================
// SKY INFO BAR
// ========================
function updateSkyInfo(data) {
    if (!data) return;

    setInfoValue("sun-alt", `${data.sun.altitude.toFixed(2)}°`);
    setInfoValue("sun-az", `${data.sun.azimuth.toFixed(2)}° ${data.sun.cardinal}`);
    setInfoValue("moon-alt", `${data.moon.altitude.toFixed(2)}°`);
    setInfoValue("moon-az", `${data.moon.azimuth.toFixed(2)}° ${data.moon.cardinal}`);
    setInfoValue("angular-sep", `${data.separation.toFixed(4)}°`);
    setInfoValue("eclipse-status", data.eclipse.is_eclipse
        ? `${data.eclipse.type} (${(data.eclipse.magnitude * 100).toFixed(1)}%)`
        : "Sem Eclipse"
    );
}

function setInfoValue(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ========================
// PROVINCES GRID
// ========================
function updateProvincesGrid(allData) {
    if (!allData) return;

    const grid = document.getElementById("provinces-grid");
    if (!grid) return;

    grid.innerHTML = "";

    Object.entries(allData).forEach(([name, data]) => {
        const card = document.createElement("div");
        card.className = "province-card" + (data.eclipse?.is_eclipse ? " eclipse-active" : "");
        card.onclick = () => openDistrictModal(name);

        const sunBelowClass = data.sun.above_horizon ? "" : " below-horizon";
        const moonBelowClass = data.moon.above_horizon ? "" : " below-horizon";

        card.innerHTML = `
            <div class="province-card-header">
                <h3>${name}</h3>
                <span class="coords">${data.lat.toFixed(2)}°, ${data.lon.toFixed(2)}°</span>
            </div>
            <div class="province-data">
                <div class="celestial-data sun-data${sunBelowClass}">
                    <div class="body-name"><span class="dot sun"></span> Sol</div>
                    <div class="data-row">
                        <span class="label">Altitude</span>
                        <span class="val">${data.sun.altitude.toFixed(2)}°</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Azimute</span>
                        <span class="val">${data.sun.azimuth.toFixed(1)}° ${data.sun.cardinal}</span>
                    </div>
                </div>
                <div class="celestial-data moon-data${moonBelowClass}">
                    <div class="body-name"><span class="dot moon"></span> Lua</div>
                    <div class="data-row">
                        <span class="label">Altitude</span>
                        <span class="val">${data.moon.altitude.toFixed(2)}°</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Azimute</span>
                        <span class="val">${data.moon.azimuth.toFixed(1)}° ${data.moon.cardinal}</span>
                    </div>
                </div>
                <div class="province-eclipse-status ${data.eclipse?.is_eclipse ? 'eclipse' : 'no-eclipse'}">
                    ${data.eclipse?.is_eclipse
                        ? `&#9673; Eclipse ${data.eclipse.type} — ${(data.eclipse.magnitude * 100).toFixed(1)}%`
                        : `Separação: <span class="separation-badge">${data.separation.toFixed(2)}°</span>`
                    }
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

// ========================
// ECLIPSE BANNER
// ========================
function updateEclipseBanner(allData) {
    const banner = document.getElementById("eclipse-banner");
    if (!banner || !allData) return;

    let eclipseFound = false;
    let eclipseInfo = "";

    Object.entries(allData).forEach(([name, data]) => {
        if (data.eclipse?.is_eclipse) {
            eclipseFound = true;
            eclipseInfo += `${name}: Eclipse ${data.eclipse.type} (${(data.eclipse.magnitude * 100).toFixed(1)}%) | `;
        }
    });

    if (eclipseFound) {
        banner.classList.add("active");
        banner.querySelector("p").textContent = eclipseInfo.slice(0, -3);
    } else {
        banner.classList.remove("active");
    }
}

// ========================
// DISTRICT MODAL
// ========================
async function openDistrictModal(province) {
    const overlay = document.getElementById("modal-overlay");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");

    if (!overlay || !modalBody) return;

    modalTitle.textContent = `Distritos — ${province}`;
    modalBody.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner"></div><p style="margin-top:1rem;color:var(--text-muted)">A carregar dados dos distritos...</p></div>';
    overlay.classList.add("active");

    try {
        const data = await fetchProvinceDetails(province);

        if (data.error) {
            modalBody.innerHTML = `<p style="color:var(--accent-eclipse)">${data.error}</p>`;
            return;
        }

        let html = '<div class="districts-grid">';

        Object.entries(data.districts).forEach(([name, d]) => {
            const sunBelowClass = d.sun.above_horizon ? "" : " below-horizon";
            const moonBelowClass = d.moon.above_horizon ? "" : " below-horizon";

            html += `
                <div class="district-card">
                    <h4>${name}</h4>
                    <div class="mini-data">
                        <div class="item${sunBelowClass}">
                            <span>&#9728; Sol Alt.</span>
                            <span>${d.sun.altitude.toFixed(2)}°</span>
                        </div>
                        <div class="item${sunBelowClass}">
                            <span>&#9728; Sol Az.</span>
                            <span>${d.sun.azimuth.toFixed(1)}° ${d.sun.cardinal}</span>
                        </div>
                        <div class="item${moonBelowClass}">
                            <span>&#9790; Lua Alt.</span>
                            <span>${d.moon.altitude.toFixed(2)}°</span>
                        </div>
                        <div class="item${moonBelowClass}">
                            <span>&#9790; Lua Az.</span>
                            <span>${d.moon.azimuth.toFixed(1)}° ${d.moon.cardinal}</span>
                        </div>
                    </div>
                    <div class="district-sep">
                        ${d.eclipse?.is_eclipse
                            ? `<span class="separation-badge" style="background:var(--accent-eclipse-glow);color:var(--accent-eclipse)">Eclipse ${d.eclipse.type} ${(d.eclipse.magnitude * 100).toFixed(1)}%</span>`
                            : `<span class="separation-badge">Sep: ${d.separation.toFixed(2)}°</span>`
                        }
                    </div>
                </div>
            `;
        });

        html += "</div>";
        modalBody.innerHTML = html;
    } catch (err) {
        modalBody.innerHTML = `<p style="color:var(--accent-eclipse)">Erro ao carregar distritos: ${err.message}</p>`;
    }
}

function closeModal() {
    const overlay = document.getElementById("modal-overlay");
    if (overlay) overlay.classList.remove("active");
}

// ========================
// ECLIPSE MAP (Leaflet)
// ========================
function initEclipseMap() {
    const mapEl = document.getElementById("eclipseMap");
    if (!mapEl || typeof L === "undefined") return;

    state.map = L.map("eclipseMap", {
        center: [-18.5, 35.5],
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
        minZoom: 4,
        maxZoom: 10,
    });

    // Dark tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
    }).addTo(state.map);

    state.mapGridLayer = L.layerGroup().addTo(state.map);
    state.mapMarkersLayer = L.layerGroup().addTo(state.map);

    // Load grid on init
    fetchEclipseGrid();
}

async function fetchEclipseGrid() {
    try {
        const res = await fetch("/api/eclipse-grid?resolution=25");
        const data = await res.json();
        drawEclipseGrid(data);
    } catch (err) {
        console.error("Erro ao carregar grelha do eclipse:", err);
    }
}

function drawEclipseGrid(data) {
    if (!state.mapGridLayer) return;

    state.mapGridLayer.clearLayers();

    const latStep = (data.bounds.lat_max - data.bounds.lat_min) / data.resolution;
    const lonStep = (data.bounds.lon_max - data.bounds.lon_min) / data.resolution;

    data.grid.forEach((pt) => {
        const color = getEclipseColor(pt.separation, pt.sun_visible, pt.is_eclipse);
        const opacity = getEclipseOpacity(pt.separation, pt.sun_visible);

        const bounds = [
            [pt.lat - latStep / 2, pt.lon - lonStep / 2],
            [pt.lat + latStep / 2, pt.lon + lonStep / 2],
        ];

        const rect = L.rectangle(bounds, {
            color: "transparent",
            fillColor: color,
            fillOpacity: opacity,
            weight: 0,
        });

        rect.addTo(state.mapGridLayer);
    });
}

function getEclipseColor(separation, sunVisible, isEclipse) {
    if (!sunVisible) return "#111118";

    if (isEclipse) return "#dc2626";
    if (separation < 1) return "#ef4444";
    if (separation < 2) return "#f97316";
    if (separation < 3) return "#fb923c";
    if (separation < 5) return "#fbbf24";
    if (separation < 8) return "#6366f1";
    return "#3b3f7a";
}

function getEclipseOpacity(separation, sunVisible) {
    if (!sunVisible) return 0.5;
    if (separation < 0.5) return 0.7;
    if (separation < 1) return 0.6;
    if (separation < 2) return 0.5;
    if (separation < 3) return 0.4;
    if (separation < 5) return 0.3;
    if (separation < 8) return 0.2;
    return 0.12;
}

function updateEclipseMap(allProvincesData) {
    if (!state.mapMarkersLayer || !allProvincesData) return;

    state.mapMarkersLayer.clearLayers();

    Object.entries(allProvincesData).forEach(([name, data]) => {
        const isEclipse = data.eclipse?.is_eclipse;
        const sep = data.separation;

        // Province marker (circle marker)
        const markerColor = isEclipse ? "#ef4444" : (sep < 3 ? "#fbbf24" : "#6366f1");
        const markerRadius = isEclipse ? 10 : 7;

        const marker = L.circleMarker([data.lat, data.lon], {
            radius: markerRadius,
            fillColor: markerColor,
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9,
        });

        // Popup
        const popupContent = `
            <div class="province-popup">
                <h3>${name}</h3>
                <div class="popup-data">
                    <span class="label">&#9728; Sol Alt:</span>
                    <span class="val">${data.sun.altitude.toFixed(2)}°</span>
                    <span class="label">&#9728; Sol Az:</span>
                    <span class="val">${data.sun.azimuth.toFixed(1)}° ${data.sun.cardinal}</span>
                    <span class="label">&#9790; Lua Alt:</span>
                    <span class="val">${data.moon.altitude.toFixed(2)}°</span>
                    <span class="label">&#9790; Lua Az:</span>
                    <span class="val">${data.moon.azimuth.toFixed(1)}° ${data.moon.cardinal}</span>
                </div>
                <div class="popup-sep ${isEclipse ? 'eclipse' : 'no-eclipse'}">
                    ${isEclipse
                        ? `Eclipse ${data.eclipse.type} — ${(data.eclipse.magnitude * 100).toFixed(1)}%`
                        : `Separação: ${sep.toFixed(2)}°`
                    }
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280, className: "dark-popup" });

        // Label
        const label = L.tooltip({
            permanent: true,
            direction: "top",
            offset: [0, -10],
            className: "province-label",
        }).setContent(name);

        marker.bindTooltip(label);
        marker.addTo(state.mapMarkersLayer);

        // Pulsing ring for eclipse
        if (isEclipse) {
            const ring = L.circleMarker([data.lat, data.lon], {
                radius: 20,
                fillColor: "transparent",
                color: "#ef4444",
                weight: 2,
                opacity: 0.6,
                dashArray: "4 4",
            });
            ring.addTo(state.mapMarkersLayer);
        }
    });
}

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});
