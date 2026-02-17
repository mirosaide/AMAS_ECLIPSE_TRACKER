"""
Banco de dados de localizações de Moçambique.
Províncias e distritos com coordenadas geográficas (latitude, longitude).
"""

MOZAMBIQUE_LOCATIONS = {
    "Maputo Cidade": {
        "capital": True,
        "lat": -25.9692,
        "lon": 32.5732,
        "distritos": {
            "KaMpfumo": {"lat": -25.9653, "lon": 32.5892},
            "Nlhamankulu": {"lat": -25.9617, "lon": 32.5653},
            "KaMaxaqueni": {"lat": -25.9500, "lon": 32.5750},
            "KaMavota": {"lat": -25.9333, "lon": 32.5583},
            "KaMubukwana": {"lat": -25.9167, "lon": 32.5417},
            "KaTembe": {"lat": -26.0500, "lon": 32.5333},
            "KaNyaka": {"lat": -26.0833, "lon": 32.6667},
        }
    },
    "Maputo Província": {
        "capital": False,
        "lat": -26.0333,
        "lon": 32.4667,
        "distritos": {
            "Matola": {"lat": -25.9622, "lon": 32.4589},
            "Boane": {"lat": -26.0333, "lon": 32.3500},
            "Namaacha": {"lat": -25.9667, "lon": 32.0167},
            "Matutuíne": {"lat": -26.4333, "lon": 32.5500},
            "Moamba": {"lat": -25.5833, "lon": 32.2333},
            "Marracuene": {"lat": -25.7333, "lon": 32.6500},
            "Manhiça": {"lat": -25.4000, "lon": 32.8000},
            "Magude": {"lat": -25.0167, "lon": 32.6500},
        }
    },
    "Gaza": {
        "capital": False,
        "lat": -23.8617, 
        "lon": 35.3833,
        "distritos": {
            "Xai-Xai": {"lat": -25.0519, "lon": 33.6442},
            "Chókwè": {"lat": -24.5167, "lon": 32.9833},
            "Chibuto": {"lat": -24.6833, "lon": 33.5333},
            "Bilene": {"lat": -25.2833, "lon": 33.2500},
            "Manjacaze": {"lat": -24.7167, "lon": 34.8833},
            "Guijá": {"lat": -24.4833, "lon": 32.3167},
            "Massangena": {"lat": -23.5500, "lon": 32.9500},
            "Massingir": {"lat": -23.9167, "lon": 32.1500},
            "Mabalane": {"lat": -24.0833, "lon": 32.3667},
            "Chicualacuala": {"lat": -22.3333, "lon": 31.7000},
            "Limpopo": {"lat": -24.1500, "lon": 33.2500},
            "Mandlakaze": {"lat": -24.0667, "lon": 34.0667},
        }
    },
    "Inhambane": {
        "capital": False,
        "lat": -23.8650,
        "lon": 35.3833,
        "distritos": {
            "Inhambane Cidade": {"lat": -23.8650, "lon": 35.3833},
            "Maxixe": {"lat": -23.8597, "lon": 35.3472},
            "Vilankulo": {"lat": -22.0000, "lon": 35.3167},
            "Massinga": {"lat": -23.3333, "lon": 35.2000},
            "Morrumbene": {"lat": -23.6833, "lon": 35.3000},
            "Homoíne": {"lat": -24.0000, "lon": 34.8833},
            "Jangamo": {"lat": -24.0833, "lon": 35.3333},
            "Govuro": {"lat": -21.5500, "lon": 35.1167},
            "Inharrime": {"lat": -24.4667, "lon": 35.0167},
            "Zavala": {"lat": -24.5167, "lon": 35.1500},
            "Panda": {"lat": -24.0500, "lon": 34.7167},
            "Funhalouro": {"lat": -23.1167, "lon": 34.3667},
            "Mabote": {"lat": -22.0667, "lon": 34.2500},
        }
    },
    "Sofala": {
        "capital": False,
        "lat": -19.8436,
        "lon": 34.8389,
        "distritos": {
            "Beira": {"lat": -19.8436, "lon": 34.8389},
            "Dondo": {"lat": -19.6167, "lon": 34.7333},
            "Nhamatanda": {"lat": -19.1833, "lon": 34.2000},
            "Gorongosa": {"lat": -18.6833, "lon": 34.0667},
            "Marromeu": {"lat": -18.2833, "lon": 35.9500},
            "Caia": {"lat": -17.8333, "lon": 35.3167},
            "Cheringoma": {"lat": -18.5000, "lon": 35.2000},
            "Búzi": {"lat": -20.1000, "lon": 34.5667},
            "Machanga": {"lat": -20.4333, "lon": 34.7667},
            "Muanza": {"lat": -19.5833, "lon": 34.3500},
            "Chibabava": {"lat": -20.2000, "lon": 34.1333},
            "Maríngue": {"lat": -18.3167, "lon": 34.1333},
        }
    },
    "Manica": {
        "capital": False,
        "lat": -19.1167,
        "lon": 33.4833,
        "distritos": {
            "Chimoio": {"lat": -19.1167, "lon": 33.4833},
            "Gondola": {"lat": -19.2833, "lon": 33.6667},
            "Manica": {"lat": -19.0000, "lon": 32.8667},
            "Sussundenga": {"lat": -19.3333, "lon": 33.2333},
            "Bárue": {"lat": -18.3333, "lon": 33.3333},
            "Mossurize": {"lat": -20.2167, "lon": 33.2167},
            "Machaze": {"lat": -20.0333, "lon": 33.6333},
            "Guro": {"lat": -17.6833, "lon": 33.4833},
            "Tambara": {"lat": -18.5667, "lon": 33.1167},
            "Macossa": {"lat": -18.0833, "lon": 34.0167},
        }
    },
    "Tete": {
        "capital": False,
        "lat": -16.1564,
        "lon": 33.5867,
        "distritos": {
            "Tete Cidade": {"lat": -16.1564, "lon": 33.5867},
            "Moatize": {"lat": -16.1167, "lon": 33.7333},
            "Changara": {"lat": -15.6667, "lon": 33.3167},
            "Cahora-Bassa": {"lat": -15.3833, "lon": 32.7333},
            "Angónia": {"lat": -14.5833, "lon": 34.2333},
            "Tsangano": {"lat": -14.7167, "lon": 34.5333},
            "Macanga": {"lat": -14.9333, "lon": 33.8000},
            "Chiuta": {"lat": -14.6333, "lon": 33.3333},
            "Zumbo": {"lat": -15.6167, "lon": 30.4333},
            "Maravia": {"lat": -14.9667, "lon": 31.3833},
            "Chifunde": {"lat": -14.2500, "lon": 33.3667},
            "Mutarara": {"lat": -17.4167, "lon": 35.0667},
            "Doa": {"lat": -15.8667, "lon": 34.0333},
            "Magoe": {"lat": -15.7167, "lon": 32.1500},
        }
    },
    "Zambézia": {
        "capital": False,
        "lat": -17.8781,
        "lon": 36.8886,
        "distritos": {
            "Quelimane": {"lat": -17.8781, "lon": 36.8886},
            "Mocuba": {"lat": -16.8500, "lon": 36.9833},
            "Gurué": {"lat": -15.4500, "lon": 36.9833},
            "Alto Molócuè": {"lat": -15.6167, "lon": 37.7167},
            "Milange": {"lat": -16.0833, "lon": 35.7833},
            "Morrumbala": {"lat": -17.3167, "lon": 35.5833},
            "Namacurra": {"lat": -17.6667, "lon": 36.9833},
            "Nicoadala": {"lat": -17.6000, "lon": 36.7833},
            "Inhassunge": {"lat": -18.0000, "lon": 36.5833},
            "Maganja da Costa": {"lat": -17.3333, "lon": 37.3500},
            "Pebane": {"lat": -17.2833, "lon": 38.1333},
            "Ile": {"lat": -16.0667, "lon": 36.6833},
            "Lugela": {"lat": -16.4000, "lon": 36.3833},
            "Gilé": {"lat": -16.1667, "lon": 38.2333},
            "Namarrói": {"lat": -15.9167, "lon": 36.1333},
            "Chinde": {"lat": -18.5833, "lon": 36.4500},
            "Mopeia": {"lat": -17.8833, "lon": 35.7167},
        }
    },
    "Nampula": {
        "capital": False,
        "lat": -15.1167,
        "lon": 39.2667,
        "distritos": {
            "Nampula Cidade": {"lat": -15.1167, "lon": 39.2667},
            "Nacala Porto": {"lat": -14.5425, "lon": 40.6728},
            "Angoche": {"lat": -16.2333, "lon": 39.9167},
            "Ilha de Moçambique": {"lat": -15.0333, "lon": 40.7333},
            "Monapo": {"lat": -15.0167, "lon": 40.1500},
            "Meconta": {"lat": -15.2167, "lon": 39.7000},
            "Ribaué": {"lat": -14.9833, "lon": 38.2667},
            "Malema": {"lat": -14.9500, "lon": 37.4167},
            "Lalaua": {"lat": -14.8833, "lon": 37.9667},
            "Murrupula": {"lat": -15.4833, "lon": 38.6833},
            "Mecubúri": {"lat": -14.7667, "lon": 38.7333},
            "Mogincual": {"lat": -15.7000, "lon": 39.7167},
            "Moma": {"lat": -16.2167, "lon": 39.3167},
            "Larde": {"lat": -16.0167, "lon": 39.5833},
            "Eráti": {"lat": -14.6333, "lon": 39.8500},
            "Nacala-a-Velha": {"lat": -14.4667, "lon": 40.5167},
            "Memba": {"lat": -14.2000, "lon": 40.5000},
            "Mossuril": {"lat": -15.0000, "lon": 40.5000},
            "Muecate": {"lat": -15.1000, "lon": 39.7833},
            "Nacaroa": {"lat": -14.5000, "lon": 40.1000},
            "Liúpo": {"lat": -15.5167, "lon": 39.9167},
        }
    },
    "Niassa": {
        "capital": False,
        "lat": -13.3167,
        "lon": 35.2333,
        "distritos": {
            "Lichinga": {"lat": -13.3167, "lon": 35.2333},
            "Cuamba": {"lat": -14.8000, "lon": 36.5333},
            "Mandimba": {"lat": -14.3500, "lon": 35.7167},
            "Marrupa": {"lat": -13.2333, "lon": 37.5333},
            "Metarica": {"lat": -14.5167, "lon": 35.8167},
            "Ngauma": {"lat": -13.5000, "lon": 35.0833},
            "Lago": {"lat": -12.2833, "lon": 34.7500},
            "Sanga": {"lat": -12.7167, "lon": 35.3500},
            "Muembe": {"lat": -13.0833, "lon": 36.0833},
            "Mavago": {"lat": -12.5833, "lon": 36.6000},
            "Mecula": {"lat": -12.8833, "lon": 37.4500},
            "Majune": {"lat": -13.6167, "lon": 36.4667},
            "N'gauma": {"lat": -13.4500, "lon": 35.1000},
            "Nipepe": {"lat": -14.1833, "lon": 36.8833},
            "Mecanhelas": {"lat": -14.9667, "lon": 35.8333},
            "Chimbonila": {"lat": -13.3000, "lon": 35.1500},
        }
    },
    "Cabo Delgado": {
        "capital": False,
        "lat": -12.9667,
        "lon": 40.5167,
        "distritos": {
            "Pemba": {"lat": -12.9667, "lon": 40.5167},
            "Montepuez": {"lat": -13.1167, "lon": 39.0000},
            "Chiúre": {"lat": -13.3500, "lon": 39.7833},
            "Mocímboa da Praia": {"lat": -11.3500, "lon": 40.3500},
            "Mueda": {"lat": -11.6667, "lon": 39.5667},
            "Palma": {"lat": -10.7667, "lon": 40.4667},
            "Macomia": {"lat": -12.2333, "lon": 40.2667},
            "Balama": {"lat": -13.3500, "lon": 38.5667},
            "Namuno": {"lat": -13.5833, "lon": 38.8000},
            "Quissanga": {"lat": -12.4333, "lon": 40.5333},
            "Ibo": {"lat": -12.3500, "lon": 40.5833},
            "Mecúfi": {"lat": -13.1333, "lon": 40.4500},
            "Metuge": {"lat": -12.7833, "lon": 40.3167},
            "Ancuabe": {"lat": -13.0500, "lon": 39.8500},
            "Meluco": {"lat": -12.6333, "lon": 39.6333},
            "Muidumbe": {"lat": -11.9500, "lon": 39.9000},
            "Nangade": {"lat": -11.0833, "lon": 39.7500},
        }
    },
}


def get_all_locations():
    """Retorna lista plana com todas as localizações."""
    locations = []
    for province, data in MOZAMBIQUE_LOCATIONS.items():
        locations.append({
            "name": province,
            "type": "province",
            "lat": data["lat"],
            "lon": data["lon"],
            "province": province,
        })
        for distrito, coords in data["distritos"].items():
            locations.append({
                "name": distrito,
                "type": "district",
                "lat": coords["lat"],
                "lon": coords["lon"],
                "province": province,
            })
    return locations


def get_provinces():
    """Retorna apenas as províncias."""
    return [
        {"name": p, "lat": d["lat"], "lon": d["lon"]}
        for p, d in MOZAMBIQUE_LOCATIONS.items()
    ]


def get_districts(province: str):
    """Retorna os distritos de uma província."""
    if province not in MOZAMBIQUE_LOCATIONS:
        return []
    data = MOZAMBIQUE_LOCATIONS[province]
    return [
        {"name": d, "lat": c["lat"], "lon": c["lon"]}
        for d, c in data["distritos"].items()
    ]
