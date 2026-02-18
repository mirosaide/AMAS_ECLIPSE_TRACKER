"""
AMAS - Associação Moçambicana de Astronomia
Calculadora de Posição do Sol e da Lua para Moçambique
Para visualização de eclipses em tempo real.
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from datetime import datetime, timezone
from typing import Optional, List
import numpy as np

from astropy.coordinates import (
    EarthLocation, AltAz, get_sun, get_body,
    solar_system_ephemeris
)
from astropy.time import Time
import astropy.units as u

from locations import MOZAMBIQUE_LOCATIONS, get_all_locations, get_provinces, get_districts
from ramadan import (
    get_ramadan_month, get_today_all_provinces, calculate_day_times,
    RAMADAN_START, RAMADAN_END, RAMADAN_DAYS
)
from planets import calculate_planet_positions, calculate_all_provinces_planets, PLANETS
from easter import get_easter_data, compute_easter, get_related_dates, format_date_pt

app = FastAPI(
    title="AMAS Eclipse Tracker",
    description="Rastreador de Eclipse - Associação Moçambicana de Astronomia",
    version="1.0.0",
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# Allow the static site (GitHub Pages) to call the API from another origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def calculate_celestial_positions(lat: float, lon: float, dt: Optional[datetime] = None):
    """
    Calcula as posições do Sol e da Lua para uma localização e momento específicos.
    """
    if dt is None:
        dt = datetime.now(timezone.utc)

    time = Time(dt)
    location = EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=0 * u.m)
    altaz_frame = AltAz(obstime=time, location=location)

    with solar_system_ephemeris.set('builtin'):
        sun = get_sun(time).transform_to(altaz_frame)
        moon = get_body('moon', time).transform_to(altaz_frame)

    sun_alt = float(sun.alt.deg)
    sun_az = float(sun.az.deg)
    moon_alt = float(moon.alt.deg)
    moon_az = float(moon.az.deg)

    angular_separation = float(sun.separation(moon).deg)

    eclipse_magnitude = 0.0
    eclipse_type = "Nenhum"
    sun_angular_radius = 0.2667
    moon_angular_radius = 0.2583

    if angular_separation < (sun_angular_radius + moon_angular_radius):
        eclipse_magnitude = max(0, 1 - (angular_separation / (sun_angular_radius + moon_angular_radius)))
        if angular_separation < abs(sun_angular_radius - moon_angular_radius):
            if moon_angular_radius >= sun_angular_radius:
                eclipse_type = "Total"
            else:
                eclipse_type = "Anular"
            eclipse_magnitude = 1.0
        else:
            eclipse_type = "Parcial"

    return {
        "sun": {
            "altitude": round(sun_alt, 4),
            "azimuth": round(sun_az, 4),
            "above_horizon": sun_alt > 0,
            "altitude_dms": _deg_to_dms(sun_alt),
            "azimuth_dms": _deg_to_dms(sun_az),
            "cardinal": _az_to_cardinal(sun_az),
        },
        "moon": {
            "altitude": round(moon_alt, 4),
            "azimuth": round(moon_az, 4),
            "above_horizon": moon_alt > 0,
            "altitude_dms": _deg_to_dms(moon_alt),
            "azimuth_dms": _deg_to_dms(moon_az),
            "cardinal": _az_to_cardinal(moon_az),
        },
        "separation": round(angular_separation, 4),
        "eclipse": {
            "type": eclipse_type,
            "magnitude": round(eclipse_magnitude, 4),
            "is_eclipse": angular_separation < (sun_angular_radius + moon_angular_radius),
        },
        "timestamp": dt.isoformat(),
    }


def _deg_to_dms(deg: float) -> str:
    """Converte graus decimais para graus, minutos, segundos."""
    sign = "-" if deg < 0 else ""
    deg = abs(deg)
    d = int(deg)
    m = int((deg - d) * 60)
    s = (deg - d - m / 60) * 3600
    return f"{sign}{d}°{m:02d}'{s:05.2f}\""


def _az_to_cardinal(az: float) -> str:
    """Converte azimute em direção cardinal."""
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    idx = round(az / 22.5) % 16
    return dirs[idx]


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve a página principal."""
    return FileResponse("static/index.html")


