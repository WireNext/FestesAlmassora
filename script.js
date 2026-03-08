/**
 * ENGINE SANTA QUITÈRIA 2026 
 * Gestió de JSON + Pantalla Completa + Temps
 */

let dadesProgramacio = []; // Variable global per a les dades del JSON

// --- 1. NAVEGACIÓ ENTRE PESTANYES ---
function showPage(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    window.scrollTo(0, 0);
}

// --- 2. GESTIÓ DEL DETALL DE L'ACTE (PANTALLA COMPLETA) ---
function openActe(idActe) {
    let acte = null;
    dadesProgramacio.forEach(dia => {
        const trobat = dia.actes.find(a => a.id === idActe);
        if(trobat) acte = trobat;
    });

    if(acte) {
        document.getElementById("modal-img").src = acte.imatge;
        document.getElementById("modal-titol").innerText = acte.titol;
        document.getElementById("modal-info").innerText = `${acte.hora_inici}h - ${acte.hora_fi}h`;
        document.getElementById("modal-desc").innerText = acte.descripcio;
        
        // Generem la URL del mapa interactiu (Embed)
        // L'acte ha de tindre un camp "ubicacio" al JSON (ex: "Plaça de la Vila, Almassora")
        const query = encodeURIComponent(acte.ubicacio + ", Almassora");
        const mapUrl = `https://www.google.com/maps/embed/v1/place?key=LA_TEUA_API_KEY&q=${query}`;
        
        // Si no tens API Key de Google, podem usar el mètode sense Key (més limitat):
        const mapUrlNoKey = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        
        document.getElementById("modal-map-frame").src = mapUrlNoKey;
        document.getElementById("modal-map-link").href = `https://www.google.com/maps/search/?api=1&query=${query}`;
        
        const page = document.getElementById("event-modal");
        page.style.display = "block";
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
}

function closeModal() {
    document.getElementById("event-modal").style.display = "none";
    document.body.style.overflow = "auto";
}

// --- 3. FILTRATGE PER DIES ---
function selectDay(diaID, element) {
    document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');

    const container = document.getElementById("events-list-container");
    container.innerHTML = "";

    const diaSeleccionat = dadesProgramacio.find(d => d.dia_id === diaID);
    if(diaSeleccionat) {
        diaSeleccionat.actes.forEach(acte => {
            const card = document.createElement("div");
            card.className = "glass-card";
            card.style.marginBottom = "15px";
            card.style.cursor = "pointer";
            card.onclick = () => openActe(acte.id);
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <b style="font-size:17px; display:block;">${acte.titol}</b>
                        <span style="font-size:13px; color:var(--red); font-weight:700;">🕒 ${acte.hora_inici}h</span>
                    </div>
                    <span style="opacity:0.3;">〉</span>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// --- 4. TEMPS I UTILITATS ---
function toggleWeatherDetails() {
    const d = document.getElementById('weather-details');
    d.style.display = d.style.display === 'none' ? 'block' : 'none';
}

function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 82) return "🌦️";
    return "☁️";
}

// --- 5. INICIALITZACIÓ (DOM LOADED) ---
document.addEventListener("DOMContentLoaded", () => {
    const ara = new Date();
    const y = ara.getFullYear();
    const m = String(ara.getMonth() + 1).padStart(2, '0');
    const d = String(ara.getDate()).padStart(2, '0');
    const avuiISO = `${y}-${m}-${d}`;

    // A. Carregar Programació des de JSON
    fetch('programacion.json')
    .then(r => r.json())
    .then(data => {
        dadesProgramacio = data;
        const tabsCont = document.getElementById("days-tabs");
        const avuiScroll = document.getElementById("avui-scroll");

        data.forEach((dia, index) => {
            // Pestanyes de dies
            const btn = document.createElement("div");
            btn.className = `day-tab ${index === 0 ? 'active' : ''}`;
            btn.innerText = dia.titol_curt;
            btn.onclick = () => selectDay(dia.dia_id, btn);
            tabsCont.appendChild(btn);

            // Omplir Inici si coincideix amb data d'avui
            if(dia.data_iso === avuiISO) {
                dia.actes.forEach(acte => {
                    const mini = document.createElement("div");
                    mini.className = "event-mini-card";
                    mini.onclick = () => openActe(acte.id);
                    mini.innerHTML = `<b>${acte.hora_inici}h</b><p>${acte.titol}</p>`;
                    avuiScroll.appendChild(mini);
                });
            }
        });

        if(avuiScroll && avuiScroll.innerHTML === "") avuiScroll.innerHTML = "<p style='color:#666; padding:20px;'>No hi ha actes per a hui.</p>";
        if(data.length > 0) selectDay(data[0].dia_id, tabsCont.firstChild);
    });

    // B. Compte Enrere
    const target = new Date("May 10, 2026 00:00:00").getTime();
    setInterval(() => {
        const diff = target - new Date().getTime();
        if(diff > 0) {
            document.getElementById("days").innerText = Math.floor(diff / 86400000).toString().padStart(2, '0');
            document.getElementById("hours").innerText = Math.floor((diff % 86400000) / 3600000).toString().padStart(2, '0');
            document.getElementById("minutes").innerText = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        }
    }, 1000);

    // C. API del Temps
    fetch("https://api.open-meteo.com/v1/forecast?latitude=39.94&longitude=-0.06&current_weather=true&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m&daily=uv_index_max&timezone=auto")
    .then(r => r.json()).then(data => {
        const h = ara.getHours();
        document.getElementById("weather-main").innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><b style="font-size:18px;">Almassora Ara</b><br><small style="color:#888;">Clica per a la previsió</small></div>
                <span style="font-size:32px; font-weight:900; color:var(--red);">${Math.round(data.current_weather.temperature)}°C ${getWeatherIcon(data.current_weather.weathercode)}</span>
            </div>`;
        
        const hCont = document.getElementById("hourly-forecast");
        for(let i=h; i<h+12; i++) {
            hCont.innerHTML += `<div class="hour-item"><span>${i}:00</span><span style="font-size:20px;margin:5px 0;display:block;">${getWeatherIcon(data.hourly.weather_code[i])}</span><b>${Math.round(data.hourly.temperature_2m[i])}°</b></div>`;
        }
        
        document.getElementById("w-wind").innerText = data.current_weather.windspeed + " km/h";
        document.getElementById("w-humidity").innerText = data.hourly.relative_humidity_2m[h] + "%";
        document.getElementById("w-rain").innerText = data.hourly.precipitation_probability[h] + "%";
        document.getElementById("w-uv").innerText = data.daily.uv_index_max[0];
    });
});