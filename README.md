# AMAS Eclipse Tracker & Ramadão

**Associação Moçambicana de Astronomia**

Aplicação web com duas funcionalidades principais:
1. **Eclipse Tracker** — Posição do Sol e da Lua em tempo real para todas as províncias e distritos de Moçambique, com mapa de visibilidade do eclipse
2. **Horários do Ramadão** — Fajr, Nascer/Pôr do Sol (Iftar), Isha e Lua para o mês do Ramadão em todo o território moçambicano

---

## Funcionalidades

### Eclipse Tracker (`/`)
- **Mapa do Céu interactivo** — Visualização em canvas do Sol e da Lua com altitude e azimute reais
- **Mapa de Visibilidade** — Mapa Leaflet com overlay de proximidade do eclipse sobre Moçambique
- **11 Províncias + ~160 Distritos** — Dados astronómicos para todo o território
- **Actualização em tempo real** — Posições recalculadas automaticamente a cada 15 segundos
- **Detecção de eclipse** — Alerta automático para eclipse parcial, anular ou total

### Horários do Ramadão (`/ramadan`)
- **Horários de hoje** — Fajr, Nascer do Sol, Pôr do Sol (Iftar), Isha, Lua para todas as províncias
- **Calendário mensal** — Todos os 30 dias do Ramadão para qualquer localização
- **Detalhe por distrito** — Horários para cada distrito de uma província
- **Duração do jejum** — Calculada automaticamente (Fajr até Iftar)
- **Interface moderna e responsiva** — Tema escuro optimizado para desktop e mobile

## Tecnologias

| Componente | Tecnologia |
|------------|------------|
| Backend | Python, FastAPI |
| Cálculos astronómicos | Astropy |
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Visualização do céu | Canvas API |
| Mapa interactivo | Leaflet.js |

## Requisitos

- Python 3.10+
- pip

## Instalação

```bash
# Clonar ou copiar o projecto
cd Eclipse

# Instalar dependências
pip install -r requirements.txt
```

## Execução

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Abrir no navegador: **http://localhost:8000**

## Estrutura do Projecto

```
Eclipse/
├── main.py              # Backend FastAPI + todos os endpoints
├── locations.py         # Base de dados de províncias e distritos
├── ramadan.py           # Cálculos de nascer/pôr do sol e lua
├── requirements.txt     # Dependências Python
├── logo.png             # Logo da AMAS
├── README.md
└── static/
    ├── index.html       # Página Eclipse Tracker
    ├── styles.css       # Estilos gerais (tema nocturno)
    ├── app.js           # Lógica Eclipse + visualização canvas + mapa
    ├── ramadan.html     # Página Horários do Ramadão
    ├── ramadan.css      # Estilos Ramadão
    ├── ramadan.js       # Lógica Ramadão
    └── logo.png         # Logo AMAS
```

## API Endpoints

| Endpoint | Descrição |
|----------|-----------|
| `GET /` | Página principal |
| `GET /api/positions?lat=&lon=` | Posição do Sol/Lua para coordenadas |
| `GET /api/all-provinces-positions` | Posições para todas as províncias |
| `GET /api/province-details/{province}` | Dados de todos os distritos de uma província |
| `GET /api/provinces` | Lista de províncias |
| `GET /api/districts/{province}` | Lista de distritos de uma província |
| `GET /api/eclipse-grid` | Grelha de visibilidade do eclipse |
| `GET /ramadan` | Página dos Horários do Ramadão |
| `GET /api/ramadan/info` | Info sobre datas do Ramadão |
| `GET /api/ramadan/today` | Horários de hoje (todas as províncias) |
| `GET /api/ramadan/month?lat=&lon=` | Horários de todo o mês do Ramadão |
| `GET /api/ramadan/province/{province}` | Horários dos distritos (hoje) |

## Exemplo de Resposta da API

```json
{
  "sun": {
    "altitude": 45.23,
    "azimuth": 320.15,
    "above_horizon": true,
    "cardinal": "NW"
  },
  "moon": {
    "altitude": 44.80,
    "azimuth": 319.50,
    "above_horizon": true,
    "cardinal": "NW"
  },
  "separation": 0.85,
  "eclipse": {
    "type": "Parcial",
    "magnitude": 0.42,
    "is_eclipse": true
  }
}
```

---

Desenvolvido pela **Associação Moçambicana de Astronomia (AMAS)**

Dados calculados com [Astropy](https://www.astropy.org/)
