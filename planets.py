"""
AMAS - Associação Moçambicana de Astronomia
Cálculos de posição dos planetas do sistema solar.
"""

from datetime import datetime, timezone, timedelta
from astropy.coordinates import (
    EarthLocation, AltAz, get_body, solar_system_ephemeris
)
from astropy.time import Time
import astropy.units as u

CAT = timezone(timedelta(hours=2))

PLANETS = [
    {
        "id": "mercury",
        "name": "Mercúrio",
        "symbol": "☿",
        "color": "#b0b0b0",
        "order": 1,
        "description": "O planeta mais pequeno e mais próximo do Sol.",
        "avg_distance_au": 0.39,
    },
    {
        "id": "venus",
        "name": "Vénus",
        "symbol": "♀",
        "color": "#f5deb3",
        "order": 2,
        "description": "A 'Estrela da Manhã/Tarde', o objecto mais brilhante após Sol e Lua.",
        "avg_distance_au": 0.72,
    },
    {
        "id": "mars",
        "name": "Marte",
        "symbol": "♂",
        "color": "#e25822",
        "order": 4,
        "description": "O Planeta Vermelho, visível a olho nu pela sua cor característica.",
        "avg_distance_au": 1.52,
    },
    {
        "id": "jupiter",
        "name": "Júpiter",
        "symbol": "♃",
        "color": "#d4a574",
        "order": 5,
        "description": "O maior planeta do sistema solar, com as suas famosas bandas.",
        "avg_distance_au": 5.20,
    },
    {
        "id": "saturn",
        "name": "Saturno",
        "symbol": "♄",
        "color": "#f4d47c",
        "order": 6,
        "description": "Famoso pelos seus anéis espectaculares, visíveis com telescópio.",
        "avg_distance_au": 9.54,
    },
    {
        "id": "uranus",
        "name": "Úrano",
        "symbol": "⛢",
        "color": "#73c2d4",
        "order": 7,
        "description": "Gigante de gelo, difícil de ver a olho nu.",
        "avg_distance_au": 19.19,
    },
    {
        "id": "neptune",
        "name": "Neptuno",
        "symbol": "♆",
        "color": "#4166f5",
        "order": 8,
        "description": "O planeta mais distante, requer telescópio.",
        "avg_distance_au": 30.07,
    },
]


def _refine_crossing(lat, lon, body_name, dt_before, dt_after, target_alt, direction):
    """Refinamento por bisecção de um cruzamento de altitude."""
    location = EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=0 * u.m)
    low, high = dt_before, dt_after

    for _ in range(14):
        mid = low + (high - low) / 2
        time = Time(mid)
        altaz = AltAz(obstime=time, location=location)
        body = get_body(body_name, time).transform_to(altaz)
        alt = float(body.alt.deg)
        if direction == 'rising':
            low, high = (mid, high) if alt < target_alt else (low, mid)
        else:
            low, high = (mid, high) if alt > target_alt else (low, mid)

    return low + (high - low) / 2


def _find_all_crossings(lat, lon, body_name, local_midnight_utc):
    """
    Encontra TODOS os nascer/pôr de um corpo celeste no dia local (24h a partir de meia-noite CAT).
    Retorna lista de {'type': 'rise'|'set', 'time': datetime_utc}.
    """
    location = EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=0 * u.m)
    target_alt = -0.833
    step = 5  # minutos
    crossings = []
    prev_alt = None

    with solar_system_ephemeris.set('builtin'):
        for minutes in range(0, 24 * 60 + step, step):
            dt = local_midnight_utc + timedelta(minutes=minutes)
            time = Time(dt)
            altaz = AltAz(obstime=time, location=location)
            body = get_body(body_name, time).transform_to(altaz)
            alt = float(body.alt.deg)

            if prev_alt is not None:
                if prev_alt < target_alt <= alt:
                    refined = _refine_crossing(
                        lat, lon, body_name,
                        dt - timedelta(minutes=step), dt,
                        target_alt, 'rising'
                    )
                    crossings.append({"type": "rise", "time": refined})
                elif prev_alt > target_alt >= alt:
                    refined = _refine_crossing(
                        lat, lon, body_name,
                        dt - timedelta(minutes=step), dt,
                        target_alt, 'setting'
                    )
                    crossings.append({"type": "set", "time": refined})
            prev_alt = alt

    return crossings


def _az_to_cardinal(az):
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return dirs[round(az / 22.5) % 16]


def _check_alt_at(lat, lon, body_name, dt):
    """Verifica altitude de um corpo num instante."""
    location = EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=0 * u.m)
    time = Time(dt)
    altaz = AltAz(obstime=time, location=location)
    with solar_system_ephemeris.set('builtin'):
        body = get_body(body_name, time).transform_to(altaz)
    return float(body.alt.deg)


