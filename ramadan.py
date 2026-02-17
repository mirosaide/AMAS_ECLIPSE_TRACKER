"""
AMAS - Associação Moçambicana de Astronomia
Cálculos de nascer/pôr do sol e lua para o mês do Ramadão.
Apoio à comunidade muçulmana de Moçambique.
"""

from datetime import datetime, timezone, timedelta
from astropy.coordinates import EarthLocation, AltAz, get_sun, get_body, solar_system_ephemeris
from astropy.time import Time
import astropy.units as u
import numpy as np

# Timezone CAT (Moçambique UTC+2)
CAT = timezone(timedelta(hours=2))

# Ramadão 1447 AH - datas aproximadas (confirmar com avistamento da lua)
RAMADAN_START = datetime(2026, 2, 18, tzinfo=CAT)
RAMADAN_END = datetime(2026, 3, 19, tzinfo=CAT)
RAMADAN_DAYS = (RAMADAN_END - RAMADAN_START).days + 1


def _find_crossing(lat, lon, body_name, date_utc, target_alt, direction, start_hour=0, end_hour=24):
    """
    Encontra o momento em que um corpo celeste cruza uma altitude alvo.
    direction: 'rising' (altitude a subir) ou 'setting' (altitude a descer)
    Retorna datetime UTC ou None se não encontrar.
    """
    location = EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=0 * u.m)

    base = datetime(date_utc.year, date_utc.month, date_utc.day, tzinfo=timezone.utc)
    step_minutes = 5
    prev_alt = None
    crossing_start = None

    with solar_system_ephemeris.set('builtin'):
        for minutes in range(start_hour * 60, end_hour * 60, step_minutes):
            dt = base + timedelta(minutes=minutes)
            time = Time(dt)
            altaz = AltAz(obstime=time, location=location)

            if body_name == 'sun':
                body = get_sun(time).transform_to(altaz)
            else:
                body = get_body(body_name, time).transform_to(altaz)

            alt = float(body.alt.deg)

            if prev_alt is not None:
                if direction == 'rising' and prev_alt < target_alt <= alt:
                    crossing_start = dt - timedelta(minutes=step_minutes)
                    break
                elif direction == 'setting' and prev_alt > target_alt >= alt:
                    crossing_start = dt - timedelta(minutes=step_minutes)
                    break
            prev_alt = alt

    if crossing_start is None:
        return None

    # Bisection refinement
    low = crossing_start
    high = crossing_start + timedelta(minutes=step_minutes)

    for _ in range(12):
        mid = low + (high - low) / 2
        time = Time(mid)
        altaz = AltAz(obstime=time, location=location)
        if body_name == 'sun':
            body = get_sun(time).transform_to(altaz)
        else:
            body = get_body(body_name, time).transform_to(altaz)
        alt = float(body.alt.deg)

        if direction == 'rising':
            if alt < target_alt:
                low = mid
            else:
                high = mid
        else:
            if alt > target_alt:
                low = mid
            else:
                high = mid

    return low + (high - low) / 2


def calculate_day_times(lat, lon, date_local):
    """
    Calcula os horários islâmicos para um dia numa localização.
    Retorna dicionário com horários em CAT (UTC+2).
    """
    date_utc = datetime(date_local.year, date_local.month, date_local.day, tzinfo=timezone.utc)

    # Fajr: Sol a -18° (crepúsculo astronómico, antes do nascer)
    fajr_utc = _find_crossing(lat, lon, 'sun', date_utc, -18.0, 'rising', 0, 12)

    # Nascer do Sol: Sol a -0.833° (com refracção)
    sunrise_utc = _find_crossing(lat, lon, 'sun', date_utc, -0.833, 'rising', 0, 12)

    # Pôr do Sol (Iftar/Maghrib): Sol a -0.833°
    sunset_utc = _find_crossing(lat, lon, 'sun', date_utc, -0.833, 'setting', 12, 24)

    # Isha: Sol a -18° (após pôr do sol)
    isha_utc = _find_crossing(lat, lon, 'sun', date_utc, -18.0, 'setting', 12, 24)

    # Nascer da Lua
    moonrise_utc = _find_crossing(lat, lon, 'moon', date_utc, -0.833, 'rising', 0, 24)

    # Pôr da Lua
    moonset_utc = _find_crossing(lat, lon, 'moon', date_utc, -0.833, 'setting', 0, 24)

    def to_cat(dt_utc):
        if dt_utc is None:
            return None
        return dt_utc.astimezone(CAT)

    def fmt(dt):
        if dt is None:
            return "--:--"
        return dt.strftime("%H:%M")

    fajr_cat = to_cat(fajr_utc)
    sunrise_cat = to_cat(sunrise_utc)
    sunset_cat = to_cat(sunset_utc)
    isha_cat = to_cat(isha_utc)
    moonrise_cat = to_cat(moonrise_utc)
    moonset_cat = to_cat(moonset_utc)

    # Duração do jejum
    fast_duration = None
    if fajr_cat and sunset_cat:
        diff = sunset_cat - fajr_cat
        hours = diff.total_seconds() / 3600
        fast_duration = f"{int(hours)}h {int((hours % 1) * 60)}min"

    return {
        "date": date_local.strftime("%Y-%m-%d"),
        "day_of_week": _day_name_pt(date_local.weekday()),
        "ramadan_day": (date_local - RAMADAN_START.replace(tzinfo=None)).days + 1
            if date_local.replace(tzinfo=None) >= RAMADAN_START.replace(tzinfo=None) else None,
        "fajr": fmt(fajr_cat),
        "sunrise": fmt(sunrise_cat),
        "sunset": fmt(sunset_cat),
        "isha": fmt(isha_cat),
        "moonrise": fmt(moonrise_cat),
        "moonset": fmt(moonset_cat),
        "fast_duration": fast_duration or "--",
        "fajr_iso": fajr_cat.isoformat() if fajr_cat else None,
        "sunrise_iso": sunrise_cat.isoformat() if sunrise_cat else None,
        "sunset_iso": sunset_cat.isoformat() if sunset_cat else None,
    }


def _day_name_pt(weekday):
    """Retorna o nome do dia em português."""
    names = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
    return names[weekday]


def get_ramadan_month(lat, lon):
    """Calcula todos os dias do Ramadão para uma localização."""
    days = []
    for i in range(RAMADAN_DAYS):
        date = RAMADAN_START.replace(tzinfo=None) + timedelta(days=i)
        day_data = calculate_day_times(lat, lon, date)
        days.append(day_data)
    return days


def get_today_all_provinces(locations_dict):
    """Calcula os horários de hoje para todas as capitais de província."""
    today = datetime.now(CAT).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    results = {}

    for province, data in locations_dict.items():
        results[province] = {
            "lat": data["lat"],
            "lon": data["lon"],
            **calculate_day_times(data["lat"], data["lon"], today),
        }

    return results
