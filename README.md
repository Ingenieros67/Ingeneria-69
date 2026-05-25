## 🌐 UniT-Coin — Interfaz Web del Nodo

### Descripción
Sitio web estático servido localmente con tres páginas funcionales que interactúan con el nodo Flask de la criptomoneda UniT-Coin. Sin frameworks JavaScript (sin React, Vue ni Angular). Solo HTML5, CSS3 y JavaScript vanilla.

---

### 🎯 Funcionalidades requeridas

#### 1. Wallet web (`wallet.html`)
- Generación de par de llaves ECDSA en el navegador
- Visualización de dirección y saldo consultando `/api/balance/
`
- Formulario para enviar UniT-Coins: firma la transacción localmente antes de enviarla al nodo
- Las llaves se persisten en `localStorage` (limitación conocida, sin cifrado robusto)

#### 2. Explorador de bloques (`explorador.html`)
- Tabla con los últimos bloques (consume `/api/blocks?limit=10`)
- Búsqueda por hash de bloque o por dirección
- Vista de detalle de transacciones por bloque (`/api/block/`)

#### 3. Estadísticas en vivo (`estadisticas.html`)
- Muestra: bloques minados, transacciones totales, dificultad actual
- Gráficas con Chart.js
- Actualización automática cada pocos segundos via `/api/stats`

---

### 🛠️ Stack técnico

| Tecnología       | Uso                                              |
|------------------|--------------------------------------------------|
| HTML5 / CSS3     | Estructura y estilos base                        |
| JavaScript vanilla | Lógica del cliente, sin frameworks             |
| Tailwind CSS (CDN) | Estilos rápidos y responsivos                  |
| elliptic.js (CDN) | Firma ECDSA en el navegador (equivalente a `ecdsa` de Python) |
| Chart.js (CDN)   | Gráficas en estadísticas                         |
| `fetch()`        | Consumo de endpoints REST del nodo Flask         |

**Servidor:** el mismo nodo Flask, o `python -m http.server` en la carpeta `web/`.

---

### 📡 Endpoints REST del nodo (contrato de API)

| Método | Ruta                        | Descripción                              |
|--------|-----------------------------|------------------------------------------|
| GET    | `/api/stats`                | `{ n_bloques, n_transacciones, dificultad }` |
| GET    | `/api/blocks?limit=N`       | Últimos N bloques                        |
| GET    | `/api/block/`         | Detalle de un bloque                     |
| GET    | `/api/balance/`  | Saldo de una dirección                   |
| POST   | `/api/tx`                   | Recibe transacción firmada → mempool     |

> CORS debe estar habilitado en Flask para que el navegador pueda consumir los endpoints.

---

### 📁 Estructura esperada del repositorio

```
web/
├── index.html          # Presentación del proyecto y navegación
├── wallet.html         # Wallet web
├── explorador.html     # Explorador de bloques
├── estadisticas.html   # Estadísticas en vivo
├── equipo.html         # Integrantes y PAI
├── css/
│   └── base.css        # Estilos globales (header, footer, nav)
├── js/
│   ├── wallet.js       # Lógica ECDSA y envío de transacciones
│   ├── explorador.js   # Consulta y renderizado de bloques
│   └── stats.js        # Polling de estadísticas y gráficas
└── assets/
    └── logo.*          # Logo e identidad visual de UniT-Coin
```

---

### 👥 Distribución de tareas

#### Estudiante 1 — Core Developer (Frontend funcional)
- [ ] `wallet.html`: generación de llaves, saldo, formulario de envío
- [ ] `explorador.html`: tabla de bloques y detalle (solo lectura)
- [ ] `js/wallet.js`: firma ECDSA local antes de enviar al nodo
- [ ] Integración con todos los endpoints HTTP

#### Estudiante 2 — Network / Ops Engineer (Backend HTTP)
- [ ] Implementar los 5 endpoints REST en Flask
- [ ] Configurar CORS en el nodo
- [ ] Documentar el contrato de la API en el README

#### Estudiante 3 — Data & Communications (Diseño y maquetación)
- [ ] Plantilla base: `header`, `footer`, navegación compartida
- [ ] `index.html` y `equipo.html`
- [ ] `estadisticas.html` con Chart.js
- [ ] Mockup previo en Figma o Inkscape
- [ ] Aplicar identidad visual (logo, paleta) producida en CAD

---

### 📦 Entregables

- [ ] Carpeta `web/` completa en el repositorio
- [ ] `README.md` con instrucciones para levantar el sitio localmente
- [ ] Capturas de las cuatro páginas funcionando
- [ ] Demo en vivo: generar llave → recibir monedas → enviar → ver en explorador

---

### ⚠️ Consideraciones y limitaciones conocidas

- La wallet web es **académica**: llaves almacenadas en `localStorage` sin cifrado robusto. Documentar en el white paper.
- Trabajar en rama `feature/web`; abrir Pull Request al cerrar cada página.
- **Plazo:** Fase 4, Semana 6. Integración con backend puede iniciar en Semana 5.

---

### 🚀 Cómo levantar el sitio localmente

```bash
# Opción A: servido por Flask (recomendado)
python node.py

# Opción B: servidor estático independiente
cd web/
python -m http.server 8080
# Abrir http://localhost:8080
```