@app.get("/api/provinces")
async def api_provinces():
    """Retorna a lista de províncias."""
    return get_provinces()


@app.get("/api/districts/{province}")
async def api_districts(province: str):
    """Retorna os distritos de uma província."""
    return get_districts(province)


@app.get("/api/locations")
async def api_locations():
    """Retorna todas as localizações."""
    return get_all_locations()


@app.get("/api/positions")
async def api_positions(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    dt: Optional[str] = Query(None, description="Data/hora ISO 8601 (UTC)")
):
    """Calcula posições do Sol e da Lua para uma localização."""
    target_dt = None
    if dt:
        target_dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
    result = calculate_celestial_positions(lat, lon, target_dt)
    return result


@app.get("/api/all-provinces-positions")
async def api_all_provinces_positions(
    dt: Optional[str] = Query(None, description="Data/hora ISO 8601 (UTC)")
):
    """Calcula posições para todas as províncias de uma vez."""
    target_dt = None
    if dt:
        target_dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))

    results = {}
    for province, data in MOZAMBIQUE_LOCATIONS.items():
        pos = calculate_celestial_positions(data["lat"], data["lon"], target_dt)
        results[province] = {
            "lat": data["lat"],
            "lon": data["lon"],
            **pos,
        }
    return results


@app.get("/api/eclipse-grid")
async def api_eclipse_grid(
    dt: Optional[str] = Query(None, description="Data/hora ISO 8601 (UTC)"),
    resolution: int = Query(20, description="Número de pontos por eixo (max 40)")
):
    """
    Calcula separação Sol-Lua numa grelha de pontos sobre Moçambique e região.
    Retorna dados para desenhar mapa de visibilidade do eclipse.
    """
    resolution = min(resolution, 40)
    target_dt = None
    if dt:
        target_dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
    if target_dt is None:
        target_dt = datetime.now(timezone.utc)

    # Bounding box de Moçambique + margem regional
    lat_min, lat_max = -28.0, -9.0
    lon_min, lon_max = 28.0, 43.0

    lats = np.linspace(lat_min, lat_max, resolution)
    lons = np.linspace(lon_min, lon_max, resolution)

    time = Time(target_dt)
    sun_angular_radius = 0.2667
    moon_angular_radius = 0.2583
    total_radius = sun_angular_radius + moon_angular_radius

    grid_points = []

    with solar_system_ephemeris.set('builtin'):
        sun_icrs = get_sun(time)
        moon_icrs = get_body('moon', time)

        for lat in lats:
            for lon in lons:
                location = EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=0 * u.m)
                altaz_frame = AltAz(obstime=time, location=location)
                sun_aa = sun_icrs.transform_to(altaz_frame)
                moon_aa = moon_icrs.transform_to(altaz_frame)

                sep = float(sun_aa.separation(moon_aa).deg)
                sun_alt = float(sun_aa.alt.deg)

                magnitude = 0.0
                if sep < total_radius:
                    magnitude = max(0, 1 - (sep / total_radius))
                    if sep < abs(sun_angular_radius - moon_angular_radius):
                        magnitude = 1.0

                # Obscurecimento: normalizado 0-1, para colorir o mapa
                # Usamos uma escala mais ampla para mostrar zonas próximas do eclipse
                proximity = max(0, 1 - (sep / 10.0))  # 0-10° range para colorir

                grid_points.append({
                    "lat": round(float(lat), 3),
                    "lon": round(float(lon), 3),
                    "separation": round(sep, 4),
                    "sun_alt": round(sun_alt, 2),
                    "magnitude": round(magnitude, 4),
                    "proximity": round(proximity, 4),
                    "is_eclipse": sep < total_radius,
                    "sun_visible": sun_alt > 0,
                })

    return {
        "timestamp": target_dt.isoformat(),
        "resolution": resolution,
        "bounds": {
            "lat_min": lat_min, "lat_max": lat_max,
            "lon_min": lon_min, "lon_max": lon_max,
        },
        "grid": grid_points,
    }


