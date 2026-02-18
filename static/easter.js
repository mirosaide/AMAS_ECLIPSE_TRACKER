/* ===== EASTER PAGE JS ===== */

const API = '/api/easter';

const DATE_LABELS = {
    quarta_cinzas:  'Quarta de Cinzas',
    domingo_ramos:  'Domingo de Ramos',
    quinta_santa:   'Quinta Santa',
    sexta_santa:    'Sexta Santa',
    pascoa:         'Páscoa',
    ascensao:       'Ascensão',
};

const TABLE_KEYS = [
    'quarta_cinzas', 'domingo_ramos',
    'quinta_santa', 'sexta_santa',
    'pascoa', 'ascensao',
];

const CARD_KEYS = [
    'quarta_cinzas', 'domingo_ramos',
    'quinta_santa', 'sexta_santa',
    'pascoa', 'ascensao',
];

const currentYear = new Date().getFullYear();

function shortDate(isoStr) {
    const d = new Date(isoStr + 'T00:00:00');
    const day = d.getDate();
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${day} ${months[d.getMonth()]}`;
}

async function fetchData() {
    const startYear = parseInt(document.getElementById('start-year').value) || 2026;
    const numYears  = parseInt(document.getElementById('num-years').value) || 10;
    try {
        const resp = await fetch(`${API}?start_year=${startYear}&num_years=${numYears}`);
        const data = await resp.json();
        renderTimeline(data);
        renderTable(data);
    } catch (err) {
        document.getElementById('timeline-container').innerHTML =
            '<p class="loading-text">Erro ao carregar dados.</p>';
    }
}

function renderTimeline(data) {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';

    data.forEach(item => {
        const isCurrent = item.year === currentYear;
        const card = document.createElement('div');
        card.className = 'timeline-card' + (isCurrent ? ' current-year' : '');

        let datesHtml = '';
        CARD_KEYS.forEach(key => {
            const d = item.dates[key];
            const isEaster = key === 'pascoa';
            datesHtml += `
                <div class="related-date${isEaster ? ' highlight' : ''}">
                    <span class="date-name">${DATE_LABELS[key]}</span>
                    <span class="date-value">${shortDate(d.date)}</span>
                </div>`;
        });

        card.innerHTML = `
            <span class="year-badge">${item.year}</span>
            <div class="easter-date">${item.easter_formatted}</div>
            <div class="related-dates">${datesHtml}</div>
        `;
        container.appendChild(card);
    });
}

function renderTable(data) {
    const tbody = document.getElementById('easter-tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const isCurrent = item.year === currentYear;
        const tr = document.createElement('tr');
        if (isCurrent) tr.className = 'current-year';

        let cells = `<td class="year-col">${item.year}</td>`;
        TABLE_KEYS.forEach(key => {
            const d = item.dates[key];
            const cls = key === 'pascoa' ? 'easter-col' : '';
            cells += `<td class="${cls}">${shortDate(d.date)}<br><small style="opacity:.6">${d.weekday}</small></td>`;
        });

        tr.innerHTML = cells;
        tbody.appendChild(tr);
    });
}

document.getElementById('btn-load').addEventListener('click', fetchData);
document.getElementById('start-year').addEventListener('keydown', e => { if (e.key === 'Enter') fetchData(); });
document.getElementById('num-years').addEventListener('keydown', e => { if (e.key === 'Enter') fetchData(); });

fetchData();
