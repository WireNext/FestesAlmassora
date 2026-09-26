// =============================
// 1. Datos GTFS
// =============================
const gtfsData = {
    almassora: {}
};

// =============================
// 2. Iconos paradas
// =============================
const customStopIcon = L.divIcon({
    className: 'custom-stop-icon',
    html: '<div style="background-color: #3388ff; border-radius: 50%; width: 10px; height: 10px; border: 2px solid white;"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

function updateIconSize(map, marker) {
    const zoomLevel = map.getZoom();
    let iconSize = 0;
    if (zoomLevel >= 14) {
        iconSize = (zoomLevel - 13) * 3;
        if (iconSize > 25) iconSize = 25;
    } else {
        iconSize = 0;
    }
    const newIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: `<div style="background-color: #3388ff; border-radius: 50%; width: ${iconSize}px; height: ${iconSize}px; border: 2px solid white;"></div>`,
        iconSize: [iconSize + 4, iconSize + 4],
        iconAnchor: [iconSize / 2 + 2, iconSize / 2 + 2]
    });
    marker.setIcon(newIcon);
}

// =============================
// 3. Cargar GTFS (Archivos estrictos)
// =============================
async function loadGTFSData(agency) {
    const dataDir = `./data/${agency}/`;
    const files = ['routes.txt', 'trips.txt', 'stops.txt', 'stop_times.txt', 'shapes.txt', 'calendar.txt'];

    for (const file of files) {
        try {
            const response = await fetch(dataDir + file);
            if (!response.ok) throw new Error(`Error al cargar ${file}`);
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length <= 1) continue;
            const headers = lines[0].split(',').map(h => h.trim());
            const data = lines.slice(1).map(line => {
                const values = line.split(',');
                return headers.reduce((obj, header, i) => {
                    obj[header] = values[i] ? values[i].trim() : '';
                    return obj;
                }, {});
            });
            gtfsData[agency][file.replace('.txt', '')] = data;
        } catch (error) {
            console.error(`No se pudo cargar ${file} para ${agency}:`, error);
        }
    }
}