@app.get("/api/province-details/{province}")
async def api_province_details(
    province: str,
    dt: Optional[str] = Query(None, description="Data/hora ISO 8601 (UTC)")
):
    """Calcula posições para todos os distritos de uma província."""
    if province not in MOZAMBIQUE_LOCATIONS:
        return {"error": "Província não encontrada"}

    target_dt = None
    if dt:
        target_dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))

    data = MOZAMBIQUE_LOCATIONS[province]
    results = {
        "province": province,
        "lat": data["lat"],
        "lon": data["lon"],
        "province_position": calculate_celestial_positions(data["lat"], data["lon"], target_dt),
        "districts": {},
    }

    for distrito, coords in data["distritos"].items():
        results["districts"][distrito] = {
            "lat": coords["lat"],
            "lon": coords["lon"],
            **calculate_celestial_positions(coords["lat"], coords["lon"], target_dt),
        }

    return results


# =============================================
# RAMADÃO ENDPOINTS
# =============================================

@app.get("/ramadan", response_class=HTMLResponse)
async def ramadan_page():
    """Serve a página do Ramadão."""
    return FileResponse("static/ramadan.html")


@app.get("/api/ramadan/info")
async def api_ramadan_info():
    """Retorna informações sobre o período do Ramadão."""
    return {
        "start": RAMADAN_START.strftime("%Y-%m-%d"),
        "end": RAMADAN_END.strftime("%Y-%m-%d"),
        "days": RAMADAN_DAYS,
        "hijri_year": 1447,
    }


@app.get("/api/ramadan/today")
async def api_ramadan_today():
    """Retorna horários de hoje para todas as capitais de província."""
    return get_today_all_provinces(MOZAMBIQUE_LOCATIONS)


@app.get("/api/ramadan/month")
async def api_ramadan_month(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Retorna horários de todo o mês do Ramadão para uma localização."""
    return get_ramadan_month(lat, lon)


@app.get("/api/ramadan/province/{province}")
async def api_ramadan_province(province: str):
    """Retorna horários do Ramadão para todos os distritos de uma província (dia de hoje)."""
    if province not in MOZAMBIQUE_LOCATIONS:
        return {"error": "Província não encontrada"}

    from datetime import datetime as dt_mod
    from ramadan import CAT
    today = dt_mod.now(CAT).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)

    data = MOZAMBIQUE_LOCATIONS[province]
    results = {
        "province": province,
        "districts": {},
    }

    for distrito, coords in data["distritos"].items():
        results["districts"][distrito] = {
            "lat": coords["lat"],
            "lon": coords["lon"],
            **calculate_day_times(coords["lat"], coords["lon"], today),
        }

    return results


# =============================================
# PLANETAS ENDPOINTS
# =============================================

@app.get("/planets", response_class=HTMLResponse)
async def planets_page():
    """Serve a página dos planetas."""
    return FileResponse("static/planets.html")


@app.get("/api/planets/info")
async def api_planets_info():
    """Retorna informação sobre os planetas."""
    return PLANETS


@app.get("/api/planets/positions")
async def api_planets_positions(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Calcula posições de todos os planetas para uma localização."""
    return calculate_planet_positions(lat, lon)


@app.get("/api/planets/all-provinces")
async def api_planets_all_provinces():
    """Posição dos planetas para todas as capitais de província."""
    return calculate_all_provinces_planets(MOZAMBIQUE_LOCATIONS)


# =============================================
# PÁSCOA ENDPOINTS
# =============================================

@app.get("/easter", response_class=HTMLResponse)
async def easter_page():
    """Serve a página da Páscoa."""
    return FileResponse("static/easter.html")


@app.get("/api/easter")
async def api_easter(
    start_year: int = Query(2026, description="Ano inicial"),
    num_years: int = Query(10, description="Número de anos"),
):
    """Retorna datas da Páscoa e festas relacionadas."""
    return get_easter_data(start_year, min(num_years, 30))