def calculate_planet_positions(lat, lon, dt=None):
    """
    Calcula posições de todos os planetas para uma localização.
    Usa meia-noite CAT como base do dia local.
    """
    if dt is None:
        dt = datetime.now(timezone.utc)

    time = Time(dt)
    location = EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=0 * u.m)
    altaz_frame = AltAz(obstime=time, location=location)

    # Meia-noite local CAT = 22:00 UTC do dia anterior
    now_cat = dt.astimezone(CAT)
    local_midnight_cat = now_cat.replace(hour=0, minute=0, second=0, microsecond=0)
    local_midnight_utc = local_midnight_cat.astimezone(timezone.utc)

    results = []

    with solar_system_ephemeris.set('builtin'):
        for planet in PLANETS:
            body = get_body(planet["id"], time).transform_to(altaz_frame)
            alt = float(body.alt.deg)
            az = float(body.az.deg)

            crossings = _find_all_crossings(lat, lon, planet["id"], local_midnight_utc)

            # Verificar se está acima do horizonte à meia-noite local
            alt_at_midnight = _check_alt_at(lat, lon, planet["id"], local_midnight_utc)
            up_at_midnight = alt_at_midnight > -0.833

            rise_time = None
            set_time = None
            visible_duration = None

            rises = [c for c in crossings if c["type"] == "rise"]
            sets = [c for c in crossings if c["type"] == "set"]

            if rises:
                rise_time = rises[0]["time"]
            if sets:
                set_time = sets[-1]["time"]

            # Calcular duração de visibilidade
            if rise_time and set_time and rise_time < set_time:
                # Caso normal: nasce e depois põe-se
                diff = (set_time - rise_time).total_seconds() / 3600
                visible_duration = diff
            elif up_at_midnight and set_time:
                # Já estava acima à meia-noite, depois põe-se
                diff = (set_time - local_midnight_utc).total_seconds() / 3600
                visible_duration = diff
                if rises:
                    # Tem uma segunda subida depois? (raro mas possível)
                    # Adicionar o tempo da segunda subida ao fim do dia
                    for r in rises:
                        if r["time"] > set_time:
                            end_of_day = local_midnight_utc + timedelta(hours=24)
                            diff2 = (end_of_day - r["time"]).total_seconds() / 3600
                            visible_duration += diff2
                            break
            elif up_at_midnight and not set_time:
                # Está sempre acima do horizonte (improvável em Moçambique mas tratado)
                visible_duration = 24.0
            elif rise_time and not set_time:
                # Nasce e não se põe durante o dia (fica até meia-noite seguinte)
                end_of_day = local_midnight_utc + timedelta(hours=24)
                diff = (end_of_day - rise_time).total_seconds() / 3600
                visible_duration = diff

            # Formatar para CAT
            def fmt_cat(utc_dt):
                if utc_dt is None:
                    return "--:--"
                return utc_dt.astimezone(CAT).strftime("%H:%M")

            def fmt_duration(hours):
                if hours is None:
                    return "--"
                h = int(hours)
                m = int((hours - h) * 60)
                return f"{h}h{m:02d}min"

            results.append({
                **planet,
                "altitude": round(alt, 2),
                "azimuth": round(az, 2),
                "cardinal": _az_to_cardinal(az),
                "above_horizon": alt > 0,
                "visible_naked_eye": alt > 0 and planet["order"] <= 6,
                "rise": fmt_cat(rise_time),
                "set": fmt_cat(set_time),
                "visible_duration": fmt_duration(visible_duration),
                "visible_hours": round(visible_duration, 2) if visible_duration else None,
                "up_at_midnight": up_at_midnight,
                "crossings_count": len(crossings),
            })

    return {
        "timestamp": dt.isoformat(),
        "location": {"lat": lat, "lon": lon},
        "planets": results,
    }


def calculate_all_provinces_planets(locations_dict, dt=None):
    """Calcula posição dos planetas para todas as capitais de província."""
    if dt is None:
        dt = datetime.now(timezone.utc)

    time = Time(dt)
    results = {}

    with solar_system_ephemeris.set('builtin'):
        for province, data in locations_dict.items():
            location = EarthLocation(lat=data["lat"] * u.deg, lon=data["lon"] * u.deg, height=0 * u.m)
            altaz_frame = AltAz(obstime=time, location=location)

            planets_data = []
            for planet in PLANETS:
                body = get_body(planet["id"], time).transform_to(altaz_frame)
                alt = float(body.alt.deg)
                az = float(body.az.deg)
                planets_data.append({
                    "id": planet["id"],
                    "name": planet["name"],
                    "symbol": planet["symbol"],
                    "color": planet["color"],
                    "altitude": round(alt, 2),
                    "azimuth": round(az, 2),
                    "cardinal": _az_to_cardinal(az),
                    "above_horizon": alt > 0,
                })

            results[province] = {
                "lat": data["lat"],
                "lon": data["lon"],
                "planets": planets_data,
            }

    return {"timestamp": dt.isoformat(), "provinces": results}