// =============================
// 4. Inicializar mapa
// =============================
function initMap() {
    const map = L.map('map', { zoomControl: false }).setView([39.9479, -0.0634], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', () => closeSheet());
    return map;
}

// =============================
// 5. Helpers de Fechas (Hora Local)
// =============================
function getYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function isServiceActiveOnDate(service, targetDate) {
    if (!service) return false;

    const yyyymmdd = getYYYYMMDD(targetDate);

    // 1. Verificar rango start_date <= fecha <= end_date
    if (yyyymmdd < service.start_date || yyyymmdd > service.end_date) {
        return false;
    }

    // 2. Verificar día de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado)
    const dow = targetDate.getDay();
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return service[weekdays[dow]] === "1";
}

// =============================
// 6. Dibujar Paradas y buscar 5 salidas futuras
// =============================
function drawStopsOnMap(map, agency) {
    const stops = gtfsData[agency].stops || [];
    const trips = gtfsData[agency].trips || [];
    const stopTimes = gtfsData[agency].stop_times || [];
    const routes = gtfsData[agency].routes || [];
    const calendar = gtfsData[agency].calendar || [];

    stops.forEach(stop => {
        const lat = parseFloat(stop.stop_lat?.replace(/["\s]/g, ''));
        const lon = parseFloat(stop.stop_lon?.replace(/["\s]/g, ''));
        if (isNaN(lat) || isNaN(lon)) return;

        const marker = L.marker([lat, lon], { icon: customStopIcon }).addTo(map);

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            const nextDepartures = getNext5Departures(stop.stop_id, { trips, stopTimes, routes, calendar });
            showBottomSheet(stop.stop_name, nextDepartures);
        });

        updateIconSize(map, marker);
        map.on('zoom', () => updateIconSize(map, marker));
    });
}

function getNext5Departures(stopId, { trips, stopTimes, routes, calendar }) {
    const stopTimesForStop = stopTimes.filter(st => st.stop_id === stopId);
    if (!stopTimesForStop.length) return [];

    const now = new Date();
    const departures = [];
    const maxDaysToSearch = 60; // Busca hasta 60 días en el futuro

    for (let dayOffset = 0; dayOffset < maxDaysToSearch; dayOffset++) {
        if (departures.length >= 5) break;

        // Fecha limpia en medianoche local
        const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);

        // Filtrar service_ids activos en calendar.txt para esta fecha
        const activeServiceIds = calendar
            .filter(s => isServiceActiveOnDate(s, checkDate))
            .map(s => s.service_id);

        if (!activeServiceIds.length) continue;

        const dailyDepartures = [];

        stopTimesForStop.forEach(st => {
            // Filtrar el trip correspondiente activo
            const trip = trips.find(t => t.trip_id === st.trip_id && activeServiceIds.includes(t.service_id));
            if (!trip) return;

            const route = routes.find(r => r.route_id === trip.route_id);
            if (!route) return;

            const [hh, mm, ss] = st.departure_time.split(':').map(Number);

            // Construir la fecha exacta de la salida
            const depDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

            if (hh >= 24) {
                depDate.setDate(depDate.getDate() + 1);
                depDate.setHours(hh - 24, mm, ss || 0, 0);
            } else {
                depDate.setHours(hh, mm, ss || 0, 0);
            }

            // Solo añadir salidas futuras respecto al momento actual
            if (depDate <= now) return;

            dailyDepartures.push({
                linea: route.route_short_name || 'Bus',
                nombre: route.route_long_name || '',
                horaStr: `${String(hh >= 24 ? hh - 24 : hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
                fechaObj: depDate,
                diffMin: Math.round((depDate - now) / 60000)
            });
        });

        // Ordenar cronológicamente las salidas de este día
        dailyDepartures.sort((a, b) => a.fechaObj - b.fechaObj);

        // Añadir hasta llegar a las 5 necesarias
        for (const dep of dailyDepartures) {
            if (departures.length < 5) {
                departures.push(dep);
            } else {
                break;
            }
        }
    }

    return departures;
}

// =============================
// 7. Renderizado Liquid Glass (Bottom Sheet)
// =============================
function showBottomSheet(stopName, departures) {
    const sheet = document.getElementById('stop-sheet');
    const titleEl = document.getElementById('sheet-stop-name');
    const contentEl = document.getElementById('sheet-stop-content');

    titleEl.textContent = stopName;

    if (!departures.length) {
        contentEl.innerHTML = `<div class="no-departures">No hi ha eixides programades.</div>`;
        sheet.classList.add('active');
        return;
    }

    // Agrupar salidas por etiqueta de fecha
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
                ? (item.diffMin <= 1 ? 'En parada' : `en ${item.diffMin} min`)
                : item.horaStr;

            html += `
                <div class="departure-card">
                    <div>
                        <span class="departure-line">${item.linea}</span>
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
// 8. Dibujar rutas (Shapes)
// =============================
function drawRoutes(map, agency) {
    const trips = gtfsData[agency].trips || [];
    const shapes = gtfsData[agency].shapes || [];
    const routes = gtfsData[agency].routes || [];
    if (!shapes.length) return;

    const shapeMap = new Map();
    shapes.forEach(shape => {
        const shapeId = shape.shape_id?.trim();
        if (!shapeMap.has(shapeId)) shapeMap.set(shapeId, []);
        shapeMap.get(shapeId).push([parseFloat(shape.shape_pt_lat), parseFloat(shape.shape_pt_lon)]);
    });

    routes.forEach(route => {
        const routeColor = `#${route.route_color || '059600'}`;
        const routeTrips = trips.filter(t => t.route_id === route.route_id);
        const drawnShapes = new Set();

        routeTrips.forEach(trip => {
            const shapeId = trip.shape_id?.trim();
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
// 9. Iniciar app
// =============================
async function startApp() {
    await loadGTFSData('almassora');
    const map = initMap();
    drawStopsOnMap(map, 'almassora');
    drawRoutes(map, 'almassora');
}

startApp();