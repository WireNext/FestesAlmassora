// =============================
// 1. Datos GTFS
// =============================
const gtfsData = {
    almassora: {}
};

// Limpieza básica de strings (elimina comillas y espacios extras)
const clean = (val) => String(val || '').replace(/["\r\n\t]/g, '').trim();

// =============================
// 2. Iconos de paradas (Estilo Flat Móvil)
// =============================
function createBusStopIcon(size = 20) {
    const iconInnerSize = Math.max(10, Math.round(size * 0.55));
    
    return L.divIcon({
        className: 'custom-bus-marker',
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: #059600;
                border: 1.5px solid #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
                <svg width="${iconInnerSize}" height="${iconInnerSize}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 6v6"/>
                    <path d="M16 6v6"/>
                    <path d="M2 12h20"/>
                    <rect x="4" y="3" width="16" height="15" rx="2"/>
                    <path d="M6 18v2"/>
                    <path d="M18 18v2"/>
                    <circle cx="7.5" cy="15.5" r="1" fill="#ffffff"/>
                    <circle cx="16.5" cy="15.5" r="1" fill="#ffffff"/>
                </svg>
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

const customStopIcon = createBusStopIcon(20);

function updateIconSize(map, marker) {
    const zoom = map.getZoom();
    
    // Tamaños ajustados para móvil (entre 14px y 24px máximo)
    let size = 14;
    if (zoom >= 14) size = 18;
    if (zoom >= 16) size = 22;
    if (zoom >= 18) size = 24;

    marker.setIcon(createBusStopIcon(size));
}

// =============================
// 3. Cargar archivos GTFS
// =============================
async function loadGTFSData(agency) {
    const dataDir = `./data/${agency}/`;
    const files = ['routes.txt', 'trips.txt', 'stops.txt', 'stop_times.txt', 'shapes.txt', 'calendar.txt'];

    for (const file of files) {
        try {
            const response = await fetch(dataDir + file);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const text = await response.text();
            
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length <= 1) continue;

            const headers = lines[0].split(',').map(clean);
            const data = lines.slice(1).map(line => {
                const values = line.split(',');
                return headers.reduce((obj, header, i) => {
                    obj[header] = values[i] ? clean(values[i]) : '';
                    return obj;
                }, {});
            });

            gtfsData[agency][file.replace('.txt', '')] = data;
            console.log(`✅ ${file} cargado:`, data.length, "registros");
        } catch (error) {
            console.error(`❌ No se pudo cargar ${file} para ${agency}:`, error);
        }
    }
}

// =============================
// 4. Inicializar mapa
// =============================
function initMap() {
    const map = L.map('map', { zoomControl: false }).setView([39.9479, -0.0634], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', () => closeSheet());
    return map;
}

// =============================
// 5. Validación de calendario
// =============================
function getYYYYMMDD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

function isServiceActive(service, fecha) {
    if (!service) return false;

    const sanitize = (val) => String(val || '').replace(/["\r\n\t]/g, '').trim();

    const targetDateStr = getYYYYMMDD(fecha);
    const startDate = sanitize(service.start_date);
    const endDate = sanitize(service.end_date);

    // 1. Validar rango de fechas YYYYMMDD
    if (targetDateStr < startDate || targetDateStr > endDate) {
        return false;
    }

    // 2. Mapear día de la semana en JS (0=Domingo, 1=Lunes, ..., 6=Sábado)
    const dayOfWeek = fecha.getDay();
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayKey = weekdays[dayOfWeek];

    const serviceKey = Object.keys(service).find(k => sanitize(k).toLowerCase() === dayKey);

    if (!serviceKey) return false;

    // 3. Comprobar si el valor es 1
    return sanitize(service[serviceKey]) === "1";
}

// =============================
// 6. Obtener las próximas 5 salidas
// =============================
function getNext5Departures(stopId, { trips, stopTimes, routes, calendar }) {
    console.log(`--- ANALIZANDO PARADA: ${stopId} ---`);
    
    const stopTimesForStop = stopTimes.filter(st => clean(st.stop_id) === clean(stopId));
    console.log(`1. Registros en stop_times:`, stopTimesForStop.length);

    if (!stopTimesForStop.length) return [];

    const now = new Date();
    const departures = [];
    const maxDaysToSearch = 60;

    for (let dayOffset = 0; dayOffset < maxDaysToSearch; dayOffset++) {
        if (departures.length >= 5) break;

        const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
        const isToday = (dayOffset === 0);

        const activeServiceIds = calendar
            .filter(s => isServiceActive(s, checkDate))
            .map(s => clean(s.service_id));

        if (dayOffset === 0 || checkDate.getDate() === 2) {
            console.log(`Día ${getYYYYMMDD(checkDate)} | Servicios activos en calendar.txt:`, activeServiceIds);
        }

        if (!activeServiceIds.length) continue;

        const dailyDepartures = [];

        stopTimesForStop.forEach(st => {
            const trip = trips.find(t => clean(t.trip_id) === clean(st.trip_id));
            if (!trip) {
                console.warn(`❌ No existe trip_id "${st.trip_id}" en trips.txt`);
                return;
            }

            const tripServiceId = clean(trip.service_id);
            const isServiceActiveToday = activeServiceIds.includes(tripServiceId);

            if (!isServiceActiveToday) {
                console.warn(`❌ El trip "${trip.trip_id}" usa service_id "${tripServiceId}", pero los servicios activos hoy son:`, activeServiceIds);
                return;
            }

            const route = routes.find(r => clean(r.route_id) === clean(trip.route_id));
            if (!route) {
                console.warn(`❌ No se encontró la ruta para route_id "${trip.route_id}"`);
                return;
            }

            const timeParts = st.departure_time.split(':').map(Number);
            if (timeParts.length < 2) return;
            const [hh, mm, ss] = timeParts;

            const depDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

            if (hh >= 24) {
                depDate.setDate(depDate.getDate() + 1);
                depDate.setHours(hh - 24, mm, ss || 0, 0);
            } else {
                depDate.setHours(hh, mm, ss || 0, 0);
            }

            if (isToday && depDate <= now) return;

            // Extraer colores de la ruta con fallback
            const rawColor = clean(route.route_color);
            const routeColor = rawColor ? `#${rawColor.replace('#', '')}` : '#059600';

            const rawTextColor = clean(route.route_text_color);
            const routeTextColor = rawTextColor ? `#${rawTextColor.replace('#', '')}` : '#ffffff';

            dailyDepartures.push({
                linea: route.route_short_name || route.route_id || 'Bus',
                nombre: route.route_long_name || '',
                horaStr: `${String(hh >= 24 ? hh - 24 : hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
                fechaObj: depDate,
                diffMin: Math.round((depDate - now) / 60000),
                routeColor: routeColor,
                routeTextColor: routeTextColor
            });
        });

        dailyDepartures.sort((a, b) => a.fechaObj - b.fechaObj);

        for (const dep of dailyDepartures) {
            if (departures.length < 5) {
                departures.push(dep);
            }
        }
    }

    console.log(`🚀 Salidas finales devueltas:`, departures);
    return departures;
}

// =============================
// 7. Dibujar paradas en el mapa
// =============================
function drawStopsOnMap(map, agency) {
    const stops = gtfsData[agency].stops || [];
    const trips = gtfsData[agency].trips || [];
    const stopTimes = gtfsData[agency].stop_times || [];
    const routes = gtfsData[agency].routes || [];
    const calendar = gtfsData[agency].calendar || [];

    stops.forEach(stop => {
        const lat = parseFloat(clean(stop.stop_lat));
        const lon = parseFloat(clean(stop.stop_lon));
        if (isNaN(lat) || isNaN(lon)) return;

        const marker = L.marker([lat, lon], { icon: customStopIcon }).addTo(map);

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            const departures = getNext5Departures(stop.stop_id, { trips, stopTimes, routes, calendar });
            showBottomSheet(stop.stop_name || 'Parada', departures);
        });

        updateIconSize(map, marker);
        map.on('zoom', () => updateIconSize(map, marker));
    });
}

// =============================
// 8. Renderizado Bottom Sheet
// =============================
function showBottomSheet(stopName, departures) {
    const sheet = document.getElementById('stop-sheet');
    const titleEl = document.getElementById('sheet-stop-name');
    const contentEl = document.getElementById('sheet-stop-content');

    if (!sheet || !titleEl || !contentEl) {
        console.warn("⚠️ Elementos HTML de 'stop-sheet' no encontrados en el DOM.");
        return;
    }

    titleEl.textContent = stopName;

    if (!departures.length) {
        contentEl.innerHTML = `<div class="no-departures">No hi ha eixides programades pròximament.</div>`;
        sheet.classList.add('active');
        return;
    }

    const grouped = {};
    departures.forEach(dep => {
        const dateKey = formatDateHeader(dep.fechaObj);
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(dep);
    });

    let html = '';
    for (const [dateLabel, list] of Object.entries(grouped)) {
        html += `<div class="date-group">`;
        html += `<div class="date-header">${dateLabel}</div>`;

        list.forEach(item => {
            const isImminente = item.diffMin >= 0 && item.diffMin <= 5;
            const timeDisplay = isImminente 
                ? (item.diffMin <= 1 ? 'A la parada' : `en ${item.diffMin} min`)
                : item.horaStr;

            html += `
                <div class="departure-card">
                    <div>
                        <span class="departure-line" style="background-color: ${item.routeColor}; color: ${item.routeTextColor};">
                            ${item.linea}
                        </span> 
                        <span class="departure-name">${item.nombre}</span>
                    </div>
                    <div class="departure-time ${isImminente ? 'imminente' : ''}">
                        ${timeDisplay}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    contentEl.innerHTML = html;
    sheet.classList.add('active');
}

function closeSheet() {
    const sheet = document.getElementById('stop-sheet');
    if (sheet) sheet.classList.remove('active');
}

function formatDateHeader(date) {
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Hui';
    if (date.toDateString() === tomorrow.toDateString()) return 'Demà';

    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const formatted = date.toLocaleDateString('ca-ES', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// =============================
// 9. Dibujar rutas (Shapes)
// =============================
function drawRoutes(map, agency) {
    const trips = gtfsData[agency].trips || [];
    const shapes = gtfsData[agency].shapes || [];
    const routes = gtfsData[agency].routes || [];
    if (!shapes.length) return;

    const shapeMap = new Map();
    shapes.forEach(shape => {
        const shapeId = clean(shape.shape_id);
        if (!shapeMap.has(shapeId)) shapeMap.set(shapeId, []);
        shapeMap.get(shapeId).push([parseFloat(clean(shape.shape_pt_lat)), parseFloat(clean(shape.shape_pt_lon))]);
    });

    routes.forEach(route => {
        const rawColor = clean(route.route_color);
        const routeColor = rawColor ? `#${rawColor.replace('#', '')}` : '#28a745';
        
        const routeTrips = trips.filter(t => clean(t.route_id) === clean(route.route_id));
        const drawnShapes = new Set();

        routeTrips.forEach(trip => {
            const shapeId = clean(trip.shape_id);
            if (!shapeId || drawnShapes.has(shapeId)) return;

            const shapePoints = shapeMap.get(shapeId);
            if (shapePoints?.length) {
                L.polyline(shapePoints, {
                    color: routeColor,
                    weight: 4,
                    opacity: 0.8
                }).addTo(map);
                drawnShapes.add(shapeId);
            }
        });
    });
}

// =============================
// 10. Iniciar app
// =============================
async function startApp() {
    await loadGTFSData('almassora');
    const map = initMap();
    drawStopsOnMap(map, 'almassora');
    drawRoutes(map, 'almassora');
}

startApp();