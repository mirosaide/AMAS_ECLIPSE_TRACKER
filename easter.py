"""
AMAS - Associação Moçambicana de Astronomia
Cálculo das datas da Páscoa (algoritmo de Meeus/Jones/Butcher).
A Páscoa é o primeiro domingo após a primeira lua cheia
que ocorre em ou após o equinócio de Março (21 de Março).
"""

from datetime import date, timedelta


def compute_easter(year: int) -> date:
    """
    Calcula a data da Páscoa para um ano (calendário gregoriano).
    Algoritmo anónimo de Meeus, válido para todos os anos gregorianos.
    """
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return date(year, month, day)


def get_related_dates(easter_date: date) -> dict:
    """Retorna datas litúrgicas relacionadas à Páscoa."""
    return {
        "quarta_cinzas": easter_date - timedelta(days=46),
        "domingo_ramos": easter_date - timedelta(days=7),
        "quinta_santa": easter_date - timedelta(days=3),
        "sexta_santa": easter_date - timedelta(days=2),
        "pascoa": easter_date,
        "ascensao": easter_date + timedelta(days=39),
    }


MONTH_NAMES_PT = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

DAY_NAMES_PT = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]


def format_date_pt(d: date) -> str:
    """Formata uma data em português."""
    return f"{d.day} de {MONTH_NAMES_PT[d.month]} de {d.year}"


def get_easter_data(start_year: int, num_years: int = 10) -> list:
    """Retorna dados da Páscoa para vários anos."""
    results = []
    for y in range(start_year, start_year + num_years):
        easter = compute_easter(y)
        related = get_related_dates(easter)

        results.append({
            "year": y,
            "easter": easter.isoformat(),
            "easter_formatted": format_date_pt(easter),
            "dates": {
                name: {
                    "date": d.isoformat(),
                    "formatted": format_date_pt(d),
                    "weekday": DAY_NAMES_PT[d.weekday()],
                }
                for name, d in related.items()
            }
        })

    return results
