# AMAS Eclipse Tracker, Ramadão, Planetas & Páscoa

**Associação Moçambicana de Astronomia**

Aplicação web com quatro funcionalidades principais:
1. **Eclipse Tracker** — Posição do Sol e da Lua em tempo real para todas as províncias e distritos de Moçambique, com mapa de visibilidade do eclipse
2. **Horários do Ramadão** — Fajr, Nascer/Pôr do Sol (Iftar), Isha e Lua para o mês do Ramadão em todo o território moçambicano
3. **Planetas** — Posição em tempo real dos planetas do sistema solar visíveis de Moçambique, com altitude, azimute, horários de nascer/pôr e duração da visibilidade
4. **Páscoa** — Datas da Páscoa e festas litúrgicas associadas (Quarta de Cinzas, Ramos, Quinta Santa, Sexta Santa, Ascensão) para os próximos 10+ anos

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

### Planetas (`/planets`)
- **Posição em tempo real** — Altitude e azimute de Mercúrio, Vénus, Marte, Júpiter, Saturno, Urano e Neptuno
- **Horários de nascer/pôr** — Calculados com precisão para cada província
- **Duração da visibilidade** — Barra visual indicando o período visível de cada planeta no dia
- **Visualização do domo celeste** — Canvas interactivo com projecção polar
- **Tabela comparativa por província** — Visibilidade de todos os planetas em todas as capitais provinciais

### Páscoa (`/easter`)
- **Datas para 10+ anos** — Páscoa calculada pelo algoritmo de Meeus (Computus gregoriano)
- **Festas litúrgicas** — Quarta de Cinzas, Domingo de Ramos, Quinta Santa, Sexta Santa, Ascensão
- **Linha temporal visual** — Cards por ano com destaques para o ano corrente
- **Tabela detalhada** — Todas as datas num formato comparativo
- **Consulta flexível** — Escolha o ano inicial e número de anos (máx. 30)

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


## Deploy

- **Frontend (GitHub Pages)**: a pasta `docs/` já está pronta. Em Settings → Pages defina `main` + `/docs`. O site ficará em `https://mirosaide.github.io/AMAS_ECLIPSE_TRACKER/`.
- **Backend (Render.com)**: o repositório inclui `Dockerfile` e `render.yaml`. No painel Render: *New → Blueprint → Connect repo* e deploy. O serviço será exposto como `https://amas-eclipse-backend.onrender.com` (ou semelhante).
- **Configurar o frontend**: nos ficheiros `docs/index.html` e `docs/ramadan.html` a variável `window.API_BASE` aponta para `https://amas-eclipse-backend.onrender.com`. Se o domínio final for diferente, actualize essa string.

## Estrutura do Projecto

```
Eclipse/
├── main.py              # Backend FastAPI + todos os endpoints
├── locations.py         # Base de dados de províncias e distritos
├── ramadan.py           # Cálculos de nascer/pôr do sol e lua
├── planets.py           # Cálculos de posição dos planetas
├── easter.py            # Cálculos da Páscoa (algoritmo de Meeus)
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
    ├── planets.html     # Página Planetas
    ├── planets.css      # Estilos Planetas
    ├── planets.js       # Lógica Planetas
    ├── easter.html      # Página Páscoa
    ├── easter.css       # Estilos Páscoa
    ├── easter.js        # Lógica Páscoa
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
| `GET /planets` | Página dos Planetas |
| `GET /api/planets/positions?lat=&lon=` | Posição dos planetas para coordenadas |
| `GET /api/planets/all-provinces` | Planetas para todas as províncias |
| `GET /easter` | Página da Páscoa |
| `GET /api/easter?start_year=&num_years=` | Datas da Páscoa e festas litúrgicas |

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
